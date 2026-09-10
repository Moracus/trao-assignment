// models/Flashcard.js

import mongoose from "mongoose";

const FlashcardSchema = new mongoose.Schema(
  {
    knowledge_slug: {
      type: String,
      required: true,
      index: true,
    },

    front: {
      type: String,
      required: true,
    },

    back: {
      type: String,
      required: true,
    },

    difficulty: {
      type: Number,
      min: 1,
      max: 3,
      default: 1,
    },
  },
  { timestamps: true }
);

FlashcardSchema.index(
  {
    knowledge_slug: 1,
    front: 1,
  },
  { unique: true }
);

export default mongoose.model("Flashcard", FlashcardSchema);