import Kit from "../models/Kit.js";
import { addKitJob, removeKitJob } from "../queues/kit.queue.js";
import { createDupHash } from "../utils/index.js";
import { jobRequestSchema } from "../zod/kit.schema.js";
import { subscribeKitUpdates } from "../queues/events.js";

const VALID_REGEN_SECTIONS = new Set([
  "questions",
  "flashcards",
  "companyBrief",
  "brief",
  "schedule",
  "coverage",
  "full",
]);

export const createKit = async (req, res) => {
  try {
    const parsed = jobRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const data = parsed.data;
    const hash = createDupHash(data.companyUrl, data.jobDescription);

    const existing = await Kit.findOne({
      duplicateHash: hash,
      status: "completed",
    });

    if (existing) {
      return res.json({
        reused: true,
        kit: existing,
      });
    }
    const company = new URL(data.companyUrl).hostname

    const kit = await Kit.create({
      user: req.user.id,
      company:company,
      companyUrl: data.companyUrl,
      jobDescription: data.jobDescription,
      duplicateHash: hash,
      status: "queued",
      progress: 0,
    });

    await addKitJob({
      _id: kit._id,
      ...data,
    });

    res.status(202).json({
      _id: kit._id,
      status: "queued",
    });
  } catch (error) {
    console.error("Create kit error:", error);
    res.status(500).json({ message: "Failed to create kit" });
  }
};

export const getKits = async (req, res) => {
  try {
    const kits = await Kit.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(kits);
  } catch (error) {
    console.error("Get kits error:", error);
    res.status(500).json({ message: "Failed to fetch kits" });
  }
};

export const getKit = async (req, res) => {
  try {
    const kit = await Kit.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!kit) return res.sendStatus(404);

    res.json(kit);
  } catch (error) {
    console.error("Get kit error:", error);
    res.status(500).json({ message: "Failed to fetch kit" });
  }
};

export const updateKit = async (req, res) => {
  try {
    const kit = await Kit.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
        status: "completed",
      },
      {
        data: req.body.data,
      },
      { new: true },
    );

    if (!kit) return res.sendStatus(404);

    res.json(kit);
  } catch (error) {
    console.error("Update kit error:", error);
    res.status(500).json({ message: "Failed to update kit" });
  }
};

export const deleteKit = async (req, res) => {
  try {
    const kit = await Kit.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!kit) return res.sendStatus(404);

    if (kit.status !== "completed") {
      await removeKitJob(kit._id.toString());
    }

    await kit.deleteOne();

    res.sendStatus(204);
  } catch (error) {
    console.error("Delete kit error:", error);
    res.status(500).json({ message: "Failed to delete kit" });
  }
};

export const regenerateKit = async (req, res) => {
  try {
    const requestedSection = String(req.body?.section ?? "full");

    if (!VALID_REGEN_SECTIONS.has(requestedSection)) {
      return res.status(400).json({
        message: "Invalid section for regeneration",
        allowed: [...VALID_REGEN_SECTIONS],
      });
    }

    const oldKit = await Kit.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!oldKit) return res.sendStatus(404);

    oldKit.status = "queued";
    oldKit.progress = 0;
    await oldKit.save();

    await addKitJob({
      _id: oldKit._id,
      companyUrl: oldKit.companyUrl,
      jobDescription: oldKit.jobDescription,
      daysAvailable: oldKit?.schedule?.days_available ?? oldKit?.daysAvailable ?? 14,
      section: requestedSection === "full" ? null : requestedSection,
    });

    res.status(202).json({
      status: "queued",
      section: requestedSection,
    });
  } catch (error) {
    console.error("Regenerate kit error:", error);
    res.status(500).json({ message: "Failed to regenerate kit" });
  }
};

export const streamKit = async (req, res) => {
  try {
    const id = req.params.id;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const unsubscribe = await subscribeKitUpdates((payload) => {
      if (payload._id !== id) return;

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    });

    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  } catch (error) {
    console.error("Stream kit error:", error);

    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to stream kit updates" });
    } else {
      res.end();
    }
  }
};

const buildQuestionUpdate = (current, patch) => {
  const next = { ...current, ...patch };

  if (patch.prompt !== undefined || patch.answer_outline !== undefined || patch.difficulty !== undefined || patch.category !== undefined) {
    next.edited = true;
  }

  next.updatedAt = new Date();
  return next;
};

const buildFlashcardUpdate = (current, patch) => {
  const next = { ...current, ...patch };

  if (patch.front !== undefined || patch.back !== undefined || patch.requirement_ids !== undefined) {
    next.edited = true;
  }

  next.updatedAt = new Date();
  return next;
};

