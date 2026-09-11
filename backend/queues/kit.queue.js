import { Queue } from "bullmq";
import { redis } from "../config/redis.js";

const connection = redis;

export const kitQueue = new Queue("kit-generation", {
  connection,
});

export const addKitJob = (data) =>
  kitQueue.add("generate", data);