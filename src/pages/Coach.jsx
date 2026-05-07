import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getCoachResponse, COACH_SUGGESTIONS } from '../lib/coachEngine'

const T = {
  bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222',
  orange:'#FF5500', orangeDim:'#FF550022', muted:'#666', text:'#F0F0F0', green:'#00E57A', blue:'#0099FF'
}

function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:8, marginBottom:4 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#FF5500,#FF8800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🤖</div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:'18px 18px 18px 4px', padding:'12px 16px' }}>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:T.muted, animation:`bounce 1.2s infinite ${i*0.2}s` }}/>
          ))}
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:8 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#FF5500,#FF8800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, marginRight:8, flexShrink:0, alignSelf:'flex-end' }}>🤖</div>
      )}
      <div style={{ maxWidth:'80%' }}>
        {!isUser && msg.title && (
          <div style={{ fontSize:12, fontWeight:700, color:T.orange, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.05em', marginBottom:4, paddingLeft:4 }}>{msg.title}</div>
        )}
        <div style={{
          padding:'12px 14px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? T.orange : T.card,
          border: isUser ? 'none' : `1px solid ${T.border}`,
          fontSize: 14, lineHeight: 1.6,
          color: isUser ? '#fff' : T.text,
          whiteSpace: 'pre-line',
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  )
}

export default function Coach() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      title: null,
      content: `¡Hola${profile?.name ? ' ' + profile.name : ''}! 👋 Soy tu coach de HalfPace.\n\nPuedo ayudarte con lesiones, nutrición, ritmos, ajustes al plan, estrategia de carrera y motivación.\n\n¿Qué necesitas hoy?`
    }
  ])
  const [input,   setInput]   = useState('')
  const [typing,  setTyping]  = useState(false)
  const [showAll, setShowAll] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  function send(text) {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role:'user', content:msg }])
    setTyping(true)

    // Simulate slight delay for natural feel
    setTimeout(() => {
      const response = getCoachResponse(msg, profile)
      setMessages(prev => [...prev, {
        role:    'assistant',
        title:   response.title,
        content: response.body,
      }])
      setTyping(false)
    }, 600 + Math.random() * 400)
  }

  const showSuggestions = messages.length <= 1
  const suggestions = showAll ? COACH_SUGGESTIONS : COACH_SUGGESTIONS.slice(0, 4)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 160px)' }}>

      {/* Header */}
      <div style={{ marginBottom:14, flexShrink:0 }}>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em', marginBottom:6 }}>TU ENTRENADOR</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#FF5500,#FF8800)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🤖</div>
          <div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Coach HalfPace</div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:T.green }}/>
              <span style={{ fontSize:11, color:T.green, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600 }}>Disponible 24/7 · Sin coste</span>
            </div>
          </div>
        </div>
      </div>

      {/* Topics chips */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12, flexShrink:0 }}>
        {[['🩹','Lesiones'],['🥗','Nutrición'],['⚡','Ritmos'],['📅','Plan'],['🏁','Carrera'],['💪','Motivación']].map(([icon,lbl])=>(
          <button key={lbl} onClick={()=>send(lbl.toLowerCase())} style={{
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:20,
            padding:'5px 11px', color:T.muted, fontSize:12,
            fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:4,
          }}><span>{icon}</span>{lbl}</button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {messages.map((m,i) => <Message key={i} msg={m}/>)}
        {typing && <TypingIndicator/>}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div style={{ flexShrink:0, marginBottom:10 }}>
          <div style={{ fontSize:10, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:6 }}>PREGUNTAS FRECUENTES</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {suggestions.map(s => (
              <button key={s} onClick={()=>send(s)} style={{
                background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
                padding:'9px 13px', color:T.text, textAlign:'left', fontSize:13, cursor:'pointer',
              }}>{s}</button>
            ))}
            {!showAll && (
              <button onClick={()=>setShowAll(true)} style={{ background:'none', border:'none', color:T.orange, fontSize:12, cursor:'pointer', textAlign:'left', padding:'4px 0', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>
                Ver más preguntas ↓
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ display:'flex', gap:8, paddingTop:8, borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') send() }}
          placeholder="Escribe tu pregunta..."
          style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'12px 16px', color:T.text, fontSize:14 }}
        />
        <button onClick={()=>send()} disabled={!input.trim()} style={{
          width:46, height:46, borderRadius:14, flexShrink:0,
          background: input.trim() ? T.orange : T.surface,
          border:`1px solid ${input.trim() ? T.orange : T.border}`,
          color:'#fff', fontSize:18, cursor:input.trim()?'pointer':'default', transition:'all 0.2s',
        }}>↑</button>
      </div>

      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  )
}
