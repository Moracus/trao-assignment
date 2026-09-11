import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL);

export const kitQueue = new Queue("kit-generation", {
  connection,
});

export const addKitJob = (data) =>
  kitQueue.add("generate", data);