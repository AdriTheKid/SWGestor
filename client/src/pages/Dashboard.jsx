import { useEffect, useMemo, useState } from 'react'
import { api, healthCheck } from '../api'
import { Link } from 'react-router-dom'

export default function Dashboard(){
  const [stats, setStats] = useState({ projects: 0, tasks: 0, todo: 0, doing: 0, done: 0 })
  const [status, setStatus] = useState('cargando…')

  useEffect(() => {
    let mounted = true
    async function run(){
      try{
        await healthCheck()
        const { data } = await api.get('/api/stats')
        if (!mounted) return
        setStats(data)
        setStatus('ok')
      }catch(e){
        if (!mounted) return
        setStatus('No se pudo conectar con la API. Verifica que el backend esté en http://localhost:3000')
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const kpis = useMemo(() => ([
    { label:'Proyectos', value: stats.projects },
    { label:'Tareas totales', value: stats.tasks },
    { label:'To Do', value: stats.todo },
    { label:'Doing', value: stats.doing },
    { label:'Done', value: stats.done },
  ]), [stats])

  return (
    <div className="grid">
      <div className="card half">
        <h3>Resumen</h3>
        <p>Indicadores básicos: volumen de trabajo y progreso por estados.</p>
        <div style={{display:'grid', gap:'10px', marginTop:'12px'}}>
          {kpis.map(k => (
            <div key={k.label} className="kpi">
              <span style={{color:'var(--muted)'}}>{k.label}</span>
              <strong>{k.value}</strong>
            </div>
          ))}
        </div>
        <div className="btnRow" style={{marginTop:'12px'}}>
          <Link className="btn primary" to="/projects">Ir a Proyectos</Link>
        </div>
      </div>

      <div className="card half">
        <h3>Estado del sistema</h3>
        <p>{status === 'ok' ? 'API conectada correctamente.' : status}</p>
        <p className="helper">UX: mensajes claros y con acción (“qué revisar”).</p>
      </div>

      <div className="card">
        <h3>Qué grabar en tu video</h3>
        <ul style={{marginTop:'10px', color:'var(--muted)'}}>
          <li>Crear proyecto</li>
          <li>Agregar tareas con título, fecha límite, prioridad y estado</li>
          <li>Editar y cambiar estado (To Do → Doing → Done)</li>
          <li>Filtrar y ordenar por fecha</li>
        </ul>
      </div>
    </div>
  )
}
