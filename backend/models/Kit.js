// models/Kit.js

import mongoose from "mongoose";
import {
  KIT_QUESTION_CATEGORIES,
  KIT_REQUIREMENT_KINDS,
  KIT_REQUIREMENT_PRIORITIES,
  KIT_STATUSES,
} from "../constants/kitEnums.js";

const RequirementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },

    kind: {
      type: String,
      enum: KIT_REQUIREMENT_KINDS,
      required: true,
    },

    priority: {
      type: String,
      enum: KIT_REQUIREMENT_PRIORITIES,
      required: true,
    },

    knowledge_slug: {
      type: String,
    },
  },
  { _id: false },
);

const QuestionSchema = new mongoose.Schema(
  {
    id: String,
    order: Number,

    requirement_ids: [String],

    category: {
      type: String,
      enum: KIT_QUESTION_CATEGORIES,
    },

    prompt: String,
    answer_outline: String,

    difficulty: {
      type: Number,
      min: 1,
      max: 3,
    },

    generated: {
      type: Boolean,
      default: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    updatedAt: Date,
  },
  { _id: false },
);

const FlashcardSchema = new mongoose.Schema(
  {
    id: String,
    front: String,
    back: String,
    requirement_ids: [String],
    generated: {
      type: Boolean,
      default: true,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    updatedAt: Date,
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

const normalizeCompanyBrief = (value) => {
  if (!value || typeof value !== "object") {
    return {
      summary: "",
      what_they_do: "",
      sources: [],
      edited: { summary: false, what_they_do: false },
      pinned: false,
    };
  }

  return {
    summary: value.summary ?? "",
    what_they_do: value.what_they_do ?? "",
    sources: Array.isArray(value.sources) ? value.sources : [],
    edited: {
      summary: Boolean(value.edited?.summary ?? false),
      what_they_do: Boolean(value.edited?.what_they_do ?? false),
    },
    pinned: Boolean(value.pinned ?? false),
  };
};

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
    company: {
      type: String,
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
      enum: KIT_STATUSES,
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
      edited: {
        summary: { type: Boolean, default: false },
        what_they_do: { type: Boolean, default: false },
      },
      pinned: {
        type: Boolean,
        default: false,
      },
    },

    role: {
      title: String,
      seniority: String,

      responsibilities: [String],

      requirements: [RequirementSchema],
    },

    questions: [QuestionSchema],

    flashcards: [FlashcardSchema],

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
      score: Number, // 0-100
      last_checked: Date,
    },

    retrievalWarnings: {
      type: [String],
      default: [],
    },
    progress: {
      //kit generation progress
      type: Number,
      default: 0,
    },

    data: mongoose.Schema.Types.Mixed,

    // Execution metadata is deliberately persisted so an API process can cancel
    // the exact BullMQ job even after a restart.
    jobId: { type: String, index: true },
    requestedSection: { type: String, default: null },
    cancellationRequestedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    error: {
      code: String,
      message: String,
    },
  },
  { timestamps: true },
);

KitSchema.pre("save", function normalizeBriefBeforeSave() {
  if (this.company_brief) {
    this.company_brief = normalizeCompanyBrief(this.company_brief);
  }

  if (!this.company_brief) {
    this.company_brief = normalizeCompanyBrief({
      summary: "",
      what_they_do: "",
      sources: [],
      edited: { summary: false, what_they_do: false },
      pinned: false,
    });
  }

  // next();
});

export default mongoose.model("Kit", KitSchema);
