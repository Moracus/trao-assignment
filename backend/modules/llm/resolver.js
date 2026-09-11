// modules/llm/resolver.js

import { z } from "zod";
import { openai, MODEL } from "./openai.js";
import { withRetry } from "./retry.js";

const OutputSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.enum([
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
  ]),
  aliases: z.array(z.string()),
});

const JSON_SCHEMA = {
  name: "knowledge_resolver",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      slug: { type: "string" },
      title: { type: "string" },
      category: {
        type: "string",
        enum: [
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
        ],
      },
      aliases: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["slug", "title", "category", "aliases"],
  },
};

export async function resolveKnowledge(requirement) {
  const res = await withRetry(() =>
    openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
Normalize software engineering requirements into ONE reusable knowledge topic.

Examples:
"3+ years of React" -> react
"TypeScript, React & Next.js" -> react
"REST APIs with Express" -> express
"Unit testing using Jest" -> jest

Return only one canonical topic.
Slug must be lowercase kebab-case.
          `,
        },
        {
          role: "user",
          content: JSON.stringify(requirement),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...JSON_SCHEMA,
        },
      },
    }),
  );

  return OutputSchema.parse(JSON.parse(res.output_text));
}
