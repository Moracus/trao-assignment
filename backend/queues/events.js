import { EventEmitter } from "events";

export const eventEmitter = new EventEmitter();

export const emitKitUpdate = (
  kitId,
  status,
  progress
) => {
  eventEmitter.emit("kit:update", {
    kitId: String(kitId),
    status,
    progress,
  });
};