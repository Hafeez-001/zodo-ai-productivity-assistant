import Task from "../models/Task.js";
import BehaviorState from "../models/BehaviorState.js";
import { generateWeeklyReport } from "../services/geminiService.js";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * GET /api/weekly-report
 * Generates a personalized weekly productivity report.
 */
export async function getWeeklyReport(req, res) {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const weekTasks = await Task.find({
      userId,
      updatedAt: { $gte: sevenDaysAgo }
    });

    const completedThisWeek = weekTasks.filter(t => t.status === "completed");
    const createdThisWeek = weekTasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo);
    const highPriorityCompleted = completedThisWeek.filter(t => 
      t.priorityLabel === "High" || t.priorityLabel === "Critical"
    );
    const highPriorityTotal = weekTasks.filter(t => 
      t.priorityLabel === "High" || t.priorityLabel === "Critical"
    );

    // Find most productive day
    const completionsByDay = {};
    completedThisWeek.forEach(t => {
      const day = DAYS[new Date(t.updatedAt).getDay()];
      completionsByDay[day] = (completionsByDay[day] || 0) + 1;
    });
    const mostProductiveDay = Object.entries(completionsByDay)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const behavior = await BehaviorState.findOne({ userId });
    const currentStreak = behavior?.currentStreak || 0;
    const longestStreak = behavior?.longestStreak || 0;

    const stats = {
      totalCompleted: completedThisWeek.length,
      totalCreated: createdThisWeek.length,
      completionRate: createdThisWeek.length > 0 ? completedThisWeek.length / createdThisWeek.length : 0,
      highPriorityRate: highPriorityTotal.length > 0 ? highPriorityCompleted.length / highPriorityTotal.length : 0,
      mostProductiveDay,
      currentStreak,
      longestStreak
    };

    // Generate AI narrative
    const narrative = await generateWeeklyReport(stats);

    // Store in BehaviorState weekly history
    if (behavior) {
      const weekStart = new Date(sevenDaysAgo);
      weekStart.setHours(0, 0, 0, 0);
      const weekEntry = {
        weekStartDate: weekStart,
        completionRate: stats.completionRate,
        totalCompleted: stats.totalCompleted,
        totalCreated: stats.totalCreated,
        mostProductiveDay,
        aiNarrative: narrative
      };
      behavior.weeklyStats.push(weekEntry);
      if (behavior.weeklyStats.length > 12) behavior.weeklyStats.shift();
      await behavior.save();
    }

    res.json({
      ...stats,
      narrative,
      completionsByDay,
      currentState: behavior?.currentState || "Balanced"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/streak
 * Returns the current and longest streak.
 */
export async function getStreak(req, res) {
  try {
    const userId = req.user.id;
    const behavior = await BehaviorState.findOne({ userId });
    res.json({
      currentStreak: behavior?.currentStreak || 0,
      longestStreak: behavior?.longestStreak || 0,
      lastActiveDate: behavior?.lastActiveDate || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
