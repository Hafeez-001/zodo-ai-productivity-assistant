/**
 * Computes workload from ALL active (non-completed, non-archived) tasks.
 *
 * FIX (Issue #4): The previous implementation date-binned tasks by their deadline,
 * meaning a task due next Friday contributed 0 minutes to today's overload, while
 * a task with no deadline was binned to its createdAt date — both wrong.
 *
 * New behaviour: sum estimatedMinutes across every active task regardless of deadline.
 * This makes the 480-minute threshold representative of total pending cognitive load,
 * not an accident of which deadlines happen to fall on today's calendar date.
 *
 * threshold = 480 min = 8 hours of work capacity per day.
 */
export function computeDailyWorkload(tasks, threshold = 480) {
  const activeTasks = tasks.filter(t => t.status !== "completed" && !t.archived);
  const totalMinutes = activeTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  const capacityPercentage = Math.min(100, Math.round((totalMinutes / threshold) * 100));
  const overloadFlag = totalMinutes > threshold;
  return { totalMinutes, capacityPercentage, overloadFlag };
}