export const updateQuestion = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    const item = kit.questions.find((q) => q.id === req.params.id);
    if (!item) return res.sendStatus(404);

    const patch = req.body || {};
    const nextQuestions = kit.questions.map((q) => 
      q.id === req.params.id ? buildQuestionUpdate(q.toObject ? q.toObject() : q, patch) : q,
    );

    kit.questions = nextQuestions;
    await kit.save();
    res.json(kit.questions.find((q) => q.id === req.params.id));
  } catch (error) {
    console.error("Update builder question error:", error);
    res.status(500).json({ message: "Failed to update question" });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    const payload = req.body || {};
    const question = {
      id: payload.id || `q${Date.now()}-${Math.random().toString(16).slice(2)}`,
      category: payload.category || "technical",
      prompt: payload.prompt || "",
      answer_outline: payload.answer_outline || "",
      difficulty: payload.difficulty ?? 1,
      requirement_ids: payload.requirement_ids || [],
      generated: payload.generated ?? false,
      edited: payload.edited ?? true,
      pinned: payload.pinned ?? false,
      deleted: false,
      updatedAt: new Date(),
      order: payload.order ?? (kit.questions.length + 1) * 1000,
    };

    kit.questions = [...(kit.questions || []), question];
    await kit.save();
    res.status(201).json(question);
  } catch (error) {
    console.error("Create builder question error:", error);
    res.status(500).json({ message: "Failed to create question" });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    kit.questions = kit.questions.map((q) =>
      q.id === req.params.id ? { ...q.toObject ? q.toObject() : q, deleted: true, updatedAt: new Date() } : q,
    );

    await kit.save();
    res.json({ deleted: true, id: req.params.id });
  } catch (error) {
    console.error("Delete builder question error:", error);
    res.status(500).json({ message: "Failed to delete question" });
  }
};

export const reorderQuestions = async (req, res) => {
  try {
    const { category, orderedIds = [] } = req.body || {};
    console.log(req.params);
    console.log(req.user.id);
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    const orderedMap = new Map();
    orderedIds.forEach((id, index) => orderedMap.set(id, index));

    kit.questions = (kit.questions || []).map((q) => {
      if (q.category !== category || q.deleted) return q;
      const position = orderedMap.get(q.id);
      if (position === undefined) return q;
      return { ...q.toObject ? q.toObject() : q, order: (position + 1) * 1000, updatedAt: new Date() };
    });

    await kit.save();
    res.json({ ok: true });
  } catch (error) {
    console.error("Reorder questions error:", error);
    res.status(500).json({ message: "Failed to reorder questions" });
  }
};

export const moveQuestion = async (req, res) => {
  try {
    const { category } = req.body || {};
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    kit.questions = (kit.questions || []).map((q) => {
      if (q.id !== req.params.id) return q;
      return { ...q.toObject ? q.toObject() : q, category, edited: true, updatedAt: new Date() };
    });

    await kit.save();
    res.json({ ok: true, id: req.params.id, category });
  } catch (error) {
    console.error("Move question error:", error);
    res.status(500).json({ message: "Failed to move question" });
  }
};

export const updateFlashcard = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    const flashcards = kit.flashcards || [];
    const item = flashcards.find((c) => c.id === req.params.id);
    if (!item) return res.sendStatus(404);

    kit.flashcards = flashcards.map((c) =>
      c.id === req.params.id ? buildFlashcardUpdate(c.toObject ? c.toObject() : c, req.body || {}) : c,
    );

    await kit.save();
    res.json(kit.flashcards.find((c) => c.id === req.params.id));
  } catch (error) {
    console.error("Update flashcard error:", error);
    res.status(500).json({ message: "Failed to update flashcard" });
  }
};

export const createFlashcard = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    const payload = req.body || {};
    const card = {
      id: payload.id || `f${Date.now()}-${Math.random().toString(16).slice(2)}`,
      front: payload.front || "",
      back: payload.back || "",
      requirement_ids: payload.requirement_ids || [],
      generated: payload.generated ?? false,
      edited: payload.edited ?? true,
      pinned: payload.pinned ?? false,
      deleted: false,
      updatedAt: new Date(),
    };

    kit.flashcards = [...(kit.flashcards || []), card];
    await kit.save();
    res.status(201).json(card);
  } catch (error) {
    console.error("Create flashcard error:", error);
    res.status(500).json({ message: "Failed to create flashcard" });
  }
};

export const deleteFlashcard = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    kit.flashcards = (kit.flashcards || []).map((card) =>
      card.id === req.params.id ? { ...card.toObject ? card.toObject() : card, deleted: true, updatedAt: new Date() } : card,
    );

    await kit.save();
    res.json({ deleted: true, id: req.params.id });
  } catch (error) {
    console.error("Delete flashcard error:", error);
    res.status(500).json({ message: "Failed to delete flashcard" });
  }
};

export const updateCompanyBrief = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.kitId, user: req.user.id });
    if (!kit) return res.sendStatus(404);

    const patch = req.body || {};
    const nextBrief = {
      ...(kit.company_brief || {}),
      ...patch,
      edited: {
        summary: patch.summary !== undefined ? true : !!(kit.company_brief?.edited?.summary),
        what_they_do: patch.what_they_do !== undefined ? true : !!(kit.company_brief?.edited?.what_they_do),
      },
    };

    if (patch.summary !== undefined) nextBrief.summary = patch.summary;
    if (patch.what_they_do !== undefined) nextBrief.what_they_do = patch.what_they_do;

    kit.company_brief = nextBrief;
    await kit.save();
    res.json(kit.company_brief);
  } catch (error) {
    console.error("Update company brief error:", error);
    res.status(500).json({ message: "Failed to update company brief" });
  }
};
