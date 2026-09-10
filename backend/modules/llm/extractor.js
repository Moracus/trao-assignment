// modules/llm/extractor.js

import { z } from "zod";
import { openai, MODEL } from "./openai.js";
import { withRetry } from "./retry.js";

const RequirementSchema = z.object({
  text: z.string().min(3),
  category: z.enum([
    "frontend",
    "backend",
    "fullstack",
    "database",
    "cloud",
    "devops",
    "testing",
    "mobile",
    "ai",
    "soft-skills",
    "general",
  ]),
  priority: z.enum(["must", "should", "nice"]),
});

const OutputSchema = z.object({
  requirements: z.array(RequirementSchema),
});

const JSON_SCHEMA = {
  name: "requirements_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      requirements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            category: {
              type: "string",
              enum: [
                "frontend",
                "backend",
                "fullstack",
                "database",
                "cloud",
                "devops",
                "testing",
                "mobile",
                "ai",
                "soft-skills",
                "general",
              ],
            },
            priority: {
              type: "string",
              enum: ["must", "should", "nice"],
            },
          },
          required: ["text", "category", "priority"],
          additionalProperties: false,
        },
      },
    },
    required: ["requirements"],
    additionalProperties: false,
  },
};

function assignIds(requirements) {
  return requirements.map((req, i) => ({
    id: `REQ_${String(i + 1).padStart(3, "0")}`,
    ...req,
  }));
}

export async function extractRequirements(jobDescription) {
  const data = await withRetry(async () => {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
You extract hiring requirements from job descriptions.

Rules:
- Extract only explicit requirements.
- Do not invent experience.
- Merge duplicates.
- Categorize each requirement.
- Priority:
  must = required/mandatory
  should = preferred/bonus
  nice = optional
          `.trim(),
        },
        {
          role: "user",
          content: jobDescription,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...JSON_SCHEMA,
        },
      },
    });

    const parsed = JSON.parse(response.output_text);
    return OutputSchema.parse(parsed);
  });

  return {
    requirements: assignIds(data.requirements),
  };
}