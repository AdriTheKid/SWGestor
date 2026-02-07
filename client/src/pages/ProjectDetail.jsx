import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import ChatPanel from '../components/ChatPanel'

const STATUS = ['todo','doing','done']
const PRIORITY = ['low','medium','high']

function fmtDate(d){
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'2-digit' })
}

function validateTask(values){
  const errs = {}
  if (!values.title?.trim()) errs.title = 'El título es obligatorio.'
  if (values.title?.trim()?.length > 120) errs.title = 'Máximo 120 caracteres.'
  if (values.description?.length > 600) errs.description = 'Máximo 600 caracteres.'
  if (values.dueDate){
    const dt = new Date(values.dueDate)
    if (isNaN(dt.getTime())) errs.dueDate = 'Fecha inválida.'
  }
  if (values.status && !STATUS.includes(values.status)) errs.status = 'Estado inválido.'
  if (values.priority && !PRIORITY.includes(values.priority)) errs.priority = 'Prioridad inválida.'
  return errs
}


async function pushNotify(room, type, title, body=''){
  try{
    await api.post('/api/notify', { room, type, title, body })
  }catch{
    // ignore
  }
}

export default function ProjectDetail(){
  const { id } = useParams()
  const nav = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title:'', description:'', status:'todo', priority:'medium', dueDate:'', assignee:''
  })
  const [errs, setErrs] = useState({})
  const [saving, setSaving] = useState(false)

  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('dueAsc')

  async function load(){
    setLoading(true)
    try{
      const [pRes, tRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/tasks`)
      ])
      setProject(pRes.data)
      setTasks(tRes.data)
    }catch(e){
      setProject(null)
      setTasks([])
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const filtered = useMemo(() => {
    let arr = [...tasks]
    if (filterStatus !== 'all') arr = arr.filter(t => t.status === filterStatus)
    if (sortBy === 'dueAsc') arr.sort((a,b)=> (new Date(a.dueDate||'9999-12-31')) - (new Date(b.dueDate||'9999-12-31')))
    if (sortBy === 'dueDesc') arr.sort((a,b)=> (new Date(b.dueDate||'0000-01-01')) - (new Date(a.dueDate||'0000-01-01')))
    if (sortBy === 'priority') {
      const rank = { high:0, medium:1, low:2 }
      arr.sort((a,b)=> (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9))
    }
    return arr
  }, [tasks, filterStatus, sortBy])

  function openCreate(){
    setEditing(null)
    setForm({ title:'', description:'', status:'todo', priority:'medium', dueDate:'', assignee:'' })
    setErrs({})
    setOpen(true)
  }

  function openEdit(task){
    setEditing(task)
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : '',
      assignee: task.assignee || ''
    })
    setErrs({})
    setOpen(true)
  }

  async function saveTask(e){
    e.preventDefault()
    const v = validateTask(form)
    setErrs(v)
    if (Object.keys(v).length) return
    setSaving(true)
    try{
      const payload = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
      }
      if (editing?._id){
        await api.put(`/api/tasks/${editing._id}`, payload)
      }else{
        await api.post(`/api/projects/${id}/tasks`, payload)
      }
      setOpen(false)
      await load()
      await pushNotify(`project:${id}`,'success','Tarea guardada', payload.title)
      await pushNotify('global','info','Actualización','Se guardó una tarea')
    }catch(err){
      setErrs({ form:'No se pudo guardar. Revisa el backend y MongoDB.' })
    }finally{
      setSaving(false)
    }
  }

  async function removeTask(taskId){
    if (!confirm('¿Eliminar esta tarea?')) return
    try{
      await api.delete(`/api/tasks/${taskId}`)
      await load()
      await pushNotify(`project:${id}`,'warning','Tarea eliminada', `ID: ${taskId}`)
      await pushNotify('global','warning','Eliminación','Se eliminó una tarea')
    }catch(e){
      alert('No se pudo eliminar.')
    }
  }

  async function quickStatus(task, next){
    try{
      await api.put(`/api/tasks/${task._id}`, { status: next })
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: next } : t))
      await pushNotify(`project:${id}`,'info','Cambio de estado', `${task.title} → ${next.toUpperCase()}`)
    }catch(e){
      alert('No se pudo actualizar el estado.')
    }
  }

  if (loading){
    return (
      <div className="grid">
        <div className="card"><p>Cargando…</p></div>
      </div>
    )
  }

  if (!project){
    return (
      <div className="grid">
        <div className="card">
          <h3>No se encontró el proyecto</h3>
          <p>Verifica que exista y que el backend esté levantado.</p>
          <div className="btnRow">
            <button onClick={()=>nav('/projects')}>Volver</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
          <div>
            <h3>{project.name}</h3>
            <p>{project.description || 'Sin descripción.'}</p>
          </div>
          <div className="btnRow">
            <button className="primary" onClick={openCreate}>+ Nueva tarea</button>
            <button onClick={()=>nav('/projects')}>Volver</button>
          </div>
        </div>

        <div style={{display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'12px'}}>
          <div className="field third" style={{minWidth:220}}>
            <label>Filtrar por estado</label>
            <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
              <option value="all">Todos</option>
              <option value="todo">To Do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="field third" style={{minWidth:220}}>
            <label>Ordenar</label>
            <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
              <option value="dueAsc">Fecha (más próxima)</option>
              <option value="dueDesc">Fecha (más lejana)</option>
              <option value="priority">Prioridad</option>
            </select>
          </div>
        </div>

        <table className="table" aria-label="Tabla de tareas">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Fecha límite</th>
              <th>Responsable</th>
              <th style={{width:260}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t._id}>
                <td>
                  <strong>{t.title}</strong>
                  {t.description ? <div className="helper">{t.description}</div> : null}
                </td>
                <td><span className={`badge ${t.status}`}>{t.status.toUpperCase()}</span></td>
                <td><span className={`badge ${t.priority}`}>{t.priority.toUpperCase()}</span></td>
                <td>{fmtDate(t.dueDate)}</td>
                <td style={{color:'var(--muted)'}}>{t.assignee || '—'}</td>
                <td>
                  <div className="btnRow">
                    <button className="primary" onClick={()=>openEdit(t)}>Editar</button>
                    {t.status !== 'todo' && <button onClick={()=>quickStatus(t,'todo')}>ToDo</button>}
                    {t.status !== 'doing' && <button onClick={()=>quickStatus(t,'doing')}>Doing</button>}
                    {t.status !== 'done' && <button className="success" onClick={()=>quickStatus(t,'done')}>Done</button>}
                    <button className="danger" onClick={()=>removeTask(t._id)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan="6" style={{color:'var(--muted)'}}>No hay tareas aún. Crea la primera con “Nueva tarea”.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ChatPanel room={`project:${id}`} defaultUser="Leonel" />

      {open && (
        <Modal title={editing?._id ? 'Editar tarea' : 'Nueva tarea'} onClose={()=>!saving && setOpen(false)}>
          <form onSubmit={saveTask}>
            <div className="formGrid">
              <div className="field">
                <label>Título *</label>
                <input value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ej. Implementar login" />
                {errs.title && <div className="error">{errs.title}</div>}
              </div>

              <div className="field">
                <label>Descripción</label>
                <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} placeholder="Detalle breve de la tarea…" />
                {errs.description && <div className="error">{errs.description}</div>}
              </div>

              <div className="field third">
                <label>Estado</label>
                <select value={form.status} onChange={(e)=>setForm(f=>({...f,status:e.target.value}))}>
                  <option value="todo">To Do</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
                {errs.status && <div className="error">{errs.status}</div>}
              </div>

              <div className="field third">
                <label>Prioridad</label>
                <select value={form.priority} onChange={(e)=>setForm(f=>({...f,priority:e.target.value}))}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
                {errs.priority && <div className="error">{errs.priority}</div>}
              </div>

              <div className="field third">
                <label>Fecha límite</label>
                <input type="date" value={form.dueDate} onChange={(e)=>setForm(f=>({...f,dueDate:e.target.value}))} />
                {errs.dueDate && <div className="error">{errs.dueDate}</div>}
                <div className="helper">Opcional. Útil para ordenar y priorizar.</div>
              </div>

              <div className="field half">
                <label>Responsable</label>
                <input value={form.assignee} onChange={(e)=>setForm(f=>({...f,assignee:e.target.value}))} placeholder="Ej. Leonel / Equipo Backend" />
              </div>

              {errs.form && <div className="error">{errs.form}</div>}

              <div className="btnRow" style={{justifyContent:'flex-end', width:'100%'}}>
                <button type="button" onClick={()=>setOpen(false)} disabled={saving}>Cancelar</button>
                <button className="primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
