import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, CheckCircle2, ListTodo, Save, FileText, Plus, Check, X, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { createNote, createTask, transcribeAudio } from '../services/api';

export default function MeetingMode({ onSaveSuccess }) {
  const [status, setStatus] = useState('idle'); // idle, recording, processing, completed
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [supported, setSupported] = useState(true);
  const { showToast } = useToast();
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSupported(false);
    }
  }, []);

  const toggleRecording = async () => {
    if (!supported) {
      showToast("Audio recording is not supported in this browser.", "error");
      return;
    }

    if (status === 'idle') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstart = () => {
          setTranscript('');
          setSummary(null);
          setTasks([]);
          setEditingTaskIndex(null);
          setStatus('recording');
        };

        mediaRecorder.onstop = async () => {
          setStatus('processing');
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(track => track.stop());
          
          try {
            const result = await transcribeAudio(audioBlob);
            if (result.transcript) {
              setTranscript(result.transcript);
              await processMeeting(result.transcript);
            } else {
              showToast("No speech detected or transcription failed", "info");
              setStatus('idle');
            }
          } catch (error) {
            console.error("Transcription error:", error);
            showToast("Failed to transcribe audio", "error");
            setStatus('idle');
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error("Microphone access error:", err);
        showToast("Cannot access microphone", "error");
      }
    } else if (status === 'recording') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const processMeeting = async (text) => {
    setStatus('processing');
    try {
      const data = await createNote(text, 'Meeting Notes');
      setSummary(data.summary);
      if (data.tasks) {
        setTasks(data.tasks.map(t => ({ ...t, status: 'pending' })));
      }
      setStatus('completed');
      showToast("Meeting summarized!", "success");
    } catch (error) {
      showToast("Failed to summarize AI insights", "error");
      setStatus('idle');
    }
  };

  const handleConfirmTask = async (index) => {
    const task = tasks[index];
    if (task.status !== 'pending') return;
    try {
      // Add both title and deadline for the NLP parser
      const rawInput = `${task.title} ${task.deadline}`.trim();
      await createTask({ rawInput });
      setTasks(prev => prev.map((t, i) => i === index ? { ...t, status: 'added' } : t));
      showToast("Task confirmed and created!", "success");
    } catch (err) {
      showToast("Failed to create task", "error");
    }
  };

  const handleIgnoreTask = (index) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, status: 'ignored' } : t));
  };

  const handleStartEdit = (index) => {
    setEditingTaskIndex(index);
    setEditTitle(tasks[index].title || "");
    setEditDeadline(tasks[index].deadline || "");
  };

  const handleSaveEdit = (index) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, title: editTitle, deadline: editDeadline } : t));
    setEditingTaskIndex(null);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full space-y-12">
      {/* Orb Section */}
      <div className="flex flex-col items-center gap-8 py-10">
        <div className="relative">
          <motion.button
            onClick={toggleRecording}
            animate={
              status === 'recording' ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } :
              status === 'processing' ? { rotate: 360 } :
              { scale: 1 }
            }
            transition={
              status === 'recording' ? { repeat: Infinity, duration: 2 } :
              status === 'processing' ? { repeat: Infinity, duration: 3, ease: "linear" } :
              {}
            }
            className={cn(
              "w-48 h-48 rounded-full flex items-center justify-center relative z-10 transition-all duration-700",
              status === 'idle' && "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 hover:scale-105",
              status === 'recording' && "bg-gradient-to-tr from-red-600 to-rose-600 shadow-2xl shadow-red-500/40",
              status === 'processing' && "bg-gradient-to-tr from-blue-500 to-cyan-500 shadow-xl shadow-blue-400/20",
              status === 'completed' && "bg-gradient-to-tr from-green-500 to-emerald-500 shadow-xl shadow-green-500/20"
            )}
          >
            <div className="relative z-20">
              {status === 'idle' && <Mic className="w-16 h-16 text-white" />}
              {status === 'recording' && (
                <div className="flex gap-2">
                  <motion.div animate={{ height: [20, 40, 20] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1.5 bg-white rounded-full" />
                  <motion.div animate={{ height: [30, 60, 30] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1.5 bg-white rounded-full" />
                  <motion.div animate={{ height: [20, 40, 20] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1.5 bg-white rounded-full" />
                </div>
              )}
              {status === 'processing' && <Sparkles className="w-16 h-16 text-white animate-pulse" />}
              {status === 'completed' && <CheckCircle2 className="w-16 h-16 text-white" />}
            </div>

            <AnimatePresence>
              {status === 'recording' && (
                <>
                  <motion.div 
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0.2 }}
                    exit={{ scale: 1, opacity: 0 }}
                    className="absolute inset-0 rounded-full bg-red-400 -z-10"
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-4 rounded-full border-4 border-red-500/20 -z-10"
                  />
                </>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="text-center space-y-2">
          <h2 className={cn(
            "text-lg font-black uppercase tracking-widest transition-colors duration-500",
            status === 'recording' ? "text-red-600" :
            status === 'processing' ? "text-blue-500" :
            status === 'completed' ? "text-green-600" :
            "text-gray-400 dark:text-gray-500"
          )}>
            {status === 'idle' && "Tap the orb to start recording"}
            {status === 'recording' && "Recording meeting..."}
            {status === 'processing' && "Analyzing conversation..."}
            {status === 'completed' && "Meeting Analysis Complete"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Zodo is ready to summarize your discussion.</p>
        </div>
      </div>

      {/* Results Section */}
      {(transcript || summary || status === 'recording' || status === 'processing') && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Transcript Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold">Transcript</h3>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 min-h-[300px] max-h-[500px] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {transcript}
                {!transcript && status === 'recording' && <span className="text-gray-400 italic">Recording in progress... Transcript will appear when you stop.</span>}
                {!transcript && status === 'processing' && <span className="text-blue-500 italic animate-pulse">Transcribing audio with Whisper model...</span>}
                {!transcript && status === 'idle' && <span className="text-gray-400">Waiting for audio...</span>}
              </p>
              {status === 'recording' && (
                <span className="inline-block w-1.5 h-4 bg-red-400 animate-pulse ml-1" />
              )}
            </div>
          </div>

          {/* AI Summary Column */}
          <AnimatePresence>
            {summary && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                  <Sparkles className="absolute top-4 right-4 text-blue-400 w-12 h-12 opacity-20" />
                  <h3 className="text-xl font-bold mb-6">AI Meeting Insight</h3>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-3 opacity-70">Key Points</h4>
                      <ul className="space-y-3">
                        {summary.keyPoints.map((p, i) => (
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
                        {summary.decisions.map((d, i) => (
                          <li key={i} className="flex gap-3 text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Items — Tasks Review Flow */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Action Items</h4>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900">
                      Review & Confirm
                    </span>
                  </div>
                  
                  <ul className="space-y-4">
                    {tasks.map((task, i) => {
                      const isAdded = task.status === 'added';
                      const isIgnored = task.status === 'ignored';
                      const isEditing = editingTaskIndex === i;

                      if (isIgnored) return null; // Hide ignored tasks entirely

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
                                    <Check className="w-3.5 h-3.5" /> Confirm
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

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                    <button
                      onClick={() => onSaveSuccess()}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Meeting Notes
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
