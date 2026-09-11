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
  //   owner,
  companyUrl,
  jobDescription,
  location="",
  daysAvailable,
}) {
  const duplicateHash = hash(companyUrl, jobDescription);

  const existing = await Kit.findOne({ duplicateHash }).lean();

  if (existing) return existing;

  const company = new URL(companyUrl).hostname

  /* ------------------------ 1. Website Retrieval ------------------------ */

  const retrieval = await retrieve(companyUrl);
  console.log("retrieving")

  if (!retrieval.ok) throw new Error(retrieval.error);

  /* ------------------------ 2. Extract Role ----------------------------- */

  const role = await extractRole(jobDescription);
  console.log("extracting")

  const requirements = assignRequirementIds(role.requirements);
  console.log("requirements")

  /* ------------------------ 3. Company Brief ---------------------------- */

  const companyBrief = await generateCompanyBrief(retrieval.pages);
  console.log("company brief")

  /* ------------------------ 4–6. Questions ----------------------------- */

  const questionResult = await buildQuestionSet(requirements, companyBrief);
  console.log("gen questions")

  const questions = assignQuestionIds(questionResult.questions);

  /* ------------------------ 7. Flashcards ------------------------------ */

  const flashcards = [];

  for (const requirement of requirements) {
    const cards = await getFlashcardsForRequirement(requirement);
    flashcards.push(...cards);
  }

  const finalFlashcards = assignFlashcardIds(flashcards);

  /* ------------------------ 8. Schedule ------------------------------- */

  const schedule = buildSchedule(daysAvailable, questions, requirements);
  console.log("Scheduled")

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

  const document = await Kit.create({
    // owner,
    duplicateHash,
    companyUrl,
    jobDescription,

    status: "completed",

    ...validated,

    source: {
      ...validated.source,
      researched_at: new Date(validated.source.researched_at),
    },

    role: {
      ...validated.role,
      requirements: validated.role.requirements.map((r) => ({
        ...r,
        knowledge_slug: knowledgeMap.get(r.id) ?? "general",
      })),
    },
    schedule:schedule,

    retrievalWarnings: retrieval.warnings,
  });

  return validated;
}

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "test",
    });

    console.log("MongoDB connected");
  } catch (err) {
    console.error("Failed to connect");
    console.error(err);
    process.exit(1);
  }
};

await connectDB();
const jd =
  "##  job\n\n**About Writesonic**\n\nEvery day, millions turn to AI for answers—and if your brand isn't there, you're nowhere. Writesonic is leading the way with the world's most advanced AI and Generative Engine Optimization (GEO) platform, helping monitor and improve visibility across AI search engines like ChatGPT, Claude, Perplexity, and Google AI Overviews.\n\nTrusted by marketers worldwide, Writesonic unifies GEO insights with traditional SEO—helping businesses understand how AI sees their brand and giving them the tools to fix it fast.\n\n**Requirements**\n\n**🚀 We're Hiring: Full Stack Developer**\n\nAre you passionate about building fast, scalable, and beautifully crafted products? Do you thrive in high-ownership roles and love the adrenaline of shipping great features at lightning speed?\n\nWe're looking for a sharp, motivated Full Stack Developer who enjoys solving real-world problems with code and is excited to build products that scale. If you're someone with a strong frontend focus, but confident across the full stack—and you care deeply about clean code and great UX—we'd love to chat.\n\n***🌟 We're especially excited to meet folks from Tier 1 engineering colleges (IITs, BITS, IIITs, NITs) or those who have worked at Y Combinator-backed startups.***\n\n**What You'll Be Doing** 🛠 Build and maintain high-performance, user-centric web apps using TypeScript, React/Next.js, and Python. 🤝 Collaborate with design, product, and backend teams to ship features end-to-end. 🎯 Translate UI/UX designs into responsive, pixel-perfect code. 🚀 Optimize applications for speed, performance, and scalability. 🔍 Debug, test, and fix bugs across the stack—ensuring a seamless user experience. 📈 Stay current with the latest in frontend/backend trends, tools, and best practices.\n\n**What We're Looking For**\n\n- 1-3 years of professional experience in full stack development (with a strong frontend bias)\n- Solid command of TypeScript and React/Next.js is a must\n- Strong understanding of HTML5, CSS3, and responsive design\n- Working knowledge of Python and backend logic\n- Experience integrating RESTful APIs\n- Familiar with auth frameworks like JWT\n- Natural problem-solver with a knack of debugging and optimization\n- Clear communicator—both in code and in conversation\n\n\n\n**Why You'll Love Working With Us** 💰 Competitive salary + performance-based opportunities. 🔁 Potential to **earn up to 1.5x your monthly pay as overtime**—we believe in rewarding hustle and commitment. ⚙️ Work alongside some of the **best engineering minds—learn fast, grow faster.** 🚀 We're a team that ships fast, and you'll gain hands-on exposure from day one. 🏝 **Flexible hours and remote-first culture.** 🎯 High-impact role with complete ownership and autonomy.\n\nWe're a small, fast-moving team that values raw talent, intellectual rigor, and execution speed. We're building a team of top-tier problem-solvers and creators—if you're from a Tier 1 CS/ECE program or have worked at a YC-backed company, you'll feel right at home.\n\nwrite a cover letter for this jd";
// const res = await buildKit({
//   companyUrl: "https://microsoft.com",
//   jobDescription: jd,
//   daysAvailable: 7,
// });
// Pretty-prints with a 2-space indentation
// console.log(JSON.stringify(res, null, 2));

