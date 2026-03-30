import Note from '../models/Note.js';
import Task from '../models/Task.js';
import { summarizeMeeting, extractTasksFromMeeting, generateMeetingInsights } from '../services/geminiService.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createNote = async (req, res) => {
  try {
    const { transcript, title } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    // Generate comprehensive insights using Gemini 2.5 Flash
    const insights = await generateMeetingInsights(transcript);

    const note = new Note({
      userId: req.user.id,
      title: title || 'Meeting Notes',
      transcript,
      summary: insights.summary,
      tasks: insights.tasks
    });

    await note.save();
    
    // Return structured payload required by frontend
    res.status(201).json({
      _id: note._id, // Add ID for saving successfully
      transcript,
      summary: insights.summary,
      tasks: insights.tasks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const batchCreateTasksFromMeeting = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const tasksData = await extractTasksFromMeeting(transcript);
    
    // Map extracted tasks to Task model format
    const tasksToCreate = tasksData.map(t => ({
      userId: req.user.id,
      title: t.task,
      deadline: t.deadline === "Soon" ? null : new Date(t.deadline), // Simple mapping, could be improved
      status: 'pending',
      priority: 'medium'
    }));

    const savedTasks = await Task.insertMany(tasksToCreate);
    res.status(201).json({ 
      message: `${savedTasks.length} tasks created from meeting`,
      tasks: savedTasks 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const audioPath = req.file.path;
    const scriptPath = path.join(__dirname, '../scripts/transcribe.py');
    
    // Use virtual environment python
    const pythonExecutable = os.platform() === 'win32' 
      ? path.join(__dirname, '../venv/Scripts/python.exe')
      : path.join(__dirname, '../venv/bin/python');

    // Spawn Python process
    const pythonProcess = spawn(pythonExecutable, [scriptPath, audioPath]);

    let transcript = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      transcript += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      // Clean up uploaded file
      fs.unlinkSync(audioPath);

      if (code !== 0) {
        console.error("Whisper Error:", errorOutput);
        return res.status(500).json({ error: "Transcription failed", details: errorOutput });
      }

      res.json({ transcript: transcript.trim() });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

