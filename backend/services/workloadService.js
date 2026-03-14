export function computeDailyWorkload(tasks, threshold = 480) {
  const byDay = {};
  for (const t of tasks) {
    const date = t.deadline ? new Date(t.deadline) : new Date(t.createdAt || Date.now());
    const key = date.toISOString().slice(0, 10);
    byDay[key] = (byDay[key] || 0) + (t.estimatedMinutes || 0);
  }
  const todayKey = new Date().toISOString().slice(0, 10);
  const totalMinutes = byDay[todayKey] || 0;
  const capacityPercentage = Math.min(100, Math.round((totalMinutes / threshold) * 100));
  const overloadFlag = totalMinutes > threshold;
  return { totalMinutes, capacityPercentage, overloadFlag };
}
