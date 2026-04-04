import React, { useEffect, useState } from "react";
import { getWeeklyReport, getBehavior, getMdpAssessment } from "../services/api.js";
import { Button, Card } from "../components/ui";
import WeeklyReport from "../components/WeeklyReport.jsx";
import { TrendingUp, Brain, Cpu, BarChart3, ChevronRight, Sparkles, Clock, ArrowRight, CheckCircle2, Target } from "lucide-react";
import { cn } from "../lib/utils";

const STATE_COLORS = {
  Balanced: "text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400",
  HighPerformance: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  Overloaded: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
  Procrastinating: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
  Underutilized: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
};

function MetricCard({ label, value, Icon, color = "bg-gray-50 dark:bg-gray-900" }) {
  return (
    <div className={cn("rounded-2xl p-5 border border-gray-100 dark:border-gray-800 space-y-2", color)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function Insights() {
  const [behavior, setBehavior] = useState(null);
  const [mdpData, setMdpData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const beh = await getBehavior();
        setBehavior(beh);
      } catch (err) {
        console.error("Behavior fetch error:", err);
      }

      try {
        const mdp = await getMdpAssessment();
        console.log("MDP DATA:", mdp);
        setMdpData(mdp);
      } catch (err) {
        console.error("MDP Assessment fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stateColor = behavior?.currentState ? STATE_COLORS[behavior.currentState] : STATE_COLORS.Balanced;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Your productivity patterns and AI behavioral insights.</p>
      </div>

      {/* Behavior State Banner */}
      {!loading && behavior && (
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Current State</p>
                <span className={cn("text-sm font-black px-2.5 py-0.5 rounded-lg", stateColor)}>
                  {behavior.currentState}
                </span>
              </div>
            </div>
            <div className="flex gap-6 ml-auto flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{Math.round((behavior.completionRate || 0) * 100)}%</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Completion</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{Math.round((behavior.postponementRate || 0) * 100)}%</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Postponed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{behavior.overloadFrequency || 0}</p>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Overloads</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MDP Policy AI Action Suggestions Banner */}
      {!loading && mdpData && (
        <Card className="p-6 border-gray-100 dark:border-gray-800 dark:bg-gray-900 shadow-sm transition-all mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-3">
                  Zodo AI Action Policy
                  <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest", STATE_COLORS[mdpData.state] || STATE_COLORS.Balanced)}>
                    State: {mdpData.state}
                  </span>
                </h3>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 leading-relaxed max-w-3xl">
                  {mdpData.message}
                </p>
              </div>

              {mdpData.suggestions?.length > 0 ? (
                <div className="space-y-2.5 mt-4 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <div className="grid gap-2">
                    {mdpData.suggestions.map((sug, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 shadow-sm gap-2">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={cn("p-2 rounded-lg shadow-inner", 
                            sug.suggestedAction === "postpone" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" :
                            sug.suggestedAction === "split" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" :
                            sug.suggestedAction === "focus" ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" :
                            "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          )}>
                            {sug.suggestedAction === "focus" ? <Target className="w-4 h-4" /> :
                             sug.suggestedAction === "split" ? <ArrowRight className="w-4 h-4" /> : 
                             sug.suggestedAction === "postpone" ? <Clock className="w-4 h-4" /> :
                             <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{sug.taskTitle || "General recommendation"}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-1">{sug.reason}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 whitespace-nowrap self-start sm:self-auto">
                          {sug.suggestedAction.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-5 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium italic">
                    Your workload is balanced. No action needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Behavioral metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Markov State Transitions */}
          {behavior?.transitionMatrix && (
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Markov State Intelligence</h3>
              </div>
              <div className="space-y-3">
                {["Balanced", "HighPerformance", "Overloaded", "Procrastinating", "Underutilized"].map(state => (
                  <div key={state} className="flex items-center gap-3">
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md w-28 text-center", STATE_COLORS[state])}>
                      {state}
                    </span>
                    <div className={cn(
                      "h-2 rounded-full flex-1",
                      "bg-gray-100 dark:bg-gray-800 overflow-hidden"
                    )}>
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          state === "Balanced" ? "bg-blue-500" :
                          state === "HighPerformance" ? "bg-green-500" :
                          state === "Overloaded" ? "bg-red-500" :
                          state === "Procrastinating" ? "bg-amber-500" : "bg-gray-400"
                        )}
                        style={{ 
                          width: `${behavior.currentState === state ? 100 : 0}%`,
                          opacity: behavior.currentState === state ? 1 : 0.3
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 text-right">
                      {behavior.currentState === state ? "✓" : ""}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
                The Markov Decision Model transitions your state based on task completion, deadline pressure, and postponement patterns.
              </p>
            </Card>
          )}

          {/* Effort Accuracy */}
          {behavior?.effortAccuracyMap && (
            <Card className="p-6 dark:bg-gray-900 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Effort Estimation Accuracy</h3>
              </div>
              <div className="space-y-4">
                {["low", "medium", "high"].map(effort => {
                  const correction = behavior.effortAccuracyMap[effort] || 1.0;
                  const pct = Math.min(100, Math.max(5, correction * 50));
                  const label = correction > 1.2 ? "Takes longer" : correction < 0.8 ? "Faster than expected" : "Accurate";
                  return (
                    <div key={effort} className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 capitalize">{effort} effort</span>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{label} ({correction.toFixed(1)}x)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700",
                            correction > 1.2 ? "bg-red-400" : correction < 0.8 ? "bg-green-400" : "bg-blue-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
                Zodo learns how accurate your effort estimates are and adjusts workload calculations accordingly.
              </p>
            </Card>
          )}
        </div>

        {/* Right: Weekly Report + Streak */}
        <div>
          <WeeklyReport />
        </div>
      </div>
    </div>
  );
}
