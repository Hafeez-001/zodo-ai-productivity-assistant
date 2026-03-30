import React, { useCallback, useState, useEffect } from "react";
import VoiceOrb from "../components/VoiceOrb.jsx";
import { createTask, getWorkload, getTasks } from "../services/api.js";
import { Card, Button } from "../components/ui";
import WorkloadMeter from "../components/WorkloadMeter";
import TaskCard from "../components/TaskCard";
import { Sparkles, ArrowRight, ListTodo, BrainCircuit, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [last, setLast] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [wl, tasks] = await Promise.all([getWorkload(), getTasks()]);
      setWorkload(wl);
      setRecentTasks(tasks.slice(0, 3));
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVoiceResult = useCallback((t) => {
    setInput(t);
  }, []);

  async function handleCreateTask() {
    if (!input.trim()) return;
    setPending(true);
    try {
      const result = await createTask({ rawInput: input.trim() });
      setLast(result.task);
      setInput("");
      setError(null);
      fetchData();
    } catch (err) {
      console.error("Task creation failed", err);
      if (err.message) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center gap-16 pt-8">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Focus
          </div>
          <h1 className="text-6xl font-black tracking-tight text-gray-900 dark:text-gray-100 leading-[1.05]">
            Capture your thoughts, <br />
            <span className="text-blue-600 dark:text-blue-500">elevate your focus.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            Zodo uses calm AI to help you structure your day without the noise. 
            Speak naturally, and we'll handle the organization.
          </p>
          <div className="flex items-center justify-center lg:justify-start gap-5 pt-4">
            <Button size="lg" className="gap-2.5 h-14 px-8 text-base shadow-lg shadow-blue-500/20" onClick={() => document.getElementById('task-input').focus()}>
              Start Capturing <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="lg" className="h-14 px-8 text-base border-gray-200 dark:border-gray-700" onClick={() => navigate('/insights')}>
              View Insights
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center relative">
          <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full" />
          <div className="relative z-10 scale-110 lg:scale-125">
            <VoiceOrb onTranscript={handleVoiceResult} />
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Input Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-10 space-y-8 relative overflow-hidden border-none shadow-xl shadow-gray-200/50 dark:shadow-none">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] -mr-8 -mt-8 text-gray-900 dark:text-gray-100">
              <BrainCircuit className="w-48 h-48" />
            </div>
            
            <div className="space-y-3 relative z-10">
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">What's on your mind?</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Type or speak your task. Zodo will extract priority, effort, and deadlines.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <div className="flex-1 relative group">
                <input
                  id="task-input"
                  className={cn(
                    "w-full pl-6 pr-14 py-5 bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl outline-none focus:ring-4 transition-all text-xl font-medium",
                    error 
                      ? "border-red-500/50 bg-red-50/10 focus:ring-red-500/10 focus:border-red-500" 
                      : "border-transparent focus:ring-blue-500/10 focus:border-blue-500/20 focus:bg-white dark:focus:bg-gray-700",
                    "text-gray-900 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  )}
                  placeholder="e.g. Finish the design presentation by 4pm"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                   {pending ? (
                     <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <Sparkles className={cn("w-6 h-6 transition-colors", error ? "text-red-400" : "text-gray-200 group-focus-within:text-blue-500")} />
                   )}
                </div>
              </div>
              <Button 
                size="lg" 
                className={cn(
                  "h-auto py-5 px-10 text-lg font-black shadow-lg",
                  error ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "shadow-blue-500/20"
                )}
                onClick={handleCreateTask}
                disabled={pending || !input.trim()}
              >
                Create
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">!</span>
                </div>
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            {last && (
              <div className="flex items-center gap-4 p-5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Task captured successfully</p>
                  <p className="text-gray-900 dark:text-gray-100 font-bold mt-0.5">{last.title}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setLast(null)} className="text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40">
                  Dismiss
                </Button>
              </div>
            )}
          </Card>

          {/* Recent Tasks */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Recent Activity
              </h3>
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => navigate('/tasks')}>
                View All Tasks
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {recentTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  onUpdate={async (id, updates) => {
                    setRecentTasks(prev => prev.map(t => t._id === id ? { ...t, ...updates } : t));
                    fetchData();
                  }}
                  onDelete={() => fetchData()}
                />
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/50 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] text-gray-400 dark:text-gray-600 font-medium">
                  No recent tasks. Start by capturing one above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-8">
          {workload && (
            <div className="sticky top-24 space-y-8">
              <WorkloadMeter 
                totalMinutes={workload.totalMinutes}
                capacityPercentage={workload.capacityPercentage}
                overloadFlag={workload.overloadFlag}
                markovState={workload.markovState}
                actionPolicy={workload.actionPolicy}
              />
              
              <Card className="p-8 bg-blue-600 text-white space-y-5 overflow-hidden relative border-none shadow-xl shadow-blue-500/30">
                <div className="absolute -right-8 -bottom-8 opacity-20 rotate-12">
                  <Sparkles className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-70">Behavioral Tip</h3>
                  <p className="text-base font-bold leading-relaxed mt-3">
                    Using voice input is 3x faster than typing. Try describing your task with effort levels like "quick" or "detailed".
                  </p>
                  <Button variant="secondary" className="w-full mt-6 bg-white/10 border-white/20 text-white hover:bg-white/20 border-2 font-black h-12">
                    Learn More
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
