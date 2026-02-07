const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, maxlength: 600 },
  status: { type: String, enum: ['todo','doing','done'], default: 'todo', index: true },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium', index: true },
  dueDate: { type: Date, default: null },
  assignee: { type: String, default: '' }
}, { timestamps: true });

TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, priority: 1 });

const Task = mongoose.model('Task', TaskSchema);

module.exports = { Task };
