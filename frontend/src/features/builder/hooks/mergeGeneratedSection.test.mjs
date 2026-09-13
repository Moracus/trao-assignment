import assert from "node:assert/strict";
import { mergeGeneratedSection } from "./mergeGeneratedSection.ts";

const existing = [
  { id: "q1", generated: true, edited: false, pinned: false, prompt: "old q1" },
  { id: "q2", generated: true, edited: true, pinned: false, prompt: "edited q2" },
  { id: "q3", generated: true, edited: false, pinned: false, prompt: "old q3" },
];

const regenerated = [
  { id: "q1", generated: true, edited: false, pinned: false, prompt: "new q1" },
  { id: "q2", generated: true, edited: true, pinned: false, prompt: "edited q2" },
  { id: "q3", generated: true, edited: false, pinned: false, prompt: "new q3" },
  { id: "q4", generated: true, edited: false, pinned: false, prompt: "new q4" },
];

const merged = mergeGeneratedSection(existing, regenerated);

assert.deepEqual(
  merged.map((item) => item.id),
  ["q1", "q2", "q3", "q4"],
  "generated items should be refreshed in place while sticky user edits remain fixed",
);
assert.equal(merged[1].prompt, "edited q2", "edited question must remain unchanged");
assert.equal(merged[0].prompt, "new q1", "stale generated question should refresh in its original slot");
assert.equal(merged[2].prompt, "new q3", "stale generated question should refresh in its original slot");
assert.equal(merged[3].prompt, "new q4", "new generated questions should be appended");

console.log("mergeGeneratedSection regression passed");
