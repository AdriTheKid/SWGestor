require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { Project } = require('./models');
const { createProjectSchema } = require('./validators');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(compression());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swgestor_projects';

function isValidObjectId(id){
  return mongoose.Types.ObjectId.isValid(id);
}

app.get('/health', (req,res)=>res.json({ ok:true, service:'projects' }));

app.get('/projects', async (req,res)=>{
  const projects = await Project.find().sort({ createdAt: -1 }).lean();
  res.json(projects);
});

app.post('/projects', async (req,res)=>{
  try{
    const data = createProjectSchema.parse(req.body);
    const project = await Project.create(data);
    res.status(201).json(project);
  }catch(e){
    res.status(400).json({ message:'Datos inválidos', error: e.message });
  }
});

app.get('/projects/:id', async (req,res)=>{
  const { id } = req.params;
  if(!isValidObjectId(id)) return res.status(400).json({ message:'ID inválido' });
  const project = await Project.findById(id).lean();
  if(!project) return res.status(404).json({ message:'No encontrado' });
  res.json(project);
});

async function start(){
  try{
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[projects] MongoDB connected:', MONGODB_URI);
    app.listen(PORT, ()=>console.log(`[projects] running on http://localhost:${PORT}`));
  }catch(e){
    console.error('[projects] failed to start:', e.message);
    process.exit(1);
  }
}
start();

module.exports = app; // for tests
