import Task from "../models/Task.js";
import BehaviorState from "../models/BehaviorState.js";
import { parseTaskInput } from "../services/taskParser.js";
import { computeDailyWorkload } from "../services/workloadService.js";
import { calculatePriority } from "../services/priorityService.js";
import { processText, classifyTaskType } from "../services/nlpService.js";
import { validateTask } from "../services/taskValidator.js";
import { 
  computeStateMetrics, 
  nextState, 
  computeTransitionProbabilities, 
  predictNextState,
  predictStateNSteps,
  computeStationaryDistribution,
  calculateEntropy,
  detectTemporalOverloadTrend,
  mdpActionPolicy
} from "../intelligence/behaviorModel.js";
import { planCleanup } from "../intelligence/decisionEngine.js";

/**
 * Checks for scheduling conflicts for FIXED events.
 * Blocks if another FIXED event exists within ±30 minutes of the proposed time
 * for the same user. FLEXIBLE tasks are never blocked.
 *
 * @param {string} userId
 * @param {Date|string} deadline - The proposed deadline datetime
 * @param {string|null} excludeTaskId - Task ID to exclude (for updates)
 * @returns {boolean} true if a conflict exists
 */
async function hasFixedEventConflict(userId, deadline, excludeTaskId = null) {
  if (!deadline) return false;

  const dt = new Date(deadline);
  // ±30 minutes window around the proposed time
  const windowStart = new Date(dt.getTime() - 30 * 60 * 1000);
  const windowEnd   = new Date(dt.getTime() + 30 * 60 * 1000);

  const query = {
    userId,
    type: "FIXED",
    deadline: { $gte: windowStart, $lte: windowEnd }
  };

  if (excludeTaskId) {
    query._id = { $ne: excludeTaskId };
  }

  const conflict = await Task.findOne(query);
  return !!conflict;
}

