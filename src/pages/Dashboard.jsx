import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SessionReview from '../components/SessionReview'

const T = {
  bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222',
  orange:'#FF5500', orangeDim:'#FF550022', orangeMid:'#FF550055',
  muted:'#666', text:'#F0F0F0', green:'#00E57A', blue:'#0099FF',
}

function Card({ children, style={} }) {
  return <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18, ...style }}>{children}</div>
}
function StatPill({ label, value, unit, color=T.orange }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', flex:1 }}>
      <div style={{ fontSize:10, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:5 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
        <span style={{ fontSize:24, fontWeight:700, color, fontFamily:"'Barlow Condensed',sans-serif" }}>{value}</span>
        {unit && <span style={{ fontSize:11, color:T.muted }}>{unit}</span>}
      </div>
    </div>
  )
}
function FatigueBar({ load }) {
  const color = load < 40 ? T.muted : load < 65 ? T.green : load < 85 ? T.orange : '#FF2200'
  const label = load < 40 ? 'Muy baja' : load < 65 ? 'Óptima' : load < 85 ? 'Alta' : '¡Sobrecarga!'
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:12, color:T.muted }}>Carga semanal</span>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'Barlow Condensed',sans-serif" }}>{label}</span>
      </div>
      <div style={{ height:6, background:T.border, borderRadius:3 }}>
        <div style={{ height:'100%', width:`${Math.min(100,load)}%`, background:color, borderRadius:3, transition:'width 0.8s' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
        {['Baja','Óptima','Alta','Peligro'].map(l => <span key={l} style={{ fontSize:9, color:T.muted }}>{l}</span>)}
      </div>
    </div>
  )
}

const SESSION_LABELS = { easy:'Rodaje suave', medium:'Rodaje medio', long:'Tirada larga', interval:'Intervalos', tempo:'Tempo', rest:'Descanso', race:'¡CARRERA!' }
const SESSION_COLORS = { easy:T.green, medium:T.blue, long:T.orange, interval:'#FFB800', tempo:'#CC44FF', rest:T.muted, race:T.orange }

