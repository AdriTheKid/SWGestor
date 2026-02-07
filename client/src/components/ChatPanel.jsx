import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { getSocket } from '../socket'

export default function ChatPanel({ room, defaultUser='Leonel' }){
  const [user, setUser] = useState(defaultUser)
  const [text, setText] = useState('')
  const [msgs, setMsgs] = useState([])

  const socket = useMemo(() => getSocket(), [])

  async function loadHistory(){
    try{
      const { data } = await api.get(`/api/chat/${encodeURIComponent(room)}?limit=30`)
      setMsgs(data)
    }catch{
      setMsgs([])
    }
  }

  useEffect(() => { loadHistory() }, [room])

  useEffect(() => {
    socket.emit('join', { room })

    const onNew = (msg) => setMsgs(prev => [...prev, msg].slice(-200))
    socket.on('chat:new', onNew)

    return () => {
      socket.off('chat:new', onNew)
      socket.emit('leave', { room })
    }
  }, [socket, room])

  function send(e){
    e.preventDefault()
    if (!text.trim()) return

    const payload = { room, user: user.trim() || 'Anon', message: text.trim() }
    socket.emit('chat:send', payload, (ack) => {
      if (ack?.ok){
        setText('')
      }else{
        alert('No se pudo enviar: ' + (ack?.error || 'error'))
      }
    })
  }

  return (
    <div className="card" style={{marginTop:'14px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap'}}>
        <div>
          <h3>Chat del proyecto</h3>
          <p className="helper">Room: <code>{room}</code></p>
        </div>
        <div className="field" style={{minWidth:220}}>
          <label>Tu nombre</label>
          <input value={user} onChange={(e)=>setUser(e.target.value)} />
        </div>
      </div>

      <div className="chatBox" role="log" aria-label="Mensajes del proyecto">
        {msgs.map((m, idx) => (
          <div key={m._id || m.id || idx} className="chatMsg">
            <div className="chatMeta">
              <strong>{m.user}</strong>
              <span className="helper">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'}) : ''}</span>
            </div>
            <div>{m.message}</div>
          </div>
        ))}
        {!msgs.length ? <div className="helper">Aún no hay mensajes en este proyecto.</div> : null}
      </div>

      <form onSubmit={send} className="chatForm">
        <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Escribe un mensaje…" />
        <button className="primary" type="submit">Enviar</button>
      </form>
    </div>
  )
}
