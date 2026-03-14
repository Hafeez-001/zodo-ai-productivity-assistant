import React, { useState, useEffect } from 'react';
import { getWeeklyReport, getStreak } from '../services/api';
import { Card } from './ui';
import { Flame, BarChart3, Sparkles, Loader2, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

export default function WeeklyReport() {
  const [report, setReport] = useState(null);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getWeeklyReport().catch(() => null),
      getStreak().catch(() => null)
    ]).then(([rep, str]) => {
      if (rep) setReport(rep);
      if (str) setStreak(str);
    }).catch(setError).finally(() => setLoading(false));
  }, []);

  const days = report?.completionsByDay 
    ? Object.entries(report.completionsByDay).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <Card className="p-5 dark:bg-gray-900 dark:border-gray-800">
        <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Productivity Streak</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center">
              <Flame className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{streak.currentStreak}</p>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">day streak</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-100 dark:bg-gray-800" />
          <div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-black text-gray-900 dark:text-gray-100">{streak.longestStreak}</p>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">best streak</p>
          </div>
        </div>
      </Card>

      {/* Weekly Report */}
      <Card className="p-5 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Weekly Focus Report</h3>
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase">AI Generated</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Generating report...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">Could not load weekly report.</p>
        ) : report ? (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Completed", value: report.totalCompleted },
                { label: "Created", value: report.totalCreated },
                { label: "Rate", value: `${Math.round(report.completionRate * 100)}%` }
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</p>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{label}</p>
                </div>
              ))}
            </div>

            {/* Most productive day */}
            {report.mostProductiveDay && report.mostProductiveDay !== "N/A" && (
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  Most productive: <span className="text-blue-600 dark:text-blue-400">{report.mostProductiveDay}</span>
                </p>
              </div>
            )}

            {/* AI Narrative */}
            {report.narrative && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-950/10 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">
                  "{report.narrative}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Complete some tasks to get your first report.</p>
        )}
      </Card>
    </div>
  );
}
