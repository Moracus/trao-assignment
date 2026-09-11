import { redis } from "../config/redis.js";

const pub = redis.duplicate();
const sub = redis.duplicate();

export const emitKitUpdate = async (_id, status, progress) => {
  await pub.publish(
    "kit:update",
    JSON.stringify({
      _id: String(_id),
      status,
      progress,
    })
  );
};

export const subscribeKitUpdates = async (handler) => {
  await sub.subscribe("kit:update");

  const listener = (channel, message) => {
    if (channel !== "kit:update") return;
    handler(JSON.parse(message));
  };

  sub.on("message", listener);

  return () => {
    sub.off("message", listener);
    sub.unsubscribe("kit:update");
  };
};