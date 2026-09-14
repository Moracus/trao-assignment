import { Worker } from "bullmq";
import Kit from "./models/Kit.js";
import { buildKit } from "./modules/pipeline/buildkits.js";
import { buildQuestionSet } from "./modules/llm/questions.js";
import { getFlashcardsForRequirement } from "./modules/knowledge/service.js";
import { buildSchedule } from "./modules/deterministic/scheduler.js";
import { emitKitUpdate } from "./queues/events.js";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";
import { WORKER_HEARTBEAT_KEY, WORKER_HEARTBEAT_TTL_SECONDS } from "./config/workerHealth.js";
import {
  normalizeQuestionCategory,
  normalizeRequirement,
} from "./constants/kitEnums.js";

connectDB();
const connection = redis;

let heartbeatTimer;
let worker;
const refreshHeartbeat = async () => {
  await redis.set(WORKER_HEARTBEAT_KEY, String(process.pid), "EX", WORKER_HEARTBEAT_TTL_SECONDS);
};

const startHeartbeat = async () => {
  await refreshHeartbeat();
  heartbeatTimer = setInterval(() => {
    refreshHeartbeat().catch((error) => console.error("Worker heartbeat failed:", error));
  }, 5000);
};

redis.once("ready", () => {
  startHeartbeat().catch((error) => console.error("Unable to start worker heartbeat:", error));
});
if (redis.status === "ready") startHeartbeat().catch((error) => console.error("Unable to start worker heartbeat:", error));

const stopHeartbeat = async () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  try { await redis.del(WORKER_HEARTBEAT_KEY); } catch { /* Redis may already be down. */ }
};

const shutdown = async () => {
  await stopHeartbeat();
  await worker?.close();
  await redis.quit().catch(() => {});
  process.exit(0);
};
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);

const assignQuestionIds = (qs) => qs.map((q, i) => ({
  id: `q${i + 1}`,
  ...q,
  category: normalizeQuestionCategory(q.category),
}));
const assignFlashcardIds = (cards) => cards.map((c, i) => ({ id: `f${i + 1}`, ...c }));

const normalizeKitEnums = (kit) => {
  if (kit?.role?.requirements) {
    kit.role.requirements = kit.role.requirements.map(normalizeRequirement);
  }
  if (kit?.questions) {
    kit.questions = kit.questions.map((question) => ({
      ...question.toObject?.() ?? question,
      category: normalizeQuestionCategory(question.category),
    }));
  }
  return kit;
};

const mergeGeneratedItems = (existing = [], regenerated = []) => {
  const result = [];
  const seen = new Set();
  const regeneratedById = new Map();

  for (const item of regenerated ?? []) {
    if (!item || item.deleted || !item.id) continue;
    regeneratedById.set(item.id, item);
  }

  for (const item of existing ?? []) {
    if (!item || item.deleted) continue;

    const isSticky = !!item.edited || !!item.pinned || item.generated === false;
    if (isSticky) {
      if (item.id) seen.add(item.id);
      result.push(item);
      continue;
    }

    if (item.id && regeneratedById.has(item.id)) {
      result.push(regeneratedById.get(item.id));
      seen.add(item.id);
    }
  }

  for (const item of regenerated ?? []) {
    if (!item || item.deleted || !item.id || seen.has(item.id)) continue;
    result.push(item);
    seen.add(item.id);
  }

  return result.filter((item) => !item.deleted);
};

const buildSectionResult = async (kit, section, daysAvailable) => {
  const normalizedSection = section === "brief" ? "companyBrief" : section;

  if (normalizedSection === "questions") {
    const requirements = kit.role?.requirements ?? [];
    const companyBrief = kit.company_brief ?? { summary: "", what_they_do: "" };

    emitKitUpdate(kit._id, "building_questions", 35, "questions", {
      section: "questions",
      status: "building_questions",
    });

    const questionResult = await buildQuestionSet(requirements, companyBrief);
    const questions = assignQuestionIds(questionResult.questions);
    const schedule = buildSchedule(daysAvailable ?? kit.schedule?.days_available ?? 14, questions, requirements);

    return {
      questions,
      coverage: questionResult.coverage,
      schedule,
    };
  }

  if (normalizedSection === "flashcards") {
    const requirements = kit.role?.requirements ?? [];
    const cards = [];

    emitKitUpdate(kit._id, "generating_flashcards", 35, "flashcards", {
      section: "flashcards",
      status: "generating_flashcards",
    });

    for (const requirement of requirements) {
      const generated = await getFlashcardsForRequirement(requirement);
      cards.push(...generated);
    }

    return {
      flashcards: assignFlashcardIds(cards),
    };
  }

  if (normalizedSection === "schedule") {
    const requirements = kit.role?.requirements ?? [];
    const questions = kit.questions ?? [];

    emitKitUpdate(kit._id, "building_schedule", 35, "schedule", {
      section: "schedule",
      status: "building_schedule",
    });

    const schedule = buildSchedule(daysAvailable ?? kit.schedule?.days_available ?? 14, questions, requirements);

    return {
      schedule,
    };
  }

  if (normalizedSection === "coverage") {
    return {
      coverage: {
        uncovered_requirement_ids: [],
        passes: 1,
        score: 100,
      },
    };
  }

  if (normalizedSection === "companyBrief") {
    const fallbackBrief = {
      summary: "",
      what_they_do: "couldn't rgenrate, edit or regenerate",
      sources: Array.isArray(kit.company_brief?.sources) ? kit.company_brief.sources : [],
    };

    return {
      company_brief: {
        ...(kit.company_brief ?? {}),
        ...fallbackBrief,
      },
    };
  }

  throw new Error(`Unsupported section: ${section}`);
};