export async function createTask(req, res, next) {
  try {
    const userId = req.user.id;
    const { rawInput, tags } = req.body;

    // 1. Process text with both NLP & Custom Parser
    const processedData = processText(rawInput);
    const parsedData = parseTaskInput(rawInput);

    // 2. Validate the extracted data
    const validation = validateTask(processedData);
    if (!validation.valid && !req.body.forceCreate) {
      return res.status(400).json({
        valid: false,
        intent: processedData.intent,
        reason: validation.reason,
        message: validation.message
      });
    }

    const title = req.body.title || parsedData.title || processedData.task || rawInput;
    
    let finalDeadline = req.body.deadline || parsedData.deadline || processedData.deadline;
    if (req.body.forceCreate && !finalDeadline) {
      // If forcing creation from UI without a specific deadline, default to 24 hours from now
      finalDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    // Determine task type: ALWAYS re-derive from NLP regardless of what AI/client sent.
    // The text used for classification is rawInput first, then title as fallback.
    // req.body.type is intentionally ignored — NLP is the single source of truth.
    const classificationText = rawInput || title || "";
    const taskType = classifyTaskType(classificationText);

    // 3a. For FIXED events, check for scheduling conflicts (±30 min window)
    if (taskType === "FIXED" && finalDeadline) {
      const conflict = await hasFixedEventConflict(userId, finalDeadline);
      if (conflict) {
        return res.status(409).json({
          message: "You already have a scheduled event at this time."
        });
      }
    }

    // 3. Load effortCorrection from behavior model for personalized estimation
    const behaviorState = await BehaviorState.findOne({ userId });
    const effortLevel = parsedData.effortLevel || req.body.effortLevel || "medium";
    const effortCorrection = behaviorState?.effortAccuracyMap?.get(effortLevel) || 1.0;

    const taskData = {
      userId,
      rawInput,
      title,
      description: req.body.description || "",
      deadline: finalDeadline,
      effortLevel,
      estimatedMinutes: parsedData.estimatedMinutes || req.body.estimatedMinutes || 30,
      effortCorrection,
      tags: Array.isArray(tags) ? tags : [],
      type: taskType,
      parsedMetadata: {
        ...parsedData.parsedMetadata,
        intent: processedData.intent,
        nlpValid: true
      }
    };

    // 4. Calculate dynamic priority (Cognitive Decision Model)
    const currentTasks = await Task.find({ userId, status: { $ne: "completed" } });
    const workload = computeDailyWorkload(currentTasks);
    const priority = calculatePriority(taskData, workload);

    const task = await Task.create({
      ...taskData,
      priorityScore: priority.priorityScore,
      priorityLabel: priority.priorityLabel,
      priorityRationale: priority.priorityRationale
    });
    
    updateBehaviorStateBackground(userId).catch(err => console.error("Behavior update error:", err));

    res.status(201).json({ valid: true, intent: processedData.intent, task });
  } catch (e) {
    next(e);
  }
}

export async function listTasks(req, res, next) {
  try {
    const userId = req.user.id;
    const { sort, tag, archived } = req.query;

    const filter = { userId };
    if (archived === "true") {
      filter.archived = true;
    } else {
      filter.archived = { $ne: true };
    }
    if (tag) filter.tags = tag;

    const tasks = await Task.find(filter);

    // Sorting
    let sorted = [...tasks];
    if (sort === "deadline") {
      sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sort === "effort") {
      const effortOrder = { high: 0, medium: 1, low: 2 };
      sorted.sort((a, b) => (effortOrder[a.effortLevel] ?? 1) - (effortOrder[b.effortLevel] ?? 1));
    } else if (sort === "priority") {
      sorted.sort((a, b) => b.priorityScore - a.priorityScore);
    } else {
      // Default: newest first
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(sorted);
  } catch (e) {
    next(e);
  }
}

async function updateBehaviorStateBackground(userId) {
  let state = await BehaviorState.findOne({ userId });
  if (!state) state = await BehaviorState.create({ userId });
  
  const tasks = await Task.find({ userId });
  const wl = computeDailyWorkload(tasks);
  const metrics = computeStateMetrics(tasks);
  const pendingTaskCount = tasks.filter(t => t.status !== "completed").length;
  const ns = nextState(state.currentState, metrics, wl.overloadFlag, pendingTaskCount);
  
  if (ns !== state.currentState) {
    const fromState = state.currentState;
    state.previousState = fromState;
    state.currentState = ns;
    const fromRow = state.transitionMatrix.get(fromState);
    if (fromRow) {
      fromRow.set(ns, (fromRow.get(ns) || 0) + 1);
      state.markModified("transitionMatrix");
    }
    state.stateHistory.push({ state: ns, timestamp: new Date() });
  }
  
  state.postponementRate = metrics.postponementRate;
  state.completionRate = metrics.completionRate;
  state.overloadFrequency = Math.max(state.overloadFrequency, wl.overloadFlag ? 1 : state.overloadFrequency);

  // --- Update streak ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = state.lastActiveDate ? new Date(state.lastActiveDate) : null;
  if (lastActive) lastActive.setHours(0, 0, 0, 0);

  const completedToday = tasks.some(t => {
    if (t.status !== "completed") return false;
    const updated = new Date(t.updatedAt);
    updated.setHours(0, 0, 0, 0);
    return updated.getTime() === today.getTime();
  });

  if (completedToday) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActive && lastActive.getTime() === yesterday.getTime()) {
      state.currentStreak += 1;
    } else if (!lastActive || lastActive.getTime() < yesterday.getTime()) {
      state.currentStreak = 1;
    }
    state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    state.lastActiveDate = today;
  }
  
  await state.save();
}

