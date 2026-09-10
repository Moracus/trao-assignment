import { z } from "zod";
import { openai, MODEL } from "./openai.js";
import { withRetry } from "./retry.js";

const CardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

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
  cards: z.array(CardSchema).length(3),
});

const JSON_SCHEMA = {
  name: "knowledge_flashcards",
  strict: true,
  schema: {
    type: "object",
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
      cards: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            front: { type: "string" },
            back: { type: "string" },
          },
          required: ["front", "back"],
          additionalProperties: false,
        },
      },
    },
    required: ["slug", "title", "category", "aliases", "cards"],
    additionalProperties: false,
  },
};

export async function generateFlashcards(requirement) {
  const response = await withRetry(() =>
    openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `
Extract the core knowledge topic and create exactly 3 interview flashcards.

Return one reusable knowledge object.
Use kebab-case slug.
Do not include requirement IDs.
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

  return OutputSchema.parse(JSON.parse(response.output_text));
}

const requirement = 
  {
    id: "r1",
    text: "React",
    kind: "technical",
    priority: "must",
  }

console.log("gpting")
console.log(await generateFlashcards(requirement))

