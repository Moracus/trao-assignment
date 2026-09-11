import Kit from "../../models/Kit.js";
import Flashcard from "../../models/Flashcard.js";
import { AppendixASchema } from "../../zod/appendixKit.schema.js";

import { retrieve } from ".././retrieval/index.js";
import { extractRole } from ".././llm/extractor.js";
import { generateCompanyBrief } from ".././llm/company.js";

import { buildQuestionSet } from ".././llm/questions.js";
import { getFlashcardsForRequirement } from ".././knowledge/service.js";

import { buildSchedule } from "../deterministic/scheduler.js";

import crypto from "crypto";
import { normalizeJobDescription } from "../../utils/index.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
function hash(companyUrl, jd) {
  return crypto
    .createHash("sha256")
    .update(companyUrl + jd)
    .digest("hex");
}

const assignRequirementIds = (reqs) =>
  reqs.map((r, i) => ({ id: `r${i + 1}`, ...r }));

const assignQuestionIds = (qs) => qs.map((q, i) => ({ id: `q${i + 1}`, ...q }));

const assignFlashcardIds = (cards) =>
  cards.map((c, i) => ({
    id: `f${i + 1}`,
    front: c.front,
    back: c.back,
    requirement_ids: c.requirement_ids,
  }));

export async function buildKit({
  companyUrl,
  jobDescription,
  daysAvailable,
  progress = async (status, progress) => {
    (status, progress);
  },
  location = "",
}) {
  const duplicateHash = hash(companyUrl, jobDescription);

  const existing = await Kit.findOne({ duplicateHash }).lean();

  //   if (existing) return existing;

  const company = new URL(companyUrl).hostname;

  /* ------------------------ 1. Website Retrieval ------------------------ */
  await progress("crawling", 15);
  const retrieval = await retrieve(companyUrl);

  if (!retrieval.ok) throw new Error(retrieval.error);

  /* ------------------------ 2. Extract Role ----------------------------- */
  await progress("generating", 45);

  const role = await extractRole(jobDescription);
  console.log("extracting");

  const requirements = assignRequirementIds(role.requirements);
  console.log("requirements");

  /* ------------------------ 3. Company Brief ---------------------------- */

  const companyBrief = await generateCompanyBrief(retrieval.pages);
  console.log("company brief");

  /* ------------------------ 4–6. Questions ----------------------------- */

  await progress("generating", 75);

  const questionResult = await buildQuestionSet(requirements, companyBrief);
  console.log("gen questions");

  const questions = assignQuestionIds(questionResult.questions);

  /* ------------------------ 7. Flashcards ------------------------------ */

  const flashcards = [];

  for (const requirement of requirements) {
    const cards = await getFlashcardsForRequirement(requirement);
    flashcards.push(...cards);
  }

  const finalFlashcards = assignFlashcardIds(flashcards);

  /* ------------------------ 8. Schedule ------------------------------- */
  await progress("generating", 90);

  const schedule = buildSchedule(daysAvailable, questions, requirements);
  console.log("Scheduled");

  /* --------------------- Appendix A JSON ------------------------------ */

  const appendix = {
    source: {
      company,
      company_url: companyUrl,
      role: role.title,
      location,
      jd_chars: jobDescription.length,
      researched_at: new Date().toISOString(),
      pages_used: retrieval.pages.map((p) => p.url),
    },

    company_brief: {
      summary: companyBrief.summary,
      what_they_do: companyBrief.what_they_do,
      sources: retrieval.pages
        .filter((p) => p.type === "homepage" || p.type === "about")
        .map((p) => p.url),
    },

    role: {
      title: role.title,
      seniority: role.seniority,
      responsibilities: role.responsibilities,
      requirements,
    },

    questions,

    flashcards: finalFlashcards,

    schedule,

    coverage: questionResult.coverage,
  };

  // Strict validation
  const validated = AppendixASchema.parse(appendix);

  /* ---------------------- Persist to Mongo ---------------------------- */

  // inject knowledge_slug for persistence only
  const knowledgeMap = new Map();

  for (const req of requirements) {
    const cards = await Flashcard.find({
      _id: { $exists: false },
      knowledge_slug: { $exists: true },
    })
      .select("knowledge_slug")
      .limit(1);

    if (cards.length) knowledgeMap.set(req.id, cards[0].knowledge_slug);
  }

  return validated;
}
