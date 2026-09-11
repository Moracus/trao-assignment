import Kit from "../models/Kit.js";
import { addKitJob } from "../queues/kit.queue.js";
import { createDupHash } from "../utils/index.js";
import { jobRequestSchema } from "../zod/kit.schema.js";
import { subscribeKitUpdates } from "../queues/events.js";

export const createKit = async (req, res) => {
  const parsed = jobRequestSchema.safeParse(req.body);

  if (!parsed.success) return res.status(400).json(parsed.error);

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

  const kit = await Kit.create({
    user: req.user.id,
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
};

export const getKits = async (req, res) => {
  const kits = await Kit.find({ user: req.user.id }).sort({ createdAt: -1 });

  res.json(kits);
};

export const getKit = async (req, res) => {
  const kit = await Kit.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!kit) return res.sendStatus(404);

  res.json(kit);
};

export const updateKit = async (req, res) => {
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
};

export const deleteKit = async (req, res) => {
  await Kit.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  res.sendStatus(204);
};

export const regenerateKit = async (req, res) => {
  const oldKit = await Kit.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!oldKit) return res.sendStatus(404);

  oldKit.status = "queued";
  oldKit.progress = 0;
  await oldKit.save();

  await addKitJob({
    kitId: oldKit._id,
    companyUrl: oldKit.companyUrl,
    jobDescription: oldKit.jobDescription,
    daysAvailable: req.body.daysAvailable || 14,
  });

  res.status(202).json({
    status: "queued",
  });
};

export const streamKit = async (req, res) => {
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
};
