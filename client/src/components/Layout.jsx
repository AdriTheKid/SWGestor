import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'

export default function Layout(){
  const loc = useLocation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const title = useMemo(() => {
    if (loc.pathname.startsWith('/projects/')) return 'Proyecto'
    if (loc.pathname.startsWith('/projects')) return 'Proyectos'
    return 'Dashboard'
  }, [loc.pathname])

  function onSubmit(e){
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    navigate('/projects' + (params.toString() ? `?${params.toString()}` : ''))
  }

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">SW</div>
          <div>
            <h1>SW Gestor</h1>
            <p>Proyectos • Tareas • Equipo</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Dashboard</NavLink>
          <NavLink to="/projects" className={({isActive}) => isActive ? 'active' : ''}>Proyectos</NavLink>
        </nav>

        <div style={{marginTop: 'auto'}} className="helper">
          <div className="card" style={{padding:'12px', marginTop:'16px'}}>
            <h3 style={{marginBottom:'6px'}}>Tip</h3>
            <p>Para el video: crea un proyecto y agrega tareas con fecha límite y prioridad.</p>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h2>{title}</h2>
            <div className="helper">UX/UI orientado a claridad y acciones frecuentes.</div>
          </div>
          <form className="search" onSubmit={onSubmit} role="search" aria-label="Buscar">
            <span style={{opacity:.7}}>⌕</span>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar proyecto…" />
            <button className="primary" type="submit">Buscar</button>
          </form>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