export async function updateTask(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const updates = { ...req.body };
    if (updates.deadline) updates.deadline = new Date(updates.deadline);
    
    const existingTask = await Task.findOne({ _id: id, userId });
    if (!existingTask) return res.status(404).json({ error: "not_found" });

    // Track postponements
    if (updates.status === "postponed" && existingTask.status !== "postponed") {
      updates.postponedCount = (existingTask.postponedCount || 0) + 1;
    }

    // Determine effective type after update.
    // Always re-derive via NLP from the task title — never trust client-supplied type.
    const classificationTextForUpdate = (updates.title || existingTask.title || existingTask.rawInput || "");
    const effectiveType = classifyTaskType(classificationTextForUpdate);
    // Persist the re-derived type in updates so it's correctly stored
    updates.type = effectiveType;

    const effectiveDeadline = updates.deadline || existingTask.deadline;

    // For FIXED event updates, check for conflicts with OTHER tasks (±30 min window)
    if (effectiveType === "FIXED" && effectiveDeadline) {
      const conflict = await hasFixedEventConflict(userId, effectiveDeadline, id);
      if (conflict) {
        return res.status(409).json({
          message: "You already have a scheduled event at this time."
        });
      }
    }

    const simulatedTask = { ...existingTask.toObject(), ...updates };
    
    const currentTasks = await Task.find({ userId, status: { $ne: "completed" } });
    const workload = computeDailyWorkload(currentTasks);
    const priority = calculatePriority(simulatedTask, workload);
    
    updates.priorityScore = priority.priorityScore;
    updates.priorityLabel = priority.priorityLabel;
    updates.priorityRationale = priority.priorityRationale;

    const task = await Task.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
    
    if (updates.status && updates.status !== existingTask.status) {
      updateBehaviorStateBackground(userId).catch(err => console.error("Behavior update error:", err));
    }
    
    res.json(task);
  } catch (e) {
    next(e);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const task = await Task.findOneAndDelete({ _id: id, userId });
    if (!task) return res.status(404).json({ error: "not_found" });
    updateBehaviorStateBackground(userId).catch(err => console.error("Behavior update error:", err));
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function getWorkload(req, res, next) {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ userId, status: { $ne: "completed" }, archived: { $ne: true } });
    const metrics = computeDailyWorkload(tasks);
    
    // Inject Markov state and action policy for the Workload meter
    const state = await BehaviorState.findOne({ userId });
    const policy = state ? mdpActionPolicy(state.currentState) : null;
    
    res.json({ 
      ...metrics, 
      markovState: state?.currentState, 
      actionPolicy: policy 
    });
  } catch (e) {
    next(e);
  }
}

export async function getBehavior(req, res, next) {
  try {
    const userId = req.user.id;
    let state = await BehaviorState.findOne({ userId });
    if (!state) state = await BehaviorState.create({ userId });
    res.json(state);
  } catch (e) {
    next(e);
  }
}

export async function getMarkovInsights(req, res) {
  try {
    const userId = req.user.id;
    const state = await BehaviorState.findOne({ userId });
    if (!state) return res.status(404).json({ error: "no_behavior_data" });

    const probabilities = computeTransitionProbabilities(state.transitionMatrix);
    const oneStep = predictNextState(state.currentState, state.transitionMatrix);
    const threeStep = predictStateNSteps(state.currentState, state.transitionMatrix, 3);
    const stationary = computeStationaryDistribution(state.transitionMatrix);
    const longTermOverloadRisk = stationary.distribution["Overloaded"] || 0;

    const currentOverloadProb = threeStep.distribution["Overloaded"] || 0;
    state.probabilityHistory.push({ timestamp: new Date(), overloadProbability: currentOverloadProb });
    if (state.probabilityHistory.length > 10) state.probabilityHistory.shift();
    await state.save();

    const oneStepEntropy = calculateEntropy(probabilities[state.currentState]);
    const threeStepEntropy = calculateEntropy(threeStep.distribution);
    const trend = detectTemporalOverloadTrend(state.probabilityHistory);

    let totalTransitions = 0;
    state.transitionMatrix.forEach(row => { row.forEach(count => { totalTransitions += count; }); });

    res.json({
      currentState: state.currentState,
      oneStepPrediction: { prediction: oneStep.prediction, confidence: oneStep.confidence },
      threeStepPrediction: { prediction: threeStep.prediction, confidence: threeStep.confidence, distribution: threeStep.distribution },
      stationaryDistribution: stationary,
      behaviorEntropy: { oneStepEntropy, threeStepEntropy },
      overloadTrend: trend,
      longTermOverloadRisk,
      transitionMatrix: probabilities,
      totalTransitions
    });
  } catch (e) {
    res.status(500).json({ error: "markov_insights_failed", message: e.message });
  }
}

/**
 * POST /api/tasks/plan-cleanup
 * Triggers AI Plan Cleanup and returns suggestions.
 */
export async function planCleanupHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ userId, archived: { $ne: true } });
    const workload = computeDailyWorkload(tasks.filter(t => t.status !== "completed"));
    const result = await planCleanup(tasks, workload);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/tasks/archive
 * Archives completed tasks older than 7 days.
 */
export async function archiveTasks(req, res, next) {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await Task.updateMany(
      { userId, status: "completed", updatedAt: { $lt: sevenDaysAgo }, archived: { $ne: true } },
      { $set: { archived: true } }
    );
    res.json({ archivedCount: result.modifiedCount });
  } catch (e) {
    next(e);
  }
}
