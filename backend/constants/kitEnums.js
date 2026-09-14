// Canonical kit vocabulary. These arrays are the sole source for Mongoose,
// Zod, OpenAI JSON schemas, and pipeline normalization.
export const KIT_REQUIREMENT_KINDS = Object.freeze([
  "technical",
  "behavioral",
  "domain",
]);

export const KIT_REQUIREMENT_PRIORITIES = Object.freeze(["must", "nice"]);

export const KIT_QUESTION_CATEGORIES = Object.freeze([
  "technical",
  "behavioural",
  "system-design",
  "company-fit",
]);

export const KIT_STATUSES = Object.freeze([
  "pending",
  "queued",
  "crawling",
  "extracting_role",
  "building_questions",
  "generating_flashcards",
  "building_schedule",
  "completed",
  "failed",
  "cancelled",
]);

export const KIT_ACTIVE_STATUSES = Object.freeze([
  "pending",
  "queued",
  "crawling",
  "extracting_role",
  "building_questions",
  "generating_flashcards",
  "building_schedule",
]);

export const KNOWLEDGE_CATEGORIES = Object.freeze([
  "frontend",
  "backend",
  "database",
  "cloud",
  "devops",
  "testing",
  "mobile",
  "ai",
  "soft-skills",
  "general",
]);

export const normalizeRequirementKind = (value) => {
  if (value === "technical") return "technical";
  if (["behavioral", "behavioural", "soft-skill"].includes(value)) return "behavioral";
  return "domain";
};

export const normalizeRequirementPriority = (value) =>
  value === "must" ? "must" : "nice";

export const normalizeQuestionCategory = (value) =>
  KIT_QUESTION_CATEGORIES.includes(value) ? value : "technical";

export const normalizeRequirement = (requirement = {}) => ({
  ...requirement,
  kind: normalizeRequirementKind(requirement.kind),
  priority: normalizeRequirementPriority(requirement.priority),
});
