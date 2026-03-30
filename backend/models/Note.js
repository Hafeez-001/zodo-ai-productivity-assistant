import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Meeting Notes'
  },
  transcript: {
    type: String,
    required: true
  },
  summary: {
    keyPoints: [String],
    decisions: [String],
    actionItems: [String]
  },
  tasks: [{
    title: String,
    deadline: String,
    priority: String,
    status: { type: String, default: 'pending' }
  }]
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);
