import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

const connection = redis;

export const kitQueue = new Queue("kit-generation", {
  connection,
});

export const addKitJob = (data, jobId) => kitQueue.add("generate", data, { jobId });

export const getKitJob = async (jobId) => kitQueue.getJob(jobId);

export const removeKitJob = async (jobId) => {
  const job = await kitQueue.getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
};
