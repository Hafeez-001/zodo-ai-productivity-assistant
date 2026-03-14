import mongoose from "mongoose";

export const STATES = [
  "Balanced",
  "Overloaded",
  "Underutilized",
  "Procrastinating",
  "HighPerformance"
];

const REWARD_MODEL = {
  Balanced: 5,
  HighPerformance: 8,
  Overloaded: -6,
  Procrastinating: -8,
  Underutilized: -3
};

const StateHistorySchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: {
        values: STATES,
        message: "{VALUE} is not a valid cognitive state"
      },
      required: true
    },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const WeeklyStatsSchema = new mongoose.Schema(
  {
    weekStartDate: { type: Date, required: true },
    completionRate: { type: Number, default: 0 },
    totalCompleted: { type: Number, default: 0 },
    totalCreated: { type: Number, default: 0 },
    mostProductiveDay: { type: String, default: "" },
    aiNarrative: { type: String, default: "" }
  },
  { _id: false }
);

const BehaviorStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    currentState: {
      type: String,
      enum: STATES,
      default: "Balanced",
      index: true
    },
    previousState: {
      type: String,
      enum: STATES,
      default: "Balanced"
    },
    // Probabilistic transition matrix tracking frequency of state changes
    transitionMatrix: {
      type: Map,
      of: {
        type: Map,
        of: Number
      },
      default: () => {
        const matrix = new Map();
        STATES.forEach(s1 => {
          const inner = new Map();
          STATES.forEach(s2 => inner.set(s2, 0));
          matrix.set(s1, inner);
        });
        return matrix;
      }
    },
    // Snapshots of overload probabilities for temporal trend detection
    probabilityHistory: {
      type: [
        {
          timestamp: { type: Date, default: Date.now },
          overloadProbability: { type: Number, required: true }
        }
      ],
      default: []
    },
    rewardModel: {
      type: Map,
      of: Number,
      default: () => new Map(Object.entries(REWARD_MODEL))
    },
    stateHistory: {
      type: [StateHistorySchema],
      default: []
    },
    postponementRate: { type: Number, default: 0, min: 0, max: 1 },
    completionRate: { type: Number, default: 0, min: 0, max: 1 },
    overloadFrequency: { type: Number, default: 0, min: 0 },

    // --- Engagement: Streak tracking ---
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: Date, default: null },

    // --- Engagement: Weekly stats history (keep last 12 weeks) ---
    weeklyStats: { type: [WeeklyStatsSchema], default: [] },

    // --- Personalized Learning: effort label → correction multiplier ---
    // e.g. { "low": 1.5 } means user's "low" tasks take 1.5x longer than estimated
    effortAccuracyMap: {
      type: Map,
      of: Number,
      default: () => new Map([["low", 1.0], ["medium", 1.0], ["high", 1.0]])
    }
  },
  { timestamps: true }
);

export default mongoose.model("BehaviorState", BehaviorStateSchema);
