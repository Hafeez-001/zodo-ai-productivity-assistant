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

  // MDP Action Policy: state-based recommendation
  const statePolicy = mdpActionPolicy(currentState);

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
