import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, CheckCircle2, ListTodo, Save, FileText, Plus, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { createNote, createTask } from '../services/api';

export default function MeetingMode({ onSaveSuccess }) {
  const [status, setStatus] = useState('idle'); // idle, recording, processing, completed
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [addedItems, setAddedItems] = useState(new Set());
  const [creatingTaskFor, setCreatingTaskFor] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';
      recog.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };
      recog.onerror = (err) => {
        console.error("Speech Recognition Error:", err);
        showToast("Recording error occurred", "error");
        setStatus('idle');
      };
      setRecognition(recog);
    }
  }, []);

  const toggleRecording = () => {
    if (status === 'idle') {
      setTranscript('');
      setSummary(null);
      setAddedItems(new Set());
      recognition?.start();
      setStatus('recording');
    } else if (status === 'recording') {
      recognition?.stop();
      if (!transcript.trim()) {
        showToast("No speech detected", "info");
        setStatus('idle');
        return;
      }
      processMeeting(transcript);
    }
  };

  const processMeeting = async (text) => {
    setStatus('processing');
    try {
      const data = await createNote(text, 'Meeting Notes');
      setSummary(data.summary);
      setStatus('completed');
      showToast("Meeting summarized!", "success");
    } catch (error) {
      showToast("Failed to summarize", "error");
      setStatus('idle');
    }
  };

  /**
   * Note-to-Task: clicking an action item creates a task automatically.
   */
  const handleAddActionItemAsTask = async (item, index) => {
    if (addedItems.has(index) || creatingTaskFor === index) return;
    setCreatingTaskFor(index);
    try {
      await createTask({ rawInput: item });
      setAddedItems(prev => new Set([...prev, index]));
      showToast(`Task created: "${item.slice(0, 40)}..."`, "success");
    } catch (err) {
      showToast("Failed to create task", "error");
    } finally {
      setCreatingTaskFor(null);
    }
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
      {(transcript || summary) && (
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
                {transcript || "Waiting for audio..."}
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

                {/* Action Items — Clickable to create task */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Action Items</h4>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900">
                      Click → Add to Tasks
                    </span>
                  </div>
                  
                  <ul className="space-y-3">
                    {summary.actionItems.map((item, i) => {
                      const isAdded = addedItems.has(i);
                      const isCreating = creatingTaskFor === i;
                      return (
                        <li key={i} className="group">
                          <button
                            onClick={() => handleAddActionItemAsTask(item, i)}
                            disabled={isAdded || isCreating}
                            className={cn(
                              "w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all border",
                              isAdded
                                ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900 cursor-default"
                                : isCreating
                                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 cursor-wait"
                                  : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                              isAdded ? "bg-green-500 border-green-500" : isCreating ? "bg-blue-500 border-blue-500 animate-pulse" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 group-hover:border-blue-500"
                            )}>
                              {isAdded ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : (
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 group-hover:text-blue-500">{i + 1}</span>
                              )}
                            </div>
                            <p className={cn(
                              "text-sm font-medium flex-1",
                              isAdded ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"
                            )}>
                              {item}
                            </p>
                            {!isAdded && !isCreating && (
                              <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                <Plus className="w-3 h-3" /> Task
                              </span>
                            )}
                            {isAdded && (
                              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3" /> Added
                              </span>
                            )}
                          </button>
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
