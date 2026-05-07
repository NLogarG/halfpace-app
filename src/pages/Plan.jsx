import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const T = { bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222', orange:'#FF5500', orangeMid:'#FF550055', muted:'#666', text:'#F0F0F0', green:'#00E57A', blue:'#0099FF' }

const SESSION_TYPES = {
  rest:     { label:'Descanso',     color:'#444', dot:'#444', emoji:'—' },
  easy:     { label:'Rodaje suave', color:T.green,  dot:T.green,  emoji:'🟢' },
  medium:   { label:'Rodaje medio', color:T.blue,   dot:T.blue,   emoji:'🔵' },
  long:     { label:'Tirada larga', color:T.orange, dot:T.orange, emoji:'🔴' },
  interval: { label:'Intervalos',   color:'#FFB800',dot:'#FFB800',emoji:'🟡' },
  tempo:    { label:'Tempo',        color:'#CC44FF',dot:'#CC44FF',emoji:'🟣' },
  race:     { label:'¡CARRERA!',    color:T.orange, dot:T.orange, emoji:'🏁' },
}
const DAYS_ES = ['L','M','X','J','V','S','D']

function generateICS(plan, startDate) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HalfPace//ES','X-WR-CALNAME:HalfPace Entrenos']
  plan.filter(s => s.type !== 'rest').forEach(s => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + (s.week - 1) * 7 + s.day_of_week)
    const p = n => String(n).padStart(2,'0')
    const ds = `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T070000`
    const de = `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T083000`
    const t = SESSION_TYPES[s.type] || SESSION_TYPES.easy
    lines.push('BEGIN:VEVENT', `UID:hp-${ds}@halfpace`, `DTSTART:${ds}`, `DTEND:${de}`,
      `SUMMARY:${t.emoji} ${t.label}${s.km ? ` — ${s.km}km` : ''}`,
      `DESCRIPTION:Semana ${s.week}${s.notes ? '\\n' + s.notes : ''}`, 'END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export default function Plan() {
  const { profile } = useAuth()
  const [plan,          setPlan]          = useState([])
  const [sessions,      setSessions]      = useState([]) // completed
  const [loading,       setLoading]       = useState(true)
  const [view,          setView]          = useState('calendar')
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [selectedDate,  setSelectedDate]  = useState(new Date())
  const [calExported,   setCalExported]   = useState(false)
  const [showCalModal,  setShowCalModal]  = useState(false)

  useEffect(() => { if (profile?.id) fetchData() }, [profile])

  async function fetchData() {
    const [{ data: planData }, { data: sessionData }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', profile.id).order('week').order('day_of_week'),
      supabase.from('sessions').select('date, type, km').eq('user_id', profile.id),
    ])
    setPlan(planData || [])
    setSessions(sessionData || [])
    setLoading(false)
  }

  // Build a date → plan session map
  const planStart = profile?.race_date
    ? new Date(new Date(profile.race_date).getTime() - 84*24*3600*1000)
    : new Date()

  function planSessionForDate(date) {
    const diff = Math.floor((date - planStart) / (24*3600*1000))
    if (diff < 0 || diff >= 84) return null
    const week = Math.floor(diff / 7) + 1
    const dow  = diff % 7
    return plan.find(p => p.week === week && p.day_of_week === dow) || null
  }

  function isCompleted(date) {
    const ds = date.toISOString().split('T')[0]
    return sessions.some(s => s.date === ds)
  }

  // Calendar grid
  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const startOffset = (firstDay + 6) % 7
  const totalCells  = Math.ceil((startOffset + daysInMonth) / 7) * 7
  const monthName   = currentMonth.toLocaleDateString('es-ES', { month:'long', year:'numeric' })

  const today          = new Date()
  const selectedSession = planSessionForDate(selectedDate)

  // Week view
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekDays = Array.from({ length:7 }, (_, i) => {
    const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i)
    return { date:d, session:planSessionForDate(d), done:isCompleted(d) }
  })

  function exportICS() {
    const blob = new Blob([generateICS(plan, planStart)], { type:'text/calendar' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href=url; a.download='halfpace.ics'; a.click()
    URL.revokeObjectURL(url)
    setCalExported(true); setShowCalModal(false)
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${T.orange}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em' }}>12 SEMANAS</div>
          <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Plan de Entreno</div>
        </div>
        <button onClick={()=>setShowCalModal(true)} style={{ display:'flex', alignItems:'center', gap:5, background:calExported?T.green+'22':'#1c1c1e', border:`1px solid ${calExported?T.green:'#3a3a3c'}`, borderRadius:11, padding:'7px 12px', cursor:'pointer', color:calExported?T.green:T.text, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12 }}>
          📅 {calExported ? 'Exportado ✓' : 'Apple Cal'}
        </button>
      </div>

      {/* Apple Calendar modal */}
      {showCalModal && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-end', backdropFilter:'blur(8px)' }} onClick={()=>setShowCalModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'#1c1c1e', borderRadius:'24px 24px 0 0', padding:'24px 20px 40px', border:'1px solid #3a3a3c' }}>
            <div style={{ width:36, height:4, background:'#555', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:8 }}>Exportar a Apple Calendar</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:20, lineHeight:1.5 }}>
              Se exportarán <strong style={{color:T.orange}}>{plan.filter(s=>s.type!=='rest').length} sesiones</strong> con todos los detalles a tu calendario de iPhone.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowCalModal(false)} style={{ flex:1, background:'#2c2c2e', border:'1px solid #3a3a3c', borderRadius:12, padding:'13px', color:T.text, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, cursor:'pointer' }}>Cancelar</button>
              <button onClick={exportICS} style={{ flex:2, background:'linear-gradient(135deg,#0071e3,#0099FF)', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, cursor:'pointer' }}>📅 Exportar .ics</button>
            </div>
          </div>
        </div>
      )}

      {/* View toggle */}
      <div style={{ display:'flex', background:T.surface, borderRadius:12, padding:3, border:`1px solid ${T.border}` }}>
        {[['calendar','📅 Calendario'],['week','📋 Semana']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setView(id)} style={{ flex:1, padding:'8px', background:view===id?T.card:'transparent', border:view===id?`1px solid ${T.border}`:'1px solid transparent', borderRadius:10, color:view===id?T.text:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>

      {/* CALENDAR */}
      {view === 'calendar' && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:'14px 10px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <button onClick={()=>setCurrentMonth(new Date(year,month-1,1))} style={{ background:'none', border:'none', color:T.muted, fontSize:20, cursor:'pointer', padding:'0 8px' }}>‹</button>
            <div style={{ fontSize:15, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:'capitalize' }}>{monthName}</div>
            <button onClick={()=>setCurrentMonth(new Date(year,month+1,1))} style={{ background:'none', border:'none', color:T.muted, fontSize:20, cursor:'pointer', padding:'0 8px' }}>›</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:4 }}>
            {DAYS_ES.map(d => <div key={d} style={{ textAlign:'center', fontSize:9, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, paddingBottom:5 }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {Array.from({ length:totalCells }, (_, i) => {
              const dn = i - startOffset + 1
              if (dn < 1 || dn > daysInMonth) return <div key={i}/>
              const cd   = new Date(year, month, dn)
              const sess = planSessionForDate(cd)
              const done = isCompleted(cd)
              const st   = sess ? (SESSION_TYPES[sess.type] || SESSION_TYPES.easy) : null
              const isToday = cd.toDateString() === today.toDateString()
              const isSel   = selectedDate && cd.toDateString() === selectedDate.toDateString()
              const isRace  = profile?.race_date && cd.toDateString() === new Date(profile.race_date).toDateString()
              const isPast  = cd < today
              return (
                <div key={i} onClick={() => setSelectedDate(cd)} style={{
                  aspectRatio:'1', borderRadius:8, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  cursor: sess ? 'pointer' : 'default',
                  background: isSel ? (st ? st.color+'33' : T.surface) : isRace ? '#FF550033' : 'transparent',
                  border: isToday ? `2px solid ${T.orange}` : isSel ? `1px solid ${st?.color || T.border}` : '1px solid transparent',
                  opacity: isPast && !sess ? 0.25 : 1, transition:'all 0.15s',
                }}>
                  <div style={{ fontSize:11, fontWeight:isToday?800:500, color:isToday?T.orange:T.text, fontFamily:"'Barlow Condensed',sans-serif" }}>{dn}</div>
                  {st && st.dot !== '#444' && (
                    <div style={{ width:4, height:4, borderRadius:'50%', background: done ? T.green : st.dot, marginTop:1 }}/>
                  )}
                  {isRace && <div style={{ fontSize:6, color:T.orange, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800 }}>RACE</div>}
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 10px', marginTop:12, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
            {Object.entries(SESSION_TYPES).filter(([k])=>k!=='rest').map(([k,v])=>(
              <div key={k} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:v.dot }}/>
                <span style={{ fontSize:9, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif" }}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected day detail */}
      {view === 'calendar' && selectedDate && selectedSession && (
        <div style={{ background:T.card, border:`1px solid ${(SESSION_TYPES[selectedSession.type]?.color || T.orange)+'55'}`, borderRadius:16, padding:18, background:`linear-gradient(135deg,${SESSION_TYPES[selectedSession.type]?.color || T.orange}11,${T.card})` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:3 }}>
                {selectedDate.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' }).toUpperCase()}
              </div>
              <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:SESSION_TYPES[selectedSession.type]?.color || T.orange }}>
                {SESSION_TYPES[selectedSession.type]?.label || selectedSession.type}
              </div>
            </div>
            {isCompleted(selectedDate) && <div style={{ background:T.green+'22', border:`1px solid ${T.green}`, borderRadius:8, padding:'3px 8px', fontSize:10, color:T.green, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>HECHO ✓</div>}
          </div>
          {selectedSession.km > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[['Distancia', selectedSession.km+' km'], ['Zona', selectedSession.zone||'—'], ['Ritmo obj.', selectedSession.pace_target||'—'], ['Semana', 'S'+selectedSession.week+' / 12']].map(([k,v])=>(
                <div key={k} style={{ background:T.bg, borderRadius:9, padding:'9px 11px' }}>
                  <div style={{ fontSize:9, color:T.muted }}>{k}</div>
                  <div style={{ fontSize:15, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:SESSION_TYPES[selectedSession.type]?.color || T.orange }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {selectedSession.notes && (
            <div style={{ marginTop:10, fontSize:12, color:T.muted, lineHeight:1.5 }}>📋 {selectedSession.notes}</div>
          )}
        </div>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          <div style={{ fontSize:12, color:T.muted, marginBottom:4 }}>
            Semana del {startOfWeek.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
          </div>
          {weekDays.map(({ date, session, done }, i) => {
            const st = session ? (SESSION_TYPES[session.type] || SESSION_TYPES.easy) : SESSION_TYPES.rest
            const isToday = date.toDateString() === today.toDateString()
            return (
              <div key={i} style={{ background:isToday?st.color+'18':T.card, border:`1px solid ${isToday?st.color+'66':T.border}`, borderRadius:13, padding:'12px 14px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ textAlign:'center', minWidth:32 }}>
                  <div style={{ fontSize:9, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif" }}>{DAYS_ES[i]}</div>
                  <div style={{ fontSize:18, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:isToday?T.orange:T.text }}>{date.getDate()}</div>
                </div>
                <div style={{ width:3, height:36, borderRadius:2, background:st.dot, opacity:0.8 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:session?.type==='rest'?T.muted:T.text }}>{st.label}</div>
                  {session && session.km > 0 && <div style={{ fontSize:11, color:T.muted }}>{session.km} km{session.pace_target ? ` · ${session.pace_target}/km` : ''}</div>}
                </div>
                {done && <div style={{ fontSize:11, color:T.green, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>✓</div>}
                {isToday && <div style={{ fontSize:9, background:T.orange, color:'#fff', borderRadius:5, padding:'2px 6px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}>HOY</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
