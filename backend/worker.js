import { Worker } from "bullmq";
import Kit from "./models/Kit.js";
import { buildKit } from "./modules/pipeline/buildkits.js";
import { buildQuestionSet } from "./modules/llm/questions.js";
import { getFlashcardsForRequirement } from "./modules/knowledge/service.js";
import { buildSchedule } from "./modules/deterministic/scheduler.js";
import { emitKitUpdate } from "./queues/events.js";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";

connectDB();
const connection = redis;

const assignQuestionIds = (qs) => qs.map((q, i) => ({ id: `q${i + 1}`, ...q }));
const assignFlashcardIds = (cards) => cards.map((c, i) => ({ id: `f${i + 1}`, ...c }));

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
    throw new Error("SECTION_REGEN_UNSUPPORTED: companyBrief requires stored retrieval data and is intentionally not falling back to a full-kit regenerate");
  }

  throw new Error(`Unsupported section: ${section}`);
};

new Worker(
  "kit-generation",
  async (job) => {
    const { _id, companyUrl, jobDescription, daysAvailable, section = null } = job.data;

    try {
      const kit = await Kit.findById(_id);

      if (!kit) {
        console.error(`Kit not found: ${_id}`);
        return;
      }

      if (!section) {
        await Kit.findByIdAndUpdate(_id, {
          status: "crawling",
          progress: 10,
        });

        emitKitUpdate(_id, "crawling", 10, section);

        const result = await buildKit({
          companyUrl,
          jobDescription,
          daysAvailable,
          progress: async (status, progress) => {
            const exists = await Kit.exists({ _id });

            if (!exists) {
              console.error(`Kit deleted during generation: ${_id}`);
              throw new Error("KIT_NOT_FOUND");
            }

            await Kit.findByIdAndUpdate(_id, {
              status,
              progress,
            });

            emitKitUpdate(_id, status, progress, section);
          },
        });

        await Kit.findByIdAndUpdate(_id, {
          status: "completed",
          progress: 100,
          data: result,
          source: result.source,
          company_brief: result.company_brief,
          role: result.role,
          ...result,
        });

        emitKitUpdate(_id, "completed", 100, section);
        return;
      }

      const normalizedSection = section === "brief" ? "companyBrief" : section;

      await Kit.findByIdAndUpdate(_id, {
        status: "queued",
        progress: 15,
      });

      emitKitUpdate(_id, "queued", 15, normalizedSection, {
        section: normalizedSection,
        pending: true,
      });

      const sectionResult = await buildSectionResult(kit, normalizedSection, daysAvailable);

      await Kit.findByIdAndUpdate(_id, {
        status: normalizedSection === "questions" ? "building_questions" : normalizedSection === "flashcards" ? "generating_flashcards" : normalizedSection === "schedule" ? "building_schedule" : "queued",
        progress: 60,
      });

      if (sectionResult.questions) {
        kit.questions = sectionResult.questions;
      }
      if (sectionResult.flashcards) {
        kit.flashcards = sectionResult.flashcards;
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

      kit.status = "completed";
      kit.progress = 100;
      kit.updatedAt = new Date();
      await kit.save();

      emitKitUpdate(_id, "completed", 100, normalizedSection, {
        section: normalizedSection,
        status: "completed",
        result: sectionResult,
      });
    } catch (error) {
      console.error(`Kit worker error [${_id}]:`, error);

      const exists = await Kit.exists({ _id });

      if (exists) {
        await Kit.findByIdAndUpdate(_id, {
          status: "failed",
          progress: 0,
          error: error.message,
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