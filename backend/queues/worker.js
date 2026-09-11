import { Worker } from "bullmq";
import Kit from "../models/Kit.js";
import { buildKit } from "../modules/pipeline/buildkits.js";
import { emitKitUpdate } from "./events.js";

new Worker(
  "kit-generation",
  async (job) => {
    const { kitId, companyUrl, jobDescription, daysAvailable } = job.data;

    await Kit.findByIdAndUpdate(kitId, {
      status: "crawling",
      progress: 10,
    });

    emitKitUpdate(kitId, "crawling", 10);

    const result = await buildKit(
     { companyUrl:companyUrl,
      jobDescription:jobDescription,
      daysAvailable:daysAvailable,
      progress:async (status, progress) => {
        await Kit.findByIdAndUpdate(kitId, {
          status,
          progress,
        });

        emitKitUpdate(kitId, status, progress);
      }}
    );

    await Kit.findByIdAndUpdate(kitId, {
      status: "completed",
      progress: 100,
      data: result,
    });

    emitKitUpdate(kitId, "completed", 100);
  },
  { connection }
);