// models/Knowledge.js

import mongoose from "mongoose";
import { KNOWLEDGE_CATEGORIES } from "../constants/kitEnums.js";

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
      enum: KNOWLEDGE_CATEGORIES,
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
