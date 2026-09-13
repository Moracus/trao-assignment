import { AppendixASchema } from "../../zod/appendixKit.schema.js";
import { retrieve } from "../retrieval/index.js";
import { extractRole } from "../llm/extractor.js";
import { generateCompanyBrief } from "../llm/company.js";
import { buildQuestionSet } from "../llm/questions.js";
import { getFlashcardsForRequirement } from "../knowledge/service.js";
import { buildSchedule } from "../deterministic/scheduler.js";

const GENERATION_PLACEHOLDER = "couldn't generate, edit or regenerate";

const assignRequirementIds = (reqs = []) =>
  reqs.map((r, i) => ({
    id: r.id ?? `r${i + 1}`,
    text: String(r.text ?? "").trim(),
    kind: r.kind ?? "others",
    priority: r.priority ?? "nice",
  }));

const assignQuestionIds = (qs = []) =>
  qs.map((q, i) => ({
    id: q.id ?? `q${i + 1}`,
    requirement_ids: Array.isArray(q.requirement_ids) ? q.requirement_ids : [],
    category: q.category ?? "technical",
    prompt: String(q.prompt ?? "").trim(),
    answer_outline: String(q.answer_outline ?? "").trim(),
    difficulty: Number.isInteger(q.difficulty) ? q.difficulty : 1,
  }));

const assignFlashcardIds = (cards = []) =>
  cards.map((c, i) => ({
    id: c.id ?? `f${i + 1}`,
    front: String(c.front ?? "").trim(),
    back: String(c.back ?? "").trim(),
    requirement_ids: Array.isArray(c.requirement_ids) ? c.requirement_ids : [],
  }));

const fallbackRequirementsFromText = (jobDescription = "") => {
  const text = String(jobDescription || "");
  const tokens = [
    { pattern: /node\.?js|nodejs/i, text: "Node.js", kind: "technical", priority: "must" },
    { pattern: /react|next\.?js|javascript|typescript/i, text: "React / TypeScript", kind: "technical", priority: "must" },
    { pattern: /sql|postgres|database/i, text: "Database design and querying", kind: "technical", priority: "nice" },
    { pattern: /aws|cloud|kubernetes|docker/i, text: "Cloud and deployment experience", kind: "technical", priority: "nice" },
    { pattern: /lead|mentor|ownership|cross[- ]functional/i, text: "Stakeholder communication and mentorship", kind: "soft-skill", priority: "nice" },
    { pattern: /system design|architecture/i, text: "System design", kind: "technical", priority: "must" },
    { pattern: /product|ux|user|customer/i, text: "User-centric product thinking", kind: "experience", priority: "nice" },
  ];

  const requirements = [];
  for (const token of tokens) {
    if (!token.pattern.test(text)) continue;
    requirements.push({
      id: `r${requirements.length + 1}`,
      text: token.text,
      kind: token.kind,
      priority: token.priority,
    });
  }

  if (requirements.length === 0 && text.trim()) {
    requirements.push({
      id: "r1",
      text: text.trim().slice(0, 120) || "Core role responsibilities",
      kind: "others",
      priority: "must",
    });
  }

  return requirements;
};

const fallbackRole = (jobDescription = "") => {
  const safeJD = String(jobDescription || "");
  const requirements = fallbackRequirementsFromText(safeJD);

  return {
    title: safeJD.trim() ? "Role details unavailable" : "No role details provided",
    seniority: "Unknown",
    responsibilities: safeJD
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line && line.length < 120)
      .slice(0, 3),
    requirements,
  };
};

const fallbackCompanyBrief = (pages = []) => ({
  summary: "",
  what_they_do: GENERATION_PLACEHOLDER,
  sources: (Array.isArray(pages) ? pages : []).map((page) => page?.url).filter(Boolean),
});

const buildGenericFlashcards = (requirements = []) =>
  requirements.map((requirement, index) => ({
    id: `f${index + 1}`,
    front: requirement.text || `Review ${index + 1}`,
    back: `Explain how this requirement shows up in practice, why it matters, and how you would discuss it in an interview.`,
    requirement_ids: [requirement.id],
  }));

const buildBaseSource = (companyUrl, jobDescription, location = "") => {
  let company = "unknown";

  try {
    company = new URL(companyUrl).hostname || "unknown";
  } catch {
    company = "unknown";
  }

  return {
    company,
    company_url: companyUrl || "",
    role: "Role details unavailable",
    location,
    jd_chars: String(jobDescription || "").length,
    researched_at: new Date().toISOString(),
    pages_used: [],
  };
};

