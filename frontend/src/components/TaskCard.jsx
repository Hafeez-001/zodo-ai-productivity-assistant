import React, { useState } from "react";
import { 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Zap,
  Tag,
  AlertTriangle,
  Info
} from "lucide-react";
import { Card, Button, Input } from "./ui";
import { cn } from "../lib/utils";

const TAG_COLORS = {
  "#Work": "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  "#Personal": "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900",
  "#Coding": "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900",
  "#Study": "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
  "#Health": "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
  "#Finance": "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  "#Other": "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};

const statuses = [
  { value: "pending", label: "Pending", icon: Circle, color: "text-text-tertiary" },
  { value: "in_progress", label: "In Progress", icon: Clock, color: "text-primary" },
  { value: "postponed", label: "Postponed", icon: Zap, color: "text-amber-500" },
  { value: "completed", label: "Completed", icon: CheckCircle2, color: "text-secondary" }
];

export default function TaskCard({ task, onUpdate, onDelete, selected, onSelect }) {
  const [title, setTitle] = useState(task.title || "");
  const [desc, setDesc] = useState(task.description || "");
  const [editing, setEditing] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const currentStatus = statuses.find(s => s.value === task.status) || statuses[0];

  async function save() {
    await onUpdate(task._id, { title, description: desc });
    setEditing(false);
  }

  const priorityColors = {
    Critical: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
    High: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
    Medium: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
    Low: "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
  };

  return (
    <Card
      className={cn(
        "p-6 transition-all duration-300 group cursor-pointer border-gray-100 dark:bg-gray-900 dark:border-gray-800",
        selected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700",
        task.status === "completed" && "opacity-60"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' });
              }}
              className={cn("transition-all hover:scale-110 active:scale-90 cursor-pointer", currentStatus.color)}
            >
              <currentStatus.icon className="w-6 h-6" />
            </button>
            
            {editing ? (
              <Input 
                className="h-9 py-0 font-bold text-gray-900 dark:text-gray-100" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                onBlur={save}
                onKeyDown={e => e.key === 'Enter' && save()}
                autoFocus
              />
            ) : (
              <h3 
                className={cn(
                  "text-base font-black text-gray-900 dark:text-gray-100 leading-tight transition-all",
                  task.status === "completed" && "line-through text-gray-400 font-medium"
                )}
                onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
              >
                {task.title}
              </h3>
            )}
          </div>
          
          <div className="pl-9">
            {editing ? (
              <textarea 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-200 min-h-[80px] transition-all"
                value={desc} 
                onChange={e => setDesc(e.target.value)}
                onBlur={save}
              />
            ) : (
              <p className={cn(
                "text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed line-clamp-2",
                task.status === "completed" && "line-through text-gray-400"
              )}>
                {task.description || task.rawInput}
              </p>
            )}
            {/* Tags */}
            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {task.tags.map(tag => (
                  <span key={tag} className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-md border",
                    TAG_COLORS[tag] || TAG_COLORS["#Other"]
                  )}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Priority Rationale */}
            {task.priorityRationale && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                {task.priorityRationale}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          {/* Postponed badge */}
          {task.postponedCount > 0 && (
            <span className="absolute -top-1 -left-1 flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-[8px] font-black rounded-full border-2 border-white dark:border-gray-900" title={`Postponed ${task.postponedCount}x`}>
              {task.postponedCount}
            </span>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-all cursor-pointer group-hover:text-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showStatusMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-30 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <p className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Update Status</p>
              {statuses.map(s => (
                <button
                  key={s.value}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(task._id, { status: s.value });
                    setShowStatusMenu(false);
                  }}
                >
                  <s.icon className={cn("w-4 h-4", s.color)} />
                  {s.label}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 my-2" />
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task._id);
                  setShowStatusMenu(false);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className={cn(
          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm",
          priorityColors[task.priorityLabel || 'Medium']
        )}>
          {task.priorityLabel || 'Medium'}
        </div>
        
        <div className="flex items-center gap-2 text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{task.effortLevel || 'medium'}</span>
        </div>

        {task.deadline && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold bg-blue-50/50 dark:bg-blue-950/20 px-2 py-1 rounded-lg border border-blue-100/50 dark:border-blue-900/50">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] uppercase tracking-widest leading-none">
              {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {new Date(task.deadline).getHours() !== 0 || new Date(task.deadline).getMinutes() !== 0 ? (
                <> • {new Date(task.deadline).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}</>
              ) : null}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
           <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
              <div 
                className={cn(
                  "h-full transition-all duration-700 ease-out",
                  task.effortLevel === "low" ? "bg-green-500" : task.effortLevel === "medium" ? "bg-blue-500" : "bg-purple-500"
                )}
                style={{ width: `${Math.min(100, (task.estimatedMinutes || 30) / 120 * 100)}%` }}
              />
           </div>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{task.estimatedMinutes || 30}m</span>
        </div>
      </div>
    </Card>
  );
}
