import { STATES } from "../models/BehaviorState.js";

/**
 * ZODO Behavioral Intelligence Layer
 * 
 * Implements a first-order discrete-time Markov Chain (DTMC) to model
 * cognitive state transitions with Laplace-smoothed transition probabilities.
 * 
 * Extended with:
 * - MDP Action Policy: maps states → recommended system actions
 * - Effort Correction Learning: updates the effort multiplier based on actual vs. estimated time
 */

export function computeStateMetrics(tasks) {
  // FIX (Issue #1): Use actual task count as denominator, never substitute 1 for 0.
  // Substituting 1 produced completionRate=0 for new users, triggering Underutilized.
  const total = tasks.length;
  if (total === 0) return { postponementRate: 0, completionRate: 0, totalTasks: 0 };
  const postponed = tasks.filter(t => t.status === "postponed").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const postponementRate = postponed / total;
  const completionRate = completed / total;
  return { postponementRate, completionRate, totalTasks: total };
}

export function nextState(current, metrics, overloadFlag, pendingTaskCount = 0) {
  // FIX (Issue #1): With 0 tasks, all metrics are 0 — return Balanced immediately.
  // Previously: completionRate=0 < 0.2 AND pendingCount=0 < 2 → wrongly → Underutilized.
  if (metrics.totalTasks === 0) return "Balanced";

  if (overloadFlag) return "Overloaded";
  if (metrics.postponementRate > 0.4 && metrics.completionRate < 0.4) return "Procrastinating";

  // FIX (Issue #8): Changed > 0.8 to >= 0.8.
  // Previously: completing exactly 80% of tasks (e.g. 8/10) fell through to Balanced.
  if (metrics.completionRate >= 0.8 && pendingTaskCount > 0) return "HighPerformance";

  if (metrics.completionRate < 0.2 && pendingTaskCount < 2) return "Underutilized";
  return "Balanced";
}

/**
 * MDP Action Policy (MDP-lite)
 *
 * Maps the current Markov state + behavioral metrics to a structured action policy.
 * Every state returns:
 *   action            — machine-readable action key
 *   message           — user-facing message (personalised with metrics where available)
 *   tone              — visual tone hint for the frontend
 *   priorityAdjustment — optional directive consumed by the decision engine to
 *                        modify task processing (null = no adjustment)
 *
 * The second argument `metrics` is optional for backward compatibility with
 * existing callers that pass only the state string.
 *
 * @param {string} state - current Markov state
 * @param {object} [metrics] - { postponementRate, completionRate, totalTasks }
 * @returns {{ action, message, tone, priorityAdjustment }}
 */
export function mdpActionPolicy(state, metrics = {}) {
  const completedPct = Math.round((metrics.completionRate || 0) * 100);
  const postponedPct = Math.round((metrics.postponementRate || 0) * 100);

  const policies = {
    Underutilized: {
      action: "suggest_add_tasks",
      message: "You have low workload. Consider planning more tasks or pulling a goal forward.",
      tone: "encouraging",
      priorityAdjustment: null
    },
    Balanced: {
      action: "maintain",
      message: metrics.completionRate > 0
        ? `Your workload is balanced — ${completedPct}% done. Keep going.`
        : "Your workload is balanced. Maintain your current rhythm.",
      tone: "positive",
      priorityAdjustment: null
    },
    HighPerformance: {
      action: "encourage",
      message: `You're performing well — ${completedPct}% of tasks completed. Maintain your momentum.`,
      tone: "celebratory",
      priorityAdjustment: null
    },
    Overloaded: {
      action: "reduce_workload",
      message: "You are overloaded. Consider postponing low-priority tasks or splitting large ones.",
      tone: "warning",
      // Signals the decision engine to boost urgency on near-deadline tasks
      // so the user can see which ones to act on first.
      priorityAdjustment: "increase_urgency"
    },
    Procrastinating: {
      action: "break_tasks",
      message: postponedPct > 0
        ? `${postponedPct}% of your tasks are postponed. Break tasks into smaller steps and commit to one today.`
        : "You are postponing tasks frequently. Break tasks into smaller steps and commit to one today.",
      tone: "motivational",
      priorityAdjustment: null
    }
  };

  return policies[state] || policies["Balanced"];
}

/**
 * Effort Correction Learning
 * Updates the effort correction multiplier for a task's effort level
 * using an exponential moving average (α = 0.3) to avoid overreacting
 * to individual data points while still learning over time.
 */
