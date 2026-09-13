import { z } from "zod";

export const Requirement = z.object({
  id: z.string(),
  text: z.string(),
  kind: z.enum(["technical", "experience", "education", "soft-skill", "others"]),
  priority: z.enum(["must", "should", "nice"]),
});

export const Question = z.object({
  id: z.string(),
  requirement_ids: z.array(z.string()),
  category: z.enum([
    "technical",
    "behavioural",
    "system-design",
    "company-fit",
    "others",
  ]),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.number().int().min(1).max(3),
});

export const Flashcard = z.object({
  id: z.string(),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string()),
});

export const AppendixASchema = z.object({
  source: z.object({
    company: z.string(),
    company_url: z.string(),
    role: z.string(),
    location: z.string(),
    jd_chars: z.number(),
    researched_at: z.string(),
    pages_used: z.array(z.string()),
  }),

  company_brief: z.object({
    summary: z.string(),
    what_they_do: z.string(),
    sources: z.array(z.string()),
  }),

  role: z.object({
    title: z.string(),
    seniority: z.string(),
    responsibilities: z.array(z.string()),
    requirements: z.array(Requirement),
  }),

  questions: z.array(Question),

  flashcards: z.array(Flashcard),

  schedule: z.object({
    days_available: z.number().int(),
    days: z.array(
      z.object({
        day: z.number().int(),
        focus: z.string(),
        question_ids: z.array(z.string()),
        minutes: z.number().int(),
      }),
    ),
  }),

  coverage: z.object({
    uncovered_requirement_ids: z.array(z.string()),
    passes: z.number().int(),
  }),
});