export default function Dashboard({ setActive }) {
  const { profile }                         = useAuth()
  const [weekSessions,  setWeekSessions]    = useState([])
  const [todaySession,  setTodaySession]    = useState(null)
  const [todayDone,     setTodayDone]       = useState(false)
  const [weeklyVolume,  setWeeklyVolume]    = useState([])
  const [loading,       setLoading]         = useState(true)
  const [showReview,    setShowReview]      = useState(false)

  useEffect(() => { if (profile?.id) fetchData() }, [profile])

  async function fetchData() {
    const today    = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay()+6)%7))
    const weekStr  = weekStart.toISOString().split('T')[0]

    const [{ data: sessions }, { data: allS }] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', profile.id).gte('date', weekStr).order('date'),
      supabase.from('sessions').select('date,km').eq('user_id', profile.id)
        .gte('date', new Date(Date.now()-56*24*3600*1000).toISOString().split('T')[0]),
    ])
    setWeekSessions(sessions || [])
    setTodayDone(!!(sessions || []).find(s => s.date === todayStr))

    // Today's planned session
    const dayOfWeek  = (today.getDay() + 6) % 7
    const planStart  = profile.race_date ? new Date(new Date(profile.race_date).getTime() - 84*24*3600*1000) : new Date()
    const weekNumber = Math.ceil((today - planStart) / (7*24*3600*1000))
    const { data: planned } = await supabase.from('plans').select('*')
      .eq('user_id', profile.id).eq('day_of_week', dayOfWeek).eq('week', Math.max(1,Math.min(12,weekNumber))).single()
    setTodaySession(planned)

    // Weekly volume
    if (allS) {
      const eight = new Date(Date.now()-56*24*3600*1000)
      const weeks = {}
      allS.forEach(s => {
        const key = `S${Math.ceil((new Date(s.date)-eight)/(7*24*3600*1000))}`
        weeks[key] = { week:key, km: Math.round(((weeks[key]?.km||0)+(s.km||0))*10)/10 }
      })
      setWeeklyVolume(Object.values(weeks).slice(-8))
    }
    setLoading(false)
  }

  const weekKm      = weekSessions.reduce((s,x)=>s+(x.km||0),0).toFixed(1)
  const weekPace    = weekSessions.filter(s=>s.pace).slice(-1)[0]?.pace || '—'
  const daysLeft    = profile?.race_date ? Math.max(0,Math.ceil((new Date(profile.race_date)-new Date())/(24*3600*1000))) : 0
  const pct         = Math.max(0, Math.round((1-daysLeft/84)*100))
  const fatigueLoad = Math.min(95, Math.round((weekKm/35)*70))
  const hour        = new Date().getHours()
  const greeting    = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const firstName   = profile?.name?.split(' ')[0] || ''

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${T.orange}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:12, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em', marginBottom:3 }}>{greeting.toUpperCase()}</div>
          <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>{firstName} 👋</div>
        </div>
        <div style={{ width:40, height:40, borderRadius:'50%', background:T.orange, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>
          {profile?.name?.[0]?.toUpperCase()||'?'}
        </div>
      </div>

      {/* Race countdown */}
      {profile?.race_date && (
        <Card style={{ background:`linear-gradient(135deg,#1A0A00,${T.card})`, borderColor:T.orangeMid, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:T.orangeDim, filter:'blur(30px)' }}/>
          <div style={{ fontSize:11, color:T.orange, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em', marginBottom:6 }}>PRÓXIMA CARRERA</div>
          <div style={{ fontSize:13, color:T.text, marginBottom:10, fontWeight:500 }}>{profile.goal_time} · {new Date(profile.race_date).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:56, fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", color:T.orange, lineHeight:1 }}>{daysLeft}</span>
            <span style={{ fontSize:16, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif" }}>DÍAS</span>
          </div>
          <div style={{ height:4, background:T.border, borderRadius:2 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:T.orange, borderRadius:2 }}/>
          </div>
          <div style={{ fontSize:11, color:T.muted, marginTop:5, textAlign:'right' }}>{pct}% del plan completado</div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display:'flex', gap:8 }}>
        <StatPill label="KM SEMANA"  value={weekKm}               unit="km"  color={T.orange}/>
        <StatPill label="RITMO MED." value={weekPace}              unit="/km" color={T.blue}/>
        <StatPill label="SESIONES"   value={`${weekSessions.length}/5`}      color={T.green}/>
      </div>

      {/* Fatigue */}
      <Card>
        <FatigueBar load={fatigueLoad}/>
        <div style={{ fontSize:12, color:T.muted, marginTop:10, lineHeight:1.5 }}>
          {fatigueLoad >= 80 ? '⚠️ Carga alta. Prioriza el descanso y no te saltes el día de recuperación.'
           : fatigueLoad >= 50 ? '✅ Carga en rango óptimo. Sigue el plan tal como está.'
           : '📈 Carga baja. Puedes añadir algo de volumen si te encuentras bien.'}
        </div>
      </Card>

      {/* TODAY'S SESSION — the star of the show */}
      <Card style={{ borderColor: todayDone ? T.green+'44' : todaySession ? SESSION_COLORS[todaySession.type]+'44' : T.border }}>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:10 }}>
          HOY — {new Date().toLocaleDateString('es-ES',{weekday:'long'}).toUpperCase()}
        </div>

        {todayDone ? (
          /* Already completed */
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:T.green+'22', border:`1px solid ${T.green}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>✓</div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color:T.green }}>Sesión completada</div>
              <div style={{ fontSize:12, color:T.muted }}>Buen trabajo hoy. ¡A recuperar!</div>
            </div>
          </div>
        ) : todaySession && todaySession.type !== 'rest' ? (
          /* Session planned, not done yet */
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", color:SESSION_COLORS[todaySession.type] }}>
                  {SESSION_LABELS[todaySession.type]}
                </div>
                <div style={{ fontSize:13, color:T.muted }}>
                  {todaySession.km > 0 ? `${todaySession.km} km` : ''}
                  {todaySession.zone ? ` · ${todaySession.zone}` : ''}
                  {todaySession.pace_target ? ` · ${todaySession.pace_target}/km` : ''}
                </div>
              </div>
            </div>
            {todaySession.notes && (
              <div style={{ fontSize:12, color:T.muted, background:T.surface, borderRadius:10, padding:'10px 12px', lineHeight:1.5, marginBottom:12 }}>
                📋 {todaySession.notes}
              </div>
            )}
            {/* BIG CTA — finish session */}
            <button onClick={() => setShowReview(true)} style={{
              width:'100%', background:`linear-gradient(135deg,${SESSION_COLORS[todaySession.type]},${SESSION_COLORS[todaySession.type]}cc)`,
              border:'none', borderRadius:14, padding:'16px',
              color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900,
              fontSize:17, cursor:'pointer', letterSpacing:'0.04em',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}>
              <span>🏁</span> Registrar sesión + análisis del coach
            </button>
          </>
        ) : (
          /* Rest day or no plan */
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:T.surface, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>😴</div>
            <div>
              <div style={{ fontSize:17, fontWeight:700 }}>{todaySession?.type === 'rest' ? 'Día de descanso' : 'Sin sesión planificada'}</div>
              <div style={{ fontSize:12, color:T.muted }}>Recupera bien — es parte del entrenamiento</div>
            </div>
          </div>
        )}
      </Card>

      {/* Coach shortcut */}
      <button onClick={()=>setActive('coach')} style={{ background:`linear-gradient(135deg,#1A0A00,#0A0014)`, border:`1px solid ${T.orangeMid}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', width:'100%', textAlign:'left' }}>
        <span style={{ fontSize:24 }}>🤖</span>
        <div><div style={{ fontSize:14, fontWeight:700, color:T.text }}>Pregunta al Coach</div><div style={{ fontSize:12, color:T.muted }}>Lesiones, nutrición, ritmos, estrategia…</div></div>
        <span style={{ marginLeft:'auto', color:T.orange, fontSize:18 }}>›</span>
      </button>

      {/* Volume chart */}
      {weeklyVolume.length > 0 && (
        <Card>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:10 }}>VOLUMEN ÚLTIMAS SEMANAS</div>
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={weeklyVolume} margin={{top:0,right:0,left:-30,bottom:0}}>
              <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.orange} stopOpacity={0.35}/><stop offset="95%" stopColor={T.orange} stopOpacity={0}/></linearGradient></defs>
              <Area type="monotone" dataKey="km" stroke={T.orange} strokeWidth={2} fill="url(#vg)" dot={false}/>
              <XAxis dataKey="week" tick={{fill:T.muted,fontSize:9,fontFamily:"'Barlow Condensed',sans-serif"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.muted,fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:11}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Session review modal */}
      {showReview && (
        <SessionReview
          planned={todaySession}
          onClose={() => setShowReview(false)}
          onSaved={() => { setTodayDone(true); fetchData() }}
        />
      )}
    </div>
  )
}