export function learnEffortCorrection(behaviorState, effortLevel, estimatedMinutes, actualMinutes) {
  if (!estimatedMinutes || estimatedMinutes <= 0 || !actualMinutes || actualMinutes <= 0) return;
  
  const ratio = actualMinutes / estimatedMinutes;
  const alpha = 0.3;
  
  const currentCorrection = behaviorState.effortAccuracyMap.get(effortLevel) || 1.0;
  const newCorrection = alpha * ratio + (1 - alpha) * currentCorrection;
  
  behaviorState.effortAccuracyMap.set(effortLevel, Math.max(0.5, Math.min(3.0, newCorrection)));
  behaviorState.markModified("effortAccuracyMap");
}

/**
 * Computes the normalized transition probability matrix from raw counts
 * using Laplace smoothing (add-one smoothing).
 * 
 * P(next | current) = (count + 1) / (totalOut + N)
 */
export function computeTransitionProbabilities(transitionMatrix) {
  const probabilities = {};
  const N = STATES.length;
  
  STATES.forEach(fromState => {
    probabilities[fromState] = {};
    const fromRow = transitionMatrix instanceof Map ? transitionMatrix.get(fromState) : transitionMatrix[fromState];
    
    let totalOut = 0;
    STATES.forEach(toState => {
      const count = fromRow instanceof Map ? fromRow.get(toState) : fromRow[toState];
      totalOut += count || 0;
    });

    STATES.forEach(toState => {
      const count = fromRow instanceof Map ? fromRow.get(toState) : fromRow[toState];
      probabilities[fromState][toState] = ((count || 0) + 1) / (totalOut + N);
    });
  });

  return probabilities;
}

function multiplyMatrices(A, B) {
  const result = {};
  STATES.forEach(i => {
    result[i] = {};
    STATES.forEach(j => {
      let sum = 0;
      STATES.forEach(k => { sum += A[i][k] * B[k][j]; });
      result[i][j] = sum;
    });
  });
  return result;
}

export function computeNStepTransitionMatrix(transitionMatrix, steps) {
  let P = computeTransitionProbabilities(transitionMatrix);
  let result = P;
  for (let i = 1; i < steps; i++) {
    result = multiplyMatrices(result, P);
  }
  return result;
}

export function predictStateNSteps(currentState, transitionMatrix, steps = 3) {
  const Pn = computeNStepTransitionMatrix(transitionMatrix, steps);
  const distribution = Pn[currentState];
  
  let maxProb = -1;
  let bestState = currentState;
  STATES.forEach(state => {
    if (distribution[state] > maxProb) {
      maxProb = distribution[state];
      bestState = state;
    }
  });

  return { distribution, prediction: bestState, confidence: maxProb };
}

export function computeStationaryDistribution(transitionMatrix, iterations = 50) {
  const P = computeTransitionProbabilities(transitionMatrix);
  let v = {};
  STATES.forEach(state => v[state] = 1 / STATES.length);
  
  for (let iter = 0; iter < iterations; iter++) {
    let vNext = {};
    STATES.forEach(j => {
      let sum = 0;
      STATES.forEach(i => { sum += v[i] * P[i][j]; });
      vNext[j] = sum;
    });
    v = vNext;
  }
  
  const sum = Object.values(v).reduce((a, b) => a + b, 0);
  STATES.forEach(state => v[state] = v[state] / sum);
  
  let maxProb = -1;
  let dominantState = STATES[0];
  STATES.forEach(state => {
    if (v[state] > maxProb) { maxProb = v[state]; dominantState = state; }
  });

  return { distribution: v, dominantState };
}

export function calculateEntropy(distribution) {
  let entropy = 0;
  Object.values(distribution).forEach(p => {
    if (p > 0) entropy -= p * Math.log2(p);
  });
  const maxEntropy = Math.log2(STATES.length);
  return entropy / maxEntropy;
}

export function detectTemporalOverloadTrend(probabilityHistory) {
  if (!probabilityHistory || probabilityHistory.length < 3) {
    return { status: "Insufficient Data", slope: 0, currentRisk: 0 };
  }
  
  const last = probabilityHistory[probabilityHistory.length - 1].overloadProbability;
  const first = probabilityHistory[0].overloadProbability;
  const slope = last - first;
  
  let status = "Stable";
  if (slope > 0.1) status = "Increasing";
  else if (slope < -0.1) status = "Decreasing";
  
  return { status, slope, currentRisk: last };
}

export function predictNextState(currentState, transitionMatrix, stochastic = false) {
  const probabilities = computeTransitionProbabilities(transitionMatrix);
  const row = probabilities[currentState];
  
  if (stochastic) {
    const rand = Math.random();
    let cumulative = 0;
    for (const state of STATES) {
      cumulative += row[state];
      if (rand <= cumulative) return state;
    }
  }

  let maxProb = -1;
  let bestState = currentState;
  STATES.forEach(state => {
    if (row[state] > maxProb) { maxProb = row[state]; bestState = state; }
  });

  return { prediction: bestState, confidence: maxProb };
}
