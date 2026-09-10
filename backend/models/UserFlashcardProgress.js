// models/UserFlashcardProgress.js

import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    flashcard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flashcard",
      required: true,
      index: true,
    },

    mastered: {
      type: Boolean,
      default: false,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },

    lastReviewedAt: Date,
  },
  { timestamps: true }
);

ProgressSchema.index(
  { user: 1, flashcard: 1 },
  { unique: true }
);

export default mongoose.model(
  "UserFlashcardProgress",
  ProgressSchema
);