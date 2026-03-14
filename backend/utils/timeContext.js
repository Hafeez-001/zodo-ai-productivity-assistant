export function getTimeContext() {
  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const currentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentWeekday = weekdays[now.getDay()];
  return {
    currentDate,
    currentTime,
    currentWeekday,
    timestamp: now.toISOString()
  };
}
