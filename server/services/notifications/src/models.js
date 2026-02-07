const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true }, // e.g. project:<id> or global
  user: { type: String, required: true, maxlength: 80 },
  message: { type: String, required: true, maxlength: 1000 }
}, { timestamps: true });

ChatMessageSchema.index({ room: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

module.exports = { ChatMessage };
