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
  const total = tasks.length || 1;
  const postponed = tasks.filter(t => t.status === "postponed").length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const postponementRate = postponed / total;
  const completionRate = completed / total;
  return { postponementRate, completionRate };
}

export function nextState(current, metrics, overloadFlag) {
  if (overloadFlag) return "Overloaded";
  if (metrics.postponementRate > 0.4 && metrics.completionRate < 0.4) return "Procrastinating";
  if (metrics.completionRate > 0.8) return "HighPerformance";
  if (metrics.completionRate < 0.2) return "Underutilized";
  return "Balanced";
}

/**
 * MDP Action Policy
 * Returns the recommended system action and user message for the current MDP state.
 */
export function mdpActionPolicy(state) {
  const policies = {
    Underutilized: {
      action: "suggest_tasks",
      message: "Your schedule has plenty of room. Consider pulling forward a goal or planning new tasks.",
      tone: "encouraging"
    },
    Balanced: {
      action: "maintain",
      message: "Your workload is well balanced. Maintain your current rhythm.",
      tone: "positive"
    },
    HighPerformance: {
      action: "encourage",
      message: "You're in a flow state! You've completed most of your tasks. Keep this momentum going.",
      tone: "celebratory"
    },
    Overloaded: {
      action: "plan_cleanup",
      message: "Your workload is too high. Consider postponing non-essential tasks or splitting large ones.",
      tone: "warning"
    },
    Procrastinating: {
      action: "refocus",
      message: "Several tasks have been postponed. Break larger tasks into smaller steps and commit to one today.",
      tone: "motivational"
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

export function computeStationaryDistribution(transitionMatrix, iterations = 10) {
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
