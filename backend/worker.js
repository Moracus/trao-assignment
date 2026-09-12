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

    try {
      const kit = await Kit.findById(_id);

      if (!kit) {
        console.error(`Kit not found: ${_id}`);
        return;
      }

      await Kit.findByIdAndUpdate(_id, {
        status: "crawling",
        progress: 10,
      });

      emitKitUpdate(_id, "crawling", 10);

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
    } catch (error) {
      console.error(`Kit worker error [${_id}]:`, error);

      const exists = await Kit.exists({ _id });

      if (exists) {
        await Kit.findByIdAndUpdate(_id, {
          status: "failed",
          progress: 0,
          error: error.message,
        });

        emitKitUpdate(_id, "failed", 0);
      }

      throw error; // Let BullMQ mark the job as failed
    }
  },
  { connection },
);