const isCancelled = async (_id, jobId) => {
  const kit = await Kit.findOne({ _id, jobId }).select("status cancellationRequestedAt").lean();
  return !kit || kit.status === "cancelled" || Boolean(kit.cancellationRequestedAt);
};

const activeFilter = (_id, jobId) => ({ _id, jobId, status: { $ne: "cancelled" }, cancellationRequestedAt: null });

worker = new Worker(
  "kit-generation",
  async (job) => {
    const { _id, companyUrl, jobDescription, daysAvailable, section = null } = job.data;

    try {
      const kit = await Kit.findOne({ _id, jobId: String(job.id) });

      if (!kit) {
        console.error(`Kit not found or superseded: ${_id}`);
        return;
      }
      normalizeKitEnums(kit);
      if (await isCancelled(_id, String(job.id))) return;

      if (!section) {
        await Kit.findOneAndUpdate(activeFilter(_id, String(job.id)), {
          status: "crawling",
          progress: 10,
        });

        emitKitUpdate(_id, "crawling", 10, section);

        const result = await buildKit({
          companyUrl,
          jobDescription,
          daysAvailable,
          progress: async (status, progress) => {
            const exists = await Kit.exists(activeFilter(_id, String(job.id)));

            if (!exists) {
              throw new Error("KIT_CANCELLED_OR_NOT_FOUND");
            }

            await Kit.findOneAndUpdate(activeFilter(_id, String(job.id)), {
              status,
              progress,
            });

            emitKitUpdate(_id, status, progress, section);
          },
        });

        if (await isCancelled(_id, String(job.id))) return;
        const completed = await Kit.findOneAndUpdate(activeFilter(_id, String(job.id)), {
          status: "completed",
          progress: 100,
          data: result,
          source: result.source,
          company_brief: {
            ...(result.company_brief ?? {}),
            edited: { summary: false, what_they_do: false },
            pinned: false,
          },
          role: result.role,
          retrievalWarnings: result.retrievalWarnings ?? [],
          ...result,
        });

        if (completed) emitKitUpdate(_id, "completed", 100, section);
        return;
      }

      const normalizedSection = section === "brief" ? "companyBrief" : section;

      await Kit.findOneAndUpdate(activeFilter(_id, String(job.id)), {
        status: "queued",
        progress: 15,
      });

      emitKitUpdate(_id, "queued", 15, normalizedSection, {
        section: normalizedSection,
        pending: true,
      });

      const sectionResult = await buildSectionResult(kit, normalizedSection, daysAvailable);

      if (await isCancelled(_id, String(job.id))) return;

      await Kit.findOneAndUpdate(activeFilter(_id, String(job.id)), {
        status: normalizedSection === "questions" ? "building_questions" : normalizedSection === "flashcards" ? "generating_flashcards" : normalizedSection === "schedule" ? "building_schedule" : "queued",
        progress: 60,
      });

      if (sectionResult.questions) {
        kit.questions = mergeGeneratedItems(kit.questions ?? [], sectionResult.questions);
      }
      if (sectionResult.flashcards) {
        kit.flashcards = mergeGeneratedItems(kit.flashcards ?? [], sectionResult.flashcards);
      }
      if (sectionResult.company_brief) {
        kit.company_brief = {
          ...(kit.company_brief ?? {}),
          ...sectionResult.company_brief,
        };
      }
      if (sectionResult.coverage) {
        kit.coverage = {
          ...kit.coverage,
          ...sectionResult.coverage,
          last_checked: new Date(),
        };
      }
      if (sectionResult.schedule) {
        kit.schedule = {
          ...(kit.schedule ?? {}),
          days_available: daysAvailable ?? kit.schedule?.days_available ?? 14,
          days: sectionResult.schedule.days ?? [],
        };
      }

      if (sectionResult.retrievalWarnings) {
        kit.retrievalWarnings = sectionResult.retrievalWarnings;
      }

      if (await isCancelled(_id, String(job.id))) return;
      // Persist against the current job only, so a late job cannot overwrite a
      // cancellation or a newer regeneration request.
      kit.status = "completed";
      kit.progress = 100;
      kit.updatedAt = new Date();
      const update = kit.toObject();
      delete update._id;
      delete update.__v;
      const committed = await Kit.findOneAndUpdate(
        activeFilter(_id, String(job.id)),
        update,
        { new: true },
      );

      if (committed) emitKitUpdate(_id, "completed", 100, normalizedSection, {
        section: normalizedSection,
        status: "completed",
        result: sectionResult,
      });
    } catch (error) {
      console.error(`Kit worker error [${_id}]:`, error);

      if (await isCancelled(_id, String(job.id)) || error.message === "KIT_CANCELLED_OR_NOT_FOUND") return;
      const exists = await Kit.exists(activeFilter(_id, String(job.id)));

      if (exists) {
        await Kit.findOneAndUpdate(activeFilter(_id, String(job.id)), {
          status: "failed",
          progress: 0,
          error: { code: error.code ?? "GENERATION_FAILED", message: error.message },
        });

        emitKitUpdate(_id, "failed", 0, section ?? null, {
          section: section ?? null,
          error: error.message,
        });
      }

      throw error;
    }
  },
  { connection },
);
