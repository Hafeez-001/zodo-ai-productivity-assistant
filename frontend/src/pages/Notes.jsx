import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/ui';
import { FileText, Mic, History, Trash2, Calendar, Clock } from 'lucide-react';
import MeetingMode from '../components/MeetingMode';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { getNotes, removeNote } from '../services/api';

export default function Notes() {
  const [view, setView] = useState('meeting'); // 'meeting' or 'history'
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
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
              <Card key={note._id} className="p-6 space-y-4 group transition-all hover:shadow-lg border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{note.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(note.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(note._id)}
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
