/**
 * Priority Scoring Service — Cognitive Decision Model
 * 
 * Implements a layered cognitive decision framework:
 * 1. Hard-rule overrides (force Critical/High in extreme cases)
 * 2. Parametric scoring (deadline, effort, workload)
 * 3. Behavioral adjustments (postponement penalty, effort correction)
 * 4. Rationale synthesis (human-readable explanation)
 */

/**
 * Generates a concise human-readable rationale for the assigned priority.
 */
function buildRationale(deadlineDays, effortLevel, workloadFlag, postponedCount, label) {
  const parts = [];

  if (deadlineDays !== null) {
    if (deadlineDays <= 0) parts.push("due today or overdue");
    else if (deadlineDays === 1) parts.push("due tomorrow");
    else if (deadlineDays <= 3) parts.push(`due in ${deadlineDays} days`);
  }

  if (effortLevel === "high") parts.push("high effort required");
  else if (effortLevel === "low") parts.push("low effort");

  if (workloadFlag) parts.push("schedule is overloaded");
  if (postponedCount >= 3) parts.push(`postponed ${postponedCount} times`);

  if (parts.length === 0) return `Assigned ${label} based on default scoring.`;
  return `${label}: ${parts.join(", ")}.`;
}

export function calculatePriority(task, workload) {
  const effort = String(task.effortLevel || "medium").toLowerCase();
  const postponedCount = task.postponedCount || 0;

  // Apply behaviorally-learned effort correction to estimated minutes
  const effortCorrection = task.effortCorrection || 1.0;
  const correctedMinutes = (task.estimatedMinutes || 30) * effortCorrection;

  // --- 1. Deadline Score (0–50) ---
  let deadlineScore = 5;
  let deadlineDays = null;
  if (task.deadline) {
    const now = new Date();
    const dueDate = new Date(task.deadline);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffMs = startOfDueDay - startOfToday;
    deadlineDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (deadlineDays <= 0) deadlineScore = 50;       // Due today or overdue
    else if (deadlineDays === 1) deadlineScore = 40;  // Due tomorrow
    else if (deadlineDays <= 3) deadlineScore = 30;   // 2–3 days
    else if (deadlineDays <= 7) deadlineScore = 15;   // 4–7 days
    else deadlineScore = 10;                          // 7+ days
  }

  // --- 2. Effort Score (0–30) ---
  let effortScore = 20;
  if (effort === "high") effortScore = 30;
  else if (effort === "low") effortScore = 10;

  // --- 3. Workload Score (0–20) ---
  let workloadScore = 5;
  if (workload.overloadFlag) workloadScore = 20;
  else if (workload.capacityPercentage > 80) workloadScore = 15;
  else if (workload.capacityPercentage >= 50) workloadScore = 10;

  // --- 4. Behavioral Penalty: repeated postponement ---
  let postponePenalty = 0;
  if (postponedCount >= 3) postponePenalty = 15;
  else if (postponedCount >= 1) postponePenalty = 5;

  let priorityScore = deadlineScore + effortScore + workloadScore + postponePenalty;
  priorityScore = Math.max(0, Math.min(100, priorityScore));

  // --- 5. Map Score to Label ---
  let priorityLabel = "Medium";
  if (priorityScore >= 80) priorityLabel = "Critical";
  else if (priorityScore >= 60) priorityLabel = "High";
  else if (priorityScore >= 40) priorityLabel = "Medium";
  else priorityLabel = "Low";

  // --- 6. Cognitive Hard-Rule Overrides ---
  // Rule: deadline <= 1 day AND effort = high → always Critical
  if (deadlineDays !== null && deadlineDays <= 1 && effort === "high") {
    priorityLabel = "Critical";
    priorityScore = Math.max(priorityScore, 85);
  }
  // Rule: task postponed 3+ times with near deadline → bump to High minimum
  if (postponedCount >= 3 && deadlineDays !== null && deadlineDays <= 3 && priorityLabel === "Medium") {
    priorityLabel = "High";
    priorityScore = Math.max(priorityScore, 65);
  }
  // Rule: overloaded AND deadline tomorrow → Critical
  if (workload.overloadFlag && deadlineDays !== null && deadlineDays <= 1) {
    priorityLabel = "Critical";
    priorityScore = Math.max(priorityScore, 90);
  }

  // --- 7. Build rationale string ---
  const priorityRationale = buildRationale(deadlineDays, effort, workload.overloadFlag, postponedCount, priorityLabel);

  return {
    priorityScore,
    priorityLabel,
    priorityRationale,
    correctedMinutes  // Expose so taskController can use the corrected value
  };
}
