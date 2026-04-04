import { predictStateNSteps, calculateEntropy, computeStationaryDistribution, mdpActionPolicy } from "./behaviorModel.js";
import { generatePlanCleanup } from "../services/geminiService.js";

/**
 * ZODO Decision Engine
 *
 * Uses 3-step Markov forecasting, behavioral entropy, stationary distribution,
 * and MDP state-action policy for proactive system recommendations.
 */
export function assess(workload, behavior) {
  const currentState = behavior.currentState || "Balanced";
  const transitionMatrix = behavior.transitionMatrix;
  
  const threeStep = predictStateNSteps(currentState, transitionMatrix, 3);
  const entropy = calculateEntropy(threeStep.distribution);
  const stationary = computeStationaryDistribution(transitionMatrix);
  const longTermOverloadRisk = stationary.distribution["Overloaded"] || 0;

  let workloadAssessment = "Balanced";
  if (workload.overloadFlag) workloadAssessment = "Overloaded";
  else if (workload.capacityPercentage < 30) workloadAssessment = "Underutilized";

  let riskLevel = "low";
  if (workload.overloadFlag || threeStep.prediction === "Overloaded") riskLevel = "high";
  else if (threeStep.prediction === "Procrastinating") riskLevel = "medium";
  if (longTermOverloadRisk > 0.4) riskLevel = "chronic";

  const suggestedAdjustments = [];

  if (longTermOverloadRisk > 0.4) {
    suggestedAdjustments.push("Long-term overload tendency detected — reduce sustained workload");
  } else if (longTermOverloadRisk < 0.1 && entropy < 0.3 && currentState === "HighPerformance") {
    suggestedAdjustments.push("Safe to increase long-term capacity moderately");
  }

  if (threeStep.prediction === "Overloaded" && threeStep.confidence > 0.6) {
    suggestedAdjustments.push("Proactively defer low-priority tasks");
    suggestedAdjustments.push("Reduce daily capacity target");
    suggestedAdjustments.push("Recommend workload redistribution");
  } else if (workload.overloadFlag) {
    suggestedAdjustments.push("Defer lower-priority tasks");
  }

  if (workload.capacityPercentage > 80) suggestedAdjustments.push("Limit new tasks today");
  if (entropy > 0.7) suggestedAdjustments.push("Behavior unstable — avoid adding new high-effort tasks");
  if (entropy < 0.3 && currentState === "HighPerformance" && riskLevel !== "chronic") {
    suggestedAdjustments.push("Safe to increase workload moderately");
  }
  if (behavior.postponementRate > 0.3) suggestedAdjustments.push("Schedule focused blocks for deferred items");
  if (behavior.completionRate < 0.5) suggestedAdjustments.push("Reduce task scope where possible");
  if (workload.capacityPercentage < 40 && threeStep.prediction !== "Overloaded") {
    suggestedAdjustments.push("Pull one medium task forward");
  }

  // MDP Action Policy: pass metrics for personalised message
  const metrics = {
    completionRate: behavior.completionRate || 0,
    postponementRate: behavior.postponementRate || 0
  };
  const statePolicy = mdpActionPolicy(currentState, metrics);

  return { 
    workloadAssessment, 
    suggestedAdjustments, 
    riskLevel,
    longTermOverloadRisk,
    statePolicy,
    forecast: {
      nextState: threeStep.prediction,
      confidence: threeStep.confidence,
      volatility: entropy
    }
  };
}

/**
 * assessWithPolicy — MDP-lite Assessment
 *
 * Extends assess() by applying the MDP action policy effects to actual tasks:
 *
 *  reduce_workload  → list the lowest-priority tasks to postpone
 *                   → list high-effort tasks to split
 *  increase_urgency → boost visibility of near-deadline tasks (≤ 2 days)
 *  break_tasks      → list tasks with postponedCount ≥ 2 that should be split
 *  suggest_add_tasks → no task-level suggestions (prompt user to add)
 *  maintain/encourage → no task-level changes
 *
 * Returns:
 * {
 *   state, action, message, tone, priorityAdjustment,
 *   suggestions: [{ taskId, taskTitle, suggestedAction, reason }]
 * }
 *
 * @param {string} currentState - current Markov state
 * @param {object} metrics     - { completionRate, postponementRate, totalTasks }
 * @param {Array}  tasks       - all active (non-archived) Task documents
 * @param {object} workload    - { totalMinutes, capacityPercentage, overloadFlag }
 */
