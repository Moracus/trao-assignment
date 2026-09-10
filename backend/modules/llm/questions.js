// modules/llm/questions.js

import { z } from "zod";
import { openai, MODEL } from "./openai.js";
import { withRetry } from "./retry.js";
import { findCoverageGaps } from "../deterministic/coverage.js";

const QuestionSchema = z.object({
  requirement_ids: z.array(z.string()),
  category: z.enum(["technical", "behavioral", "experience", "system-design"]),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.number().int().min(1).max(3),
});

const OutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

const JSON_SCHEMA = {
  name: "interview_questions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            requirement_ids: {
              type: "array",
              items: { type: "string" },
            },
            category: {
              type: "string",
              enum: ["technical", "behavioral", "experience", "system-design"],
            },
            prompt: { type: "string" },
            answer_outline: { type: "string" },
            difficulty: {
              type: "integer",
              minimum: 1,
              maximum: 3,
            },
          },
          required: [
            "requirement_ids",
            "category",
            "prompt",
            "answer_outline",
            "difficulty",
          ],
        },
      },
    },
    required: ["questions"],
  },
};

function buildInput(requirements, companyBrief) {
  return JSON.stringify(
    {
      company: companyBrief,
      requirements,
    },
    null,
    2,
  );
}

export async function generateQuestions(
  requirements,
  companyBrief,
  { onlyIds = null } = {},
) {
  const selected = onlyIds
    ? requirements.filter((r) => onlyIds.includes(r.id))
    : requirements;
  const context = buildInput(selected, companyBrief);
  const response = await withRetry(async () => {
    return openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
Generate interview questions from the provided requirements.

Rules:
- Create 1–2 questions per MUST requirement.
- SHOULD requirements may receive one question.
- NICE requirements may be skipped.
- Every question must reference the relevant requirement_ids.
- Use company context only to tailor wording, never invent facts.
- Keep answer outlines concise bullet-style summaries.
          `.trim(),
        },
        {
          role: "user",
          content: context,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...JSON_SCHEMA,
        },
      },
    });
  });

  const parsed = OutputSchema.parse(JSON.parse(response.output_text));

  return parsed.questions;
}

const requirements = [
  {
    id: "r1",
    text: "React",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r2",
    text: "Node.js",
    kind: "technical",
    priority: "must",
  },
];

const companyBrief = {
  summary: "B2B SaaS company building workflow software.",
  what_they_do: "Develop internal productivity platforms.",
};





export async function buildQuestionSet(requirements, companyBrief) {
  const allQuestions = [];

  // Pass 1
  const firstPass = await generateQuestions(requirements, companyBrief);
  allQuestions.push(...firstPass);

  let uncovered = findCoverageGaps(requirements, allQuestions);

  // Pass 2 (only missing requirements)
  if (uncovered.length > 0) {
    const secondPass = await generateQuestions(
      requirements,
      companyBrief,
      { onlyIds: uncovered }
    );

    allQuestions.push(...secondPass);

    uncovered = findCoverageGaps(requirements, allQuestions);
  }

  return {
    questions: allQuestions,
    coverage: {
      uncovered_requirement_ids: uncovered,
      passes: uncovered.length === 0 ? 1 : 2,
    },
  };
}

console.log("gpting...");
console.log(await buildQuestionSet(requirements, companyBrief));




