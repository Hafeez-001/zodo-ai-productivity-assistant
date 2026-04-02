import React, { useEffect, useState } from "react";
import { getTasks, patchTask, removeTask, getWorkload, planCleanup as apiPlanCleanup, archiveTasks } from "../services/api.js";
import TaskCard from "../components/TaskCard.jsx";
import WorkloadMeter from "../components/WorkloadMeter.jsx";
import PlanCleanupModal from "../components/PlanCleanupModal.jsx";
import { Card, Button, Input } from "../components/ui";
import { Search, Filter, ListTodo, LayoutGrid, LayoutList, Tag, Archive } from "lucide-react";
import { cn } from "../lib/utils";
import { useToast } from "../context/ToastContext";

const TAGS = ["All", "#Work", "#Personal", "#Coding", "#Study", "#Health", "#Finance", "#Other"];

export default function Tasks() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [metrics, setMetrics] = useState({ totalMinutes: 0, capacityPercentage: 0, overloadFlag: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTag, setActiveTag] = useState("All");
  const [sortMode, setSortMode] = useState("default");
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);

  // Plan Cleanup modal state
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupSuggestions, setCleanupSuggestions] = useState([]);

  async function refresh() {
    setLoading(true);
    try {
      const sortParam = sortMode === "default" ? undefined : sortMode;
      const tagParam = activeTag === "All" ? undefined : activeTag;
      const [list, wl] = await Promise.all([getTasks({ sort: sortParam, tag: tagParam }), getWorkload()]);
      setTasks(list);
      setMetrics(wl);
    } catch (e) {
      console.error("Failed to refresh tasks", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [sortMode, activeTag]);

  async function onUpdate(id, updates) {
    try {
      const t = await patchTask(id, updates);
      setTasks(prev => prev.map(x => (x._id === id ? t : x)));
      const wl = await getWorkload();
      setMetrics(wl);
    } catch (error) {
      console.error("Update failed", error);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await removeTask(id);
      setTasks(prev => prev.filter(x => x._id !== id));
      const wl = await getWorkload();
      setMetrics(wl);
    } catch (error) {
      console.error("Delete failed", error);
    }
  }

  async function handlePlanCleanup() {
    setCleanupOpen(true);
    setCleanupLoading(true);
    setCleanupSuggestions([]);
    try {
      const result = await apiPlanCleanup();
      setCleanupSuggestions(result.suggestions || []);
    } catch (e) {
      showToast("Plan cleanup failed. Try again.", "error");
      setCleanupOpen(false);
    } finally {
      setCleanupLoading(false);
    }
  }

  async function handleApplySuggestion(suggestion) {
    if (suggestion.action === "postpone" && suggestion.taskId) {
      try {
        await patchTask(suggestion.taskId, { status: "postponed" });
        showToast(`Postponed: ${suggestion.taskTitle}`, "success");
        refresh();
      } catch { showToast("Failed to apply suggestion", "error"); }
    } else if (suggestion.action === "split") {
      showToast(`Open "${suggestion.taskTitle}" to manually split it into smaller tasks.`, "info");
    }
  }

  async function handleArchive() {
    try {
      const result = await archiveTasks();
      showToast(`Archived ${result.archivedCount} completed tasks.`, "success");
      refresh();
    } catch { showToast("Archive failed", "error"); }
  }

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your productivity pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={handleArchive}
            title="Archive completed tasks older than 7 days"
          >
            <Archive className="w-4 h-4" /> Archive
          </Button>
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer",
              activeTag === tag
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
            )}
          >
            <Tag className="inline w-3 h-3 mr-1 opacity-70" />
            {tag}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-4 flex flex-wrap items-center gap-4 bg-white/80 dark:bg-gray-900 dark:border-gray-800 backdrop-blur-md border-gray-100">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-10 h-10 bg-gray-50 dark:bg-gray-800 dark:text-gray-200 border-none focus:bg-white dark:focus:bg-gray-700"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-700 pl-4">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                className="bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none cursor-pointer hover:text-blue-600 transition-colors py-2"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="postponed">Postponed</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-l border-gray-100 dark:border-gray-700 pl-4">
              <select 
                className="bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none cursor-pointer hover:text-blue-600 transition-colors py-2"
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
              >
                <option value="default">Sort: Newest</option>
                <option value="deadline">Sort: Deadline</option>
                <option value="effort">Sort: Effort</option>
                <option value="priority">Sort: AI Priority</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg ml-auto border border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-md transition-all cursor-pointer", viewMode === 'list' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-md transition-all cursor-pointer", viewMode === 'grid' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </Card>

          <div className={cn("grid gap-6", viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)
            ) : filteredTasks.map(t => (
              <TaskCard key={t._id} task={t} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
            
            {!loading && filteredTasks.length === 0 && (
              <div className="text-center py-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl border-dashed">
                <ListTodo className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No tasks found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Try adjusting your filters or create a new task.</p>
                <Button variant="secondary" className="mt-6" onClick={() => { setSearchQuery(""); setFilterStatus("all"); setActiveTag("All"); }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <WorkloadMeter 
            {...metrics}
            onPlanCleanup={handlePlanCleanup}
          />
          
          <Card className="p-6 space-y-6 dark:bg-gray-900 dark:border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Priority Breakdown</h3>
            <div className="space-y-2">
              {['Critical', 'High', 'Medium', 'Low'].map(p => (
                <button 
                  key={p}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full shadow-sm",
                      p === 'Critical' ? "bg-red-500" : p === 'High' ? "bg-amber-500" : p === 'Medium' ? "bg-blue-500" : "bg-gray-400"
                    )} />
                    {p}
                  </span>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md transition-all">
                    {tasks.filter(t => t.priorityLabel === p).length}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Plan Cleanup Modal */}
      <PlanCleanupModal
        isOpen={cleanupOpen}
        onClose={() => setCleanupOpen(false)}
        suggestions={cleanupSuggestions}
        loading={cleanupLoading}
        onApply={handleApplySuggestion}
      />
    </div>
  );
}
