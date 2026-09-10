import Kit from "../models/Kit.js";
import { retrieve } from "../modules/retrieval/index.js";
import { createDupHash } from "../utils/index.js";
import { jobRequestSchema } from "../zod/kit.schema.js";

export const buildKit = async (req, res) => {
  try {
    const result = jobRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues,
      });
    }
    const data = result.data;
    const hash = createDupHash(data.companyUrl, data.jobDescription);
    let kit = await Kit.findOne({ duplicateHash: hash ,status:"completed"});
    if (kit) {
      return res.status(200).json({
        reused: true,
        kit,
      });
    }

    kit = await Kit.create({
      companyUrl: data.companyUrl,
      jobDescription: data.jobDescription,
      duplicateHash: hash,
      status: "pending",
    });

    await Kit.findByIdAndUpdate(kit._id, { status: "crawling" });

    const retrieval = await retrieve(data.companyUrl);

    if (!retrieval.ok) {
      await Kit.findByIdAndUpdate(kit._id, {
        status: "failed",
        error: {
          code: "RETRIEVAL_FAILED",
          message: retrieval.error,
        },
      });

      return res.status(200).json({
        kitId: kit._id,
        status: "failed",
        retrieval,
      });
    }

    await Kit.findByIdAndUpdate(kit._id, {
      status: "completed", // temporary, until LLM exists
      retrievalWarnings: retrieval.warnings ?? [],
    });

    return res.status(201).json({
      kitId: kit._id,
      status: "completed",
      company: retrieval,
    });
  } catch (err) {
    console.log("ERROR",err)
    return res.status(500).json({ message: "Internal server error" });
  }
};