export function assessWithPolicy(currentState, metrics, tasks, workload) {
  const policy = mdpActionPolicy(currentState, metrics);
  const suggestions = buildSuggestions(policy.action, tasks, workload);

  return {
    state: currentState,
    action: policy.action,
    message: policy.message,
    tone: policy.tone,
    priorityAdjustment: policy.priorityAdjustment,
    suggestions
  };
}

/**
 * Translates a policy action into concrete task-level suggestions.
 * Max 5 suggestions returned to keep the UI focused.
 */
function buildSuggestions(action, tasks, workload) {
  const active = tasks.filter(t => t.status !== "completed" && !t.archived);
  const now = new Date();

  if (action === "reduce_workload") {
    const suggestions = [];

    // 1. Suggest postponing low-priority tasks (no near deadline)
    const lowPriority = active
      .filter(t => t.priorityLabel === "Low" || t.priorityLabel === "Medium")
      .filter(t => {
        if (!t.deadline) return true; // no deadline = safe to defer
        const daysLeft = (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24);
        return daysLeft > 3; // only defer if deadline is 3+ days away
      })
      .sort((a, b) => (a.priorityScore || 0) - (b.priorityScore || 0))
      .slice(0, 2);

    lowPriority.forEach(t => suggestions.push({
      taskId: t._id?.toString(),
      taskTitle: t.title,
      suggestedAction: "postpone",
      reason: `Low priority task — safe to defer and reduce your current load.`
    }));

    // 2. Suggest splitting high-effort tasks
    const highEffort = active
      .filter(t => t.effortLevel === "high" && (t.estimatedMinutes || 30) >= 60)
      .slice(0, 2);

    highEffort.forEach(t => suggestions.push({
      taskId: t._id?.toString(),
      taskTitle: t.title,
      suggestedAction: "split",
      reason: `High-effort task (${t.estimatedMinutes || 60}min) — break into smaller deliverables.`
    }));

    return suggestions.slice(0, 5);
  }

  if (action === "break_tasks") {
    // Suggest splitting repeatedly postponed tasks
    return active
      .filter(t => (t.postponedCount || 0) >= 2)
      .sort((a, b) => (b.postponedCount || 0) - (a.postponedCount || 0))
      .slice(0, 5)
      .map(t => ({
        taskId: t._id?.toString(),
        taskTitle: t.title,
        suggestedAction: "split",
        reason: `Postponed ${t.postponedCount} times — break into smaller steps to reduce friction.`
      }));
  }

  if (action === "reduce_workload" || policy?.priorityAdjustment === "increase_urgency") {
    // Handled in reduce_workload block above; this covers the urgency flag standalone
    return active
      .filter(t => {
        if (!t.deadline) return false;
        const daysLeft = (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24);
        return daysLeft <= 2;
      })
      .sort((a, b) => (a.priorityScore || 0) - (b.priorityScore || 0))
      .slice(0, 3)
      .map(t => ({
        taskId: t._id?.toString(),
        taskTitle: t.title,
        suggestedAction: "focus",
        reason: `Due within 2 days — prioritise this immediately.`
      }));
  }

  if (action === "suggest_add_tasks") {
    return [{
      taskId: null,
      taskTitle: null,
      suggestedAction: "add_task",
      reason: "Your schedule has capacity. Pull a goal forward or plan a new task."
    }];
  }

  // maintain / encourage → no task changes needed
  return [];
}

/**
 * Plan Cleanup — AI-powered workload reduction suggestions.
 * Falls back to rule-based suggestions if Gemini is unavailable.
 */
export async function planCleanup(tasks, workload) {
  const pendingTasks = tasks.filter(t => t.status !== "completed" && !t.archived);
  const taskSummary = pendingTasks.map(t => ({
    id: t._id?.toString() || "",
    title: t.title,
    deadline: t.deadline ? new Date(t.deadline).toISOString().split("T")[0] : "No deadline",
    effort: t.effortLevel,
    priority: t.priorityLabel,
    postponedCount: t.postponedCount || 0,
    estimatedMinutes: t.estimatedMinutes || 30
  }));

  try {
    const suggestions = await generatePlanCleanup(taskSummary, workload);
    return { suggestions };
  } catch (err) {
    console.error("Plan cleanup Gemini call failed, using fallback:", err);
    const fallback = pendingTasks
      .filter(t => t.priorityLabel === "Low" || t.postponedCount >= 2)
      .slice(0, 3)
      .map(t => ({
        action: t.postponedCount >= 2 ? "split" : "postpone",
        taskTitle: t.title,
        taskId: t._id?.toString() || "",
        reason: t.postponedCount >= 2 
          ? `Postponed ${t.postponedCount} times — consider breaking into smaller steps`
          : "Low priority — can be deferred to reduce current load"
      }));
    return { suggestions: fallback };
  }
}