export async function buildKit({
  companyUrl,
  jobDescription,
  daysAvailable,
  progress = async () => {},
  location = "",
}) {
  const safeCompanyUrl = String(companyUrl || "").trim();
  const safeJD = String(jobDescription || "");
  const safeDays = Number.isFinite(daysAvailable) ? Math.max(1, Number(daysAvailable)) : 1;
  const warnings = [];

  await progress("crawling", 15);

  let retrieval = {
    ok: false,
    pages: [],
    warnings: [],
    error: "Company site could not be retrieved",
  };

  if (safeCompanyUrl) {
    try {
      retrieval = await retrieve(safeCompanyUrl);
    } catch (error) {
      warnings.push(error?.message || "Company site retrieval failed");
      retrieval = {
        ok: false,
        pages: [],
        warnings,
        error: error?.message || "Company site retrieval failed",
      };
    }
  }

  if (!retrieval.ok) {
    warnings.push(retrieval?.error || "Company site retrieval failed");
  }

  const baseSource = buildBaseSource(safeCompanyUrl, safeJD, location);
  const partialSource = {
    ...baseSource,
    pages_used: Array.isArray(retrieval?.pages) ? retrieval.pages.map((page) => page?.url).filter(Boolean) : [],
  };

  let role = fallbackRole(safeJD);
  let requirements = assignRequirementIds(role.requirements);
  let companyBrief = fallbackCompanyBrief(retrieval?.pages || []);

  await progress("extracting_role", 45);
  try {
    const extracted = await extractRole(safeJD);
    role = extracted;
    requirements = assignRequirementIds(extracted.requirements || []);
  } catch (error) {
    warnings.push(`Role extraction failed: ${error?.message || "unknown"}`);
    role = fallbackRole(safeJD);
    requirements = assignRequirementIds(role.requirements || []);
  }

  try {
    if (retrieval?.ok && Array.isArray(retrieval.pages) && retrieval.pages.length > 0) {
      const generatedBrief = await generateCompanyBrief(retrieval.pages);
      companyBrief = {
        summary: String(generatedBrief?.summary ?? "").trim(),
        what_they_do: String(generatedBrief?.what_they_do ?? "").trim() || GENERATION_PLACEHOLDER,
        sources: retrieval.pages
          .filter((page) => page?.type === "homepage" || page?.type === "about")
          .map((page) => page?.url)
          .filter(Boolean),
      };
    }
  } catch (error) {
    warnings.push(`Company brief generation failed: ${error?.message || "unknown"}`);
    companyBrief = fallbackCompanyBrief(retrieval?.pages || []);
  }

  let questions = [];
  let coverage = {
    uncovered_requirement_ids: requirements.map((req) => req.id),
    passes: 1,
  };

  await progress("building_questions", 75);
  try {
    if (requirements.length > 0) {
      const questionResult = await buildQuestionSet(requirements, companyBrief);
      questions = assignQuestionIds(questionResult.questions || []);
      coverage = {
        ...(questionResult.coverage || {}),
        uncovered_requirement_ids: (questionResult.coverage?.uncovered_requirement_ids || []).filter(Boolean),
        passes: Number(questionResult.coverage?.passes) || 1,
      };
    }
  } catch (error) {
    warnings.push(`Question generation failed: ${error?.message || "unknown"}`);
    questions = [];
    coverage = {
      uncovered_requirement_ids: requirements.map((req) => req.id),
      passes: 1,
    };
  }

  let flashcards = [];
  await progress("generating_flashcards", 85);
  try {
    if (requirements.length > 0) {
      for (const requirement of requirements) {
        const cards = await getFlashcardsForRequirement(requirement);
        flashcards.push(...cards);
      }
    }
  } catch (error) {
    warnings.push(`Flashcard generation failed: ${error?.message || "unknown"}`);
    flashcards = [];
  }

  if (flashcards.length === 0 && requirements.length > 0) {
    flashcards = buildGenericFlashcards(requirements);
  }

  const finalFlashcards = assignFlashcardIds(flashcards);

  await progress("building_schedule", 90);
  let schedule;
  try {
    schedule = buildSchedule(safeDays, questions, requirements);
  } catch (error) {
    warnings.push(`Schedule generation failed: ${error?.message || "unknown"}`);
    schedule = {
      days_available: safeDays,
      days: Array.from({ length: safeDays }, (_, index) => ({
        day: index + 1,
        focus: "Revision",
        question_ids: [],
        minutes: 0,
      })),
    };
  }

  const appendix = {
    source: {
      ...partialSource,
      role: role.title || "Role details unavailable",
    },
    company_brief: {
      summary: String(companyBrief?.summary ?? "").trim(),
      what_they_do: String(companyBrief?.what_they_do ?? "").trim() || GENERATION_PLACEHOLDER,
      sources: Array.isArray(companyBrief?.sources) ? companyBrief.sources.filter(Boolean) : [],
    },
    role: {
      title: role.title || "Role details unavailable",
      seniority: role.seniority || "Unknown",
      responsibilities: Array.isArray(role.responsibilities) ? role.responsibilities.map(String) : [],
      requirements,
    },
    questions: assignQuestionIds(questions),
    flashcards: finalFlashcards,
    schedule,
    coverage,
  };

  const validated = AppendixASchema.parse(appendix);

  return {
    ...validated,
    retrievalWarnings: warnings,
  };
}
