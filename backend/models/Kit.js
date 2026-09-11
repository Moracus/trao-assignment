// models/Kit.js

import mongoose from "mongoose";

const RequirementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },

    kind: {
      type: String,
      enum: ["technical", "experience", "education", "soft-skill", "others"],
      required: true,
    },

    priority: {
      type: String,
      enum: ["must", "nice", "should"],
      required: true,
    },

    knowledge_slug: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const QuestionSchema = new mongoose.Schema(
  {
    id: String,

    requirement_ids: [String],

    category: {
      type: String,
      enum: [
        "technical",
        "behavioural",
        "system-design",
        "company-fit",
        "others",
      ],
    },

    prompt: String,
    answer_outline: String,

    difficulty: {
      type: Number,
      min: 1,
      max: 3,
    },
  },
  { _id: false },
);

const ScheduleDaySchema = new mongoose.Schema(
  {
    day: Number,
    focus: String,
    question_ids: [String],

    minutes: {
      type: Number,
      min: 0,
    },
  },
  { _id: false },
);

const KitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    duplicateHash: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    companyUrl: {
      type: String,
      required: true,
    },

    jobDescription: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "crawling",
        "generating",
        "completed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    source: {
      company: String,
      company_url: String,
      role: String,
      location: String,

      jd_chars: Number,

      researched_at: Date,

      pages_used: [String],
    },

    company_brief: {
      summary: String,
      what_they_do: String,

      sources: [String],
    },

    role: {
      title: String,
      seniority: String,

      responsibilities: [String],

      requirements: [RequirementSchema],
    },

    questions: [QuestionSchema],

    schedule: {
      days_available: Number,

      days: [ScheduleDaySchema],
    },

    coverage: {
      uncovered_requirement_ids: {
        type: [String],
        default: [],
      },

      passes: {
        type: Number,
        default: 1,
      },
    },

    retrievalWarnings: {
      type: [String],
      default: [],
    },
    progress: {
      type: Number,
      default: 0,
    },
    data: mongoose.Schema.Types.Mixed,

    error: {
      code: String,
      message: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Kit", KitSchema);
