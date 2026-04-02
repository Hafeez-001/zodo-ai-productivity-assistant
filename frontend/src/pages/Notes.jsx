import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/ui';
import { FileText, Mic, History, Trash2, Calendar, Clock, ArrowLeft, CheckCircle2, Sparkles, Check, X, Edit2 } from 'lucide-react';
import MeetingMode from '../components/MeetingMode';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { getNotes, removeNote, getNoteById, createTask } from '../services/api';

export default function Notes() {
  const [view, setView] = useState('meeting'); // 'meeting', 'history', 'detail'
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const { showToast } = useToast();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      showToast("Failed to fetch notes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'history') {
      fetchNotes();
    }
  }, [view]);

  const handleDelete = async (id) => {
    try {
      await removeNote(id);
      setNotes(notes.filter(n => n._id !== id));
      showToast("Note deleted", "success");
    } catch (error) {
      showToast("Delete failed", "error");
    }
  };

  const handleViewNote = async (id) => {
    setView('detail');
    setLoading(true);
    try {
      const data = await getNoteById(id);
      setActiveNote(data);
    } catch (err) {
      showToast("Failed to load note details", "error");
      setView('history');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTask = async (index) => {
    if (!activeNote || !activeNote.tasks) return;
    const task = activeNote.tasks[index];
    if (task.status === 'added' || task.status === 'ignored') return;
    try {
      const rawInput = `${task.title} ${task.deadline || ''}`.trim();
      await createTask({ 
        rawInput,
        title: task.title,
        deadline: task.deadline,
        type: task.type || undefined,
        forceCreate: true
      });
      
      setActiveNote(prev => {
        const newTasks = [...prev.tasks];
        newTasks[index] = { ...newTasks[index], status: 'added' };
        return { ...prev, tasks: newTasks };
      });
      showToast("Task created!", "success");
    } catch (err) {
      // Show specific message for fixed-event time conflicts
      const isConflict = err.message && (
        err.message.includes("scheduled event at this time") ||
        err.message.includes("already have")
      );
      showToast(
        isConflict
          ? "You already have a meeting or event at this time."
          : "Failed to create task",
        "error"
      );
    }
  };

  const handleIgnoreTask = (index) => {
    if (!activeNote || !activeNote.tasks) return;
    setActiveNote(prev => {
      const newTasks = [...prev.tasks];
      newTasks[index] = { ...newTasks[index], status: 'ignored' };
      return { ...prev, tasks: newTasks };
    });
  };

  const handleStartEdit = (index) => {
    if (!activeNote || !activeNote.tasks) return;
    setEditingTaskIndex(index);
    setEditTitle(activeNote.tasks[index].title || "");
    setEditDeadline(activeNote.tasks[index].deadline || "");
  };

  const handleSaveEdit = (index) => {
    setActiveNote(prev => {
      const newTasks = [...prev.tasks];
      newTasks[index] = { ...newTasks[index], title: editTitle, deadline: editDeadline };
      return { ...prev, tasks: newTasks };
    });
    setEditingTaskIndex(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Meeting Notes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Record meetings and generate AI summaries instantly.</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setView('meeting')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              view === 'meeting' ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            <Mic className="w-4 h-4" /> Meeting Mode
          </button>
          <button
            onClick={() => setView('history')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              view === 'history' ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            <History className="w-4 h-4" /> Saved Notes
          </button>

        </div>
      </div>

      {view === 'meeting' ? (
        <MeetingMode onSaveSuccess={() => setView('history')} />
      ) : view === 'detail' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Button variant="ghost" onClick={() => setView('history')} className="flex items-center gap-2 mb-4 text-gray-500">
            <ArrowLeft className="w-4 h-4" /> Back to Notes
          </Button>

          {loading || !activeNote ? (
            <p className="text-center py-12 text-gray-400">Loading details...</p>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transcript Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold">Transcript</h3>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[300px] max-h-[600px] overflow-y-auto">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {activeNote.transcript}
                    </p>
                  </div>
                </div>

                {/* Summary Column */}
                <div className="space-y-6">
                  <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden h-full">
                    <Sparkles className="absolute top-4 right-4 text-blue-400 w-12 h-12 opacity-20" />
                    <h3 className="text-xl font-bold mb-6">AI Meeting Insight</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-3 opacity-70">Key Points</h4>
                        <ul className="space-y-3">
                          {activeNote.summary?.keyPoints?.map((p, i) => (
                            <li key={i} className="flex gap-3 text-sm font-medium">
                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-6 border-t border-white/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-3 opacity-70">Decisions</h4>
                        <ul className="space-y-3">
                          {activeNote.summary?.decisions?.map((d, i) => (
                            <li key={i} className="flex gap-3 text-sm font-bold">
                              <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" />
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Section */}
              {activeNote.tasks && activeNote.tasks.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Action Items</h4>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900">
                      Review & Confirm
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeNote.tasks.map((task, i) => {
                      const isAdded = task.status === 'added';
                      const isIgnored = task.status === 'ignored';
                      const isEditing = editingTaskIndex === i;

                      if (isIgnored) return null;

                      return (
                        <li key={i} className={cn(
                          "flex flex-col gap-3 p-4 rounded-xl border transition-all",
                          isAdded ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                        )}>
                          {isEditing ? (
                            <div className="flex flex-col gap-3">
                              <input 
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                                placeholder="Task Title"
                              />
                              <input 
                                value={editDeadline}
                                onChange={e => setEditDeadline(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 dark:text-white"
                                placeholder="Deadline (e.g., Tomorrow at 5pm)"
                              />
                              <div className="flex gap-2 justify-end mt-1">
                                <button onClick={() => setEditingTaskIndex(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                                <button onClick={() => handleSaveEdit(i)} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3">
                                  <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                                    isAdded ? "bg-green-500 border-green-500" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                  )}>
                                    {isAdded ? <Check className="w-3 h-3 text-white" /> : <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{i + 1}</span>}
                                  </div>
                                  <div>
                                    <p className={cn("text-sm font-bold", isAdded ? "text-green-800 dark:text-green-300" : "text-gray-800 dark:text-gray-200")}>
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500">
                                      {task.deadline && <span className="text-orange-600 dark:text-orange-400 whitespace-nowrap">Due: {task.deadline}</span>}
                                      {task.priority && <span className="text-blue-600 dark:text-blue-400 capitalize">{task.priority} Priority</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {!isAdded && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-1">
                                  <button onClick={() => handleConfirmTask(i)} className="flex items-center justify-center gap-1.5 flex-1 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-400 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                    <Check className="w-3.5 h-3.5" /> Add Task
                                  </button>
                                  <button onClick={() => handleStartEdit(i)} className="flex items-center justify-center gap-1.5 flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </button>
                                  <button onClick={() => handleIgnoreTask(i)} className="flex items-center justify-center gap-1.5 flex-1 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                    <X className="w-3.5 h-3.5" /> Ignore
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <p className="text-center col-span-full py-12 text-gray-400">Loading notes...</p>
          ) : notes.length === 0 ? (
            <Card className="col-span-full p-12 text-center space-y-4 dark:bg-gray-900 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No notes yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Your summarized meetings will appear here.</p>
              </div>
              <Button variant="outline" onClick={() => setView('meeting')}>
                Start First Meeting
              </Button>
            </Card>
          ) : (
            notes.map(note => (
              <Card key={note._id} onClick={() => handleViewNote(note._id)} className="p-6 space-y-4 group transition-all hover:shadow-lg border-gray-100 dark:border-gray-800 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{note.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(note.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(note._id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Quick Summary</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {note.summary?.keyPoints?.slice(0, 2).map((pt, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-blue-400 dark:text-blue-500 mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
