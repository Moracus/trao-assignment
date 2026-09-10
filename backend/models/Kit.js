import mongoose from "mongoose";

const KitSchema = new mongoose.Schema({
  title: String,

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },

  companyUrl: {
    type: String,
    required: true,
  },

  jobDescription: {
    type: String,
    required: true,
  },

  duplicateHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  status: {
    type: String,
    enum: [
      "pending",
      "crawling",
      "generating",
      "completed",
      "failed",
    ],
    default: "pending",
    index: true,
  },

  appendixA: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },

  retrievalWarnings: {
    type: [String],
    default: [],
  },

  error: {
    code: String,
    message: String,
  },

  completedAt: Date,

}, { timestamps: true });

export default mongoose.model("Kit", KitSchema);