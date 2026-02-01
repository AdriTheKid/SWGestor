const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swgestor'

/**
 * MODELOS
 */
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 80 },
  description: { type: String, maxlength: 240 }
}, { timestamps: true })

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, maxlength: 120 },
  description: { type: String, maxlength: 600 },
  status: { type: String, enum: ['todo','doing','done'], default: 'todo', index: true },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium', index: true },
  dueDate: { type: Date, default: null },
  assignee: { type: String, default: '' }
}, { timestamps: true })

const Project = mongoose.model('Project', ProjectSchema)
const Task = mongoose.model('Task', TaskSchema)

function isValidObjectId(id){
  return mongoose.Types.ObjectId.isValid(id)
}

/**
 * RUTAS
 */
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/stats', async (req, res) => {
  const [projects, tasks, todo, doing, done] = await Promise.all([
    Project.countDocuments(),
    Task.countDocuments(),
    Task.countDocuments({ status: 'todo' }),
    Task.countDocuments({ status: 'doing' }),
    Task.countDocuments({ status: 'done' })
  ])
  res.json({ projects, tasks, todo, doing, done })
})

/**
 * PROJECTS
 */
app.get('/api/projects', async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 })
  res.json(projects)
})

app.post('/api/projects', async (req, res) => {
  try{
    const project = new Project({ name: req.body.name, description: req.body.description })
    await project.save()
    res.status(201).json(project)
  }catch(e){
    res.status(400).json({ message: 'Datos inválidos', error: e.message })
  }
})

app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) return res.status(400).json({ message:'ID inválido' })
  const project = await Project.findById(id)
  if (!project) return res.status(404).json({ message:'No encontrado' })
  res.json(project)
})

/**
 * TASKS por proyecto
 */
app.get('/api/projects/:id/tasks', async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) return res.status(400).json({ message:'ID inválido' })
  const tasks = await Task.find({ projectId: id }).sort({ createdAt: -1 })
  res.json(tasks)
})

app.post('/api/projects/:id/tasks', async (req, res) => {
  const { id } = req.params
  if (!isValidObjectId(id)) return res.status(400).json({ message:'ID inválido' })
  try{
    const task = new Task({
      projectId: id,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      dueDate: req.body.dueDate || null,
      assignee: req.body.assignee || ''
    })
    await task.save()
    res.status(201).json(task)
  }catch(e){
    res.status(400).json({ message: 'Datos inválidos', error: e.message })
  }
})

/**
 * TASKS global
 */
app.put('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params
  if (!isValidObjectId(taskId)) return res.status(400).json({ message:'ID inválido' })
  try{
    const allowed = ['title','description','status','priority','dueDate','assignee']
    const patch = {}
    for (const k of allowed){
      if (k in req.body) patch[k] = req.body[k]
    }
    const updated = await Task.findByIdAndUpdate(taskId, patch, { new: true, runValidators: true })
    if (!updated) return res.status(404).json({ message:'No encontrado' })
    res.json(updated)
  }catch(e){
    res.status(400).json({ message: 'Datos inválidos', error: e.message })
  }
})

app.delete('/api/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params
  if (!isValidObjectId(taskId)) return res.status(400).json({ message:'ID inválido' })
  const deleted = await Task.findByIdAndDelete(taskId)
  if (!deleted) return res.status(404).json({ message:'No encontrado' })
  res.json({ ok: true })
})

async function start(){
  try{
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB connected:', MONGODB_URI)
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  }catch(e){
    console.error('Failed to start server:', e.message)
    process.exit(1)
  }
}
start()
