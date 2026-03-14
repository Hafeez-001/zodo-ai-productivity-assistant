import mongoose from "mongoose";

const EFFORT_LEVELS = ["low", "medium", "high"];
const TASK_STATUSES = ["pending", "in_progress", "completed", "postponed"];

const VALID_TAGS = ["#Work", "#Personal", "#Coding", "#Study", "#Health", "#Finance", "#Other"];

const ParsedMetadataSchema = new mongoose.Schema(
  {
    extractedDate: { type: Date, default: null },
    extractedTime: { type: String, default: null },
    effortKeywords: { type: [String], default: [] },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 }
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    rawInput: { type: String, default: "" },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deadline: { type: Date, default: null },
    effortLevel: {
      type: String,
      enum: {
        values: EFFORT_LEVELS,
        message: "{VALUE} is not a valid effort level"
      },
      required: true,
      default: "medium"
    },
    estimatedMinutes: { type: Number, default: 30, min: 0 },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: "{VALUE} is not a valid task status"
      },
      required: true,
      default: "pending"
    },
    parsedMetadata: {
      type: ParsedMetadataSchema,
      default: () => ({})
    },
    priorityScore: { 
      type: Number, 
      default: 0 
    }, 
    priorityLabel: { 
      type: String, 
      enum: ["Low", "Medium", "High", "Critical"], 
      default: "Medium" 
    },
    // --- New fields for Cognitive Model & Features ---
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.every(t => VALID_TAGS.includes(t)),
        message: "Invalid tag value"
      }
    },
    postponedCount: { type: Number, default: 0, min: 0 },
    effortCorrection: { type: Number, default: 1.0, min: 0.1, max: 5.0 },
    archived: { type: Boolean, default: false },
    priorityRationale: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

// Compound indexes for performance and workload assessment
TaskSchema.index({ userId: 1, deadline: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, tags: 1 });
TaskSchema.index({ userId: 1, archived: 1 });

export const VALID_TASK_TAGS = VALID_TAGS;
export default mongoose.model("Task", TaskSchema);
