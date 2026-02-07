const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 80, index: true },
  description: { type: String, maxlength: 240 }
}, { timestamps: true });

const Project = mongoose.model('Project', ProjectSchema);

module.exports = { Project };
