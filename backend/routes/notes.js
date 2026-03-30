import express from 'express';
import multer from 'multer';
import path from 'path';
import { createNote, getNotes, deleteNote, batchCreateTasksFromMeeting, transcribeAudio, getNoteById } from '../controllers/noteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `audio-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.post('/', authMiddleware, createNote);
router.get('/', authMiddleware, getNotes);
router.get('/:id', authMiddleware, getNoteById);
router.delete('/:id', authMiddleware, deleteNote);
router.post('/extract-tasks', authMiddleware, batchCreateTasksFromMeeting);
router.post('/transcribe', authMiddleware, upload.single('audio'), transcribeAudio);

export default router;

