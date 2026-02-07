require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { Task } = require('./models');
const { createTaskSchema, updateTaskSchema } = require('./validators');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(compression());

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swgestor_tasks';

function isValidObjectId(id){
  return mongoose.Types.ObjectId.isValid(id);
}

app.get('/health', (req,res)=>res.json({ ok:true, service:'tasks' }));

// list tasks by project
app.get('/projects/:projectId/tasks', async (req,res)=>{
  const { projectId } = req.params;
  if(!isValidObjectId(projectId)) return res.status(400).json({ message:'ID inválido' });
  const tasks = await Task.find({ projectId }).sort({ createdAt: -1 }).lean();
  res.json(tasks);
});

app.post('/projects/:projectId/tasks', async (req,res)=>{
  const { projectId } = req.params;
  if(!isValidObjectId(projectId)) return res.status(400).json({ message:'ID inválido' });
  try{
    const data = createTaskSchema.parse({ ...req.body, projectId });
    // normalize dueDate
    if (data.dueDate === undefined) delete data.dueDate;
    if (data.dueDate === null) data.dueDate = null;
    const task = await Task.create(data);
    res.status(201).json(task);
  }catch(e){
    res.status(400).json({ message:'Datos inválidos', error: e.message });
  }
});

app.put('/tasks/:taskId', async (req,res)=>{
  const { taskId } = req.params;
  if(!isValidObjectId(taskId)) return res.status(400).json({ message:'ID inválido' });
  try{
    const patch = updateTaskSchema.parse(req.body);
    const updated = await Task.findByIdAndUpdate(taskId, patch, { new:true, runValidators:true }).lean();
    if(!updated) return res.status(404).json({ message:'No encontrado' });
    res.json(updated);
  }catch(e){
    res.status(400).json({ message:'Datos inválidos', error: e.message });
  }
});

app.delete('/tasks/:taskId', async (req,res)=>{
  const { taskId } = req.params;
  if(!isValidObjectId(taskId)) return res.status(400).json({ message:'ID inválido' });
  const deleted = await Task.findByIdAndDelete(taskId).lean();
  if(!deleted) return res.status(404).json({ message:'No encontrado' });
  res.json({ ok:true });
});

app.get('/stats', async (req,res)=>{
  const projectId = req.query.projectId;
  const filter = projectId && isValidObjectId(projectId) ? { projectId } : {};
  const [tasks, todo, doing, done] = await Promise.all([
    Task.countDocuments(filter),
    Task.countDocuments({ ...filter, status:'todo' }),
    Task.countDocuments({ ...filter, status:'doing' }),
    Task.countDocuments({ ...filter, status:'done' })
  ]);
  res.json({ tasks, todo, doing, done, scope: projectId ? 'project' : 'all' });
});

async function start(){
  try{
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[tasks] MongoDB connected:', MONGODB_URI);
    app.listen(PORT, ()=>console.log(`[tasks] running on http://localhost:${PORT}`));
  }catch(e){
    console.error('[tasks] failed to start:', e.message);
    process.exit(1);
  }
}
start();

module.exports = app;
