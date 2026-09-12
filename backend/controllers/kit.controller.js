import Kit from "../models/Kit.js";
import { addKitJob, removeKitJob } from "../queues/kit.queue.js";
import { createDupHash } from "../utils/index.js";
import { jobRequestSchema } from "../zod/kit.schema.js";
import { subscribeKitUpdates } from "../queues/events.js";

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
      daysAvailable: oldKit?.daysAvailable || 14,
    });

    res.status(202).json({
      status: "queued",
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
