import { redis } from "./redis.js";

export const WORKER_HEARTBEAT_KEY = "interview-kit:worker:heartbeat";
export const WORKER_HEARTBEAT_TTL_SECONDS = 15;

export const isWorkerAvailable = async () => {
  try {
    return Boolean(await redis.get(WORKER_HEARTBEAT_KEY));
  } catch (error) {
    console.error("Unable to read worker heartbeat:", error);
    return false;
  }
};
