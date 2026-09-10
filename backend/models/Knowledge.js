// models/Knowledge.js

import mongoose from "mongoose";

const KnowledgeSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
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
      required: true,
    },

    aliases: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Knowledge", KnowledgeSchema);