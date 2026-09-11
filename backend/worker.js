import { Worker } from "bullmq";
import Kit from "./models/Kit.js";
import { buildKit } from "./modules/pipeline/buildkits.js";
import { emitKitUpdate } from "./queues/events.js";
import { redis } from "./config/redis.js";
import { connectDB } from "./config/db.js";

connectDB();
const connection = redis;

new Worker(
  "kit-generation",
  async (job) => {
    const { _id, companyUrl, jobDescription, daysAvailable } = job.data;

    await Kit.findByIdAndUpdate(_id, {
      status: "crawling",
      progress: 10,
    });

    emitKitUpdate(_id, "crawling", 10);

    const result = await buildKit({
      companyUrl: companyUrl,
      jobDescription: jobDescription,
      daysAvailable: daysAvailable,
      progress: async (status, progress) => {
        await Kit.findByIdAndUpdate(_id, {
          status,
          progress,
        });

        emitKitUpdate(_id, status, progress);
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

    emitKitUpdate(_id, "completed", 100);
  },
  { connection },
);
