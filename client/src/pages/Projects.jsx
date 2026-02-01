import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import { Link, useSearchParams } from 'react-router-dom'

function validateProject(values){
  const errs = {}
  if (!values.name?.trim()) errs.name = 'El nombre del proyecto es obligatorio.'
  if (values.name?.trim()?.length > 80) errs.name = 'Máximo 80 caracteres.'
  if (values.description?.length > 240) errs.description = 'Máximo 240 caracteres.'
  return errs
}

export default function Projects(){
  const [searchParams] = useSearchParams()
  const q = (searchParams.get('q') || '').toLowerCase()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name:'', description:'' })
  const [errs, setErrs] = useState({})
  const [saving, setSaving] = useState(false)

  async function load(){
    setLoading(true)
    try{
      const { data } = await api.get('/api/projects')
      setItems(data)
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!q) return items
    return items.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  }, [items, q])

  async function createProject(e){
    e.preventDefault()
    const v = validateProject(form)
    setErrs(v)
    if (Object.keys(v).length) return
    setSaving(true)
    try{
      await api.post('/api/projects', form)
      setOpen(false)
      setForm({name:'', description:''})
      await load()
    }catch(err){
      setErrs({ form:'No se pudo crear el proyecto. Revisa el backend.' })
    }finally{
      setSaving(false)
    }
  }

  return (
    <div className="grid">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
          <div>
            <h3>Proyectos</h3>
            <p>Abre un proyecto para gestionar tareas con fechas, prioridad y estado.</p>
          </div>
          <div className="btnRow">
            <button className="primary" onClick={()=>setOpen(true)}>+ Nuevo proyecto</button>
            <button onClick={load} disabled={loading}>{loading ? 'Cargando…' : 'Recargar'}</button>
          </div>
        </div>

        {loading ? (
          <p style={{marginTop:'10px'}}>Cargando proyectos…</p>
        ) : (
          <table className="table" aria-label="Tabla de proyectos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style={{width:160}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{color:'var(--muted)'}}>{p.description || '—'}</td>
                  <td>
                    <Link className="btn primary" to={`/projects/${p._id}`}>Abrir</Link>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="3" style={{color:'var(--muted)'}}>Sin resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title="Nuevo proyecto" onClose={()=>!saving && setOpen(false)}>
          <form onSubmit={createProject}>
            <div className="formGrid">
              <div className="field">
                <label>Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e)=>setForm(f=>({...f, name:e.target.value}))}
                  placeholder="Ej. Sistema de control de tareas"
                />
                {errs.name && <div className="error">{errs.name}</div>}
              </div>

              <div className="field">
                <label>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e)=>setForm(f=>({...f, description:e.target.value}))}
                  placeholder="Breve descripción del objetivo del proyecto…"
                />
                {errs.description && <div className="error">{errs.description}</div>}
              </div>

              {errs.form && <div className="error">{errs.form}</div>}

              <div className="btnRow" style={{justifyContent:'flex-end', width:'100%'}}>
                <button type="button" onClick={()=>setOpen(false)} disabled={saving}>Cancelar</button>
                <button className="primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Crear'}</button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
