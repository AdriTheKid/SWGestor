import { useEffect } from 'react'

export default function Toasts({ toasts, onRemove }){
  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => onRemove(t.id), t.ttl || 4000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, onRemove])

  return (
    <div className="toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <div style={{display:'flex', justifyContent:'space-between', gap:'10px'}}>
            <strong>{t.title}</strong>
            <button className="toastClose" onClick={()=>onRemove(t.id)} aria-label="Cerrar">×</button>
          </div>
          {t.body ? <div className="helper" style={{marginTop:'4px'}}>{t.body}</div> : null}
        </div>
      ))}
    </div>
  )
}
