import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'

const T = { bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222', orange:'#FF5500', orangeMid:'#FF550055', muted:'#666', text:'#F0F0F0', green:'#00E57A', blue:'#0099FF' }

function Card({ children, style={} }) {
  return <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18, ...style }}>{children}</div>
}

function RacePredictor() {
  const [best10k, setBest10k] = useState('49:20')
  const [result,  setResult]  = useState(null)
  function predict() {
    try {
      const [m, s] = best10k.split(':').map(Number)
      const t10 = m * 60 + s
      const t21 = t10 * Math.pow(21.0975 / 10, 1.06)
      const mins = Math.floor(t21 / 60), secs = Math.round(t21 % 60)
      const h = Math.floor(mins / 60), rm = mins % 60
      setResult({ time:`${h}h ${rm}min ${String(secs).padStart(2,'0')}s`, pace:`${Math.floor(t21/21.0975/60)}:${String(Math.round(t21/21.0975%60)).padStart(2,'0')}/km` })
    } catch { setResult({ time:'—', pace:'—' }) }
  }
  return (
    <Card>
      <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:12 }}>🎯 PREDICTOR DE TIEMPO</div>
      <div style={{ fontSize:13, color:T.muted, marginBottom:12, lineHeight:1.5 }}>Introduce tu mejor 10K y estimamos tu tiempo en media maratón.</div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>MEJOR 10K (mm:ss)</div>
        <input value={best10k} onChange={e=>setBest10k(e.target.value)}
          style={{ width:'100%', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 14px', color:T.text, fontSize:18, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}/>
      </div>
      <button onClick={predict} style={{ width:'100%', background:T.orange, border:'none', borderRadius:12, padding:'12px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, cursor:'pointer' }}>
        Calcular →
      </button>
      {result && (
        <div style={{ marginTop:14, background:T.bg, borderRadius:12, padding:16, border:`1px solid ${T.orangeMid}`, textAlign:'center' }}>
          <div style={{ fontSize:11, color:T.orange, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:5 }}>TIEMPO ESTIMADO 21K</div>
          <div style={{ fontSize:32, fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", color:T.orange }}>{result.time}</div>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Ritmo medio: {result.pace}</div>
        </div>
      )}
    </Card>
  )
}

export default function Progreso() {
  const { profile } = useAuth()
  const [metric,    setMetric]   = useState('km')
  const [weeklyData,setWeekly]   = useState([])
  const [records,   setRecords]  = useState([])
  const [radarData, setRadar]    = useState([])
  const [loading,   setLoading]  = useState(true)

  useEffect(() => { if (profile?.id) fetchData() }, [profile])

  async function fetchData() {
    const eightWeeksAgo = new Date(); eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const [{ data: sessions }, { data: recs }] = await Promise.all([
      supabase.from('sessions').select('date,km,pace,hr_avg,type').eq('user_id', profile.id).gte('date', eightWeeksAgo.toISOString().split('T')[0]).order('date'),
      supabase.from('records').select('*').eq('user_id', profile.id).order('distance'),
    ])

    // Aggregate by week
    if (sessions) {
      const weeks = {}
      sessions.forEach(s => {
        const d   = new Date(s.date)
        const key = `S${Math.ceil((d - eightWeeksAgo) / (7*24*3600*1000))}`
        if (!weeks[key]) weeks[key] = { week:key, km:0, ritmo:0, fc:0, count:0 }
        weeks[key].km    += s.km || 0
        weeks[key].ritmo += s.pace ? parseFloat(s.pace.split(':')[0]) + parseFloat(s.pace.split(':')[1]||0)/60 : 0
        weeks[key].fc    += s.hr_avg || 0
        weeks[key].count++
      })
      const wData = Object.values(weeks).map(w => ({
        week:  w.week,
        km:    Math.round(w.km * 10) / 10,
        ritmo: w.count ? Math.round((w.ritmo / w.count) * 100) / 100 : 0,
        fc:    w.count ? Math.round(w.fc / w.count) : 0,
      }))
      setWeekly(wData)

      // Radar — calculate from sessions
      const totalSessions = sessions.length
      const longRuns  = sessions.filter(s => s.type === 'long').length
      const intervals = sessions.filter(s => s.type === 'interval').length
      const streak    = Math.min(sessions.filter(s => new Date(s.date) > new Date(Date.now()-14*24*3600*1000)).length * 14, 100)
      setRadar([
        { stat:'Resistencia',  value: Math.min(100, longRuns * 15 + 20) },
        { stat:'Velocidad',    value: Math.min(100, intervals * 12 + 20) },
        { stat:'Volumen',      value: Math.min(100, Math.round((wData.slice(-1)[0]?.km || 0) / 40 * 100)) },
        { stat:'Recuperación', value: 75 },
        { stat:'Consistencia', value: streak },
      ])
    }

    setRecords(recs || [])
    setLoading(false)
  }

  const DIST_LABELS = { '1k':'1 km', '5k':'5 km', '10k':'10 km', '21k':'21 km' }
  function formatTime(secs) {
    const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${T.orange}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em' }}>TUS DATOS</div>
        <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Progreso</div>
      </div>

      {/* Metric selector */}
      <div style={{ display:'flex', gap:6 }}>
        {[['km','Volumen'],['ritmo','Ritmo'],['fc','FC Media']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setMetric(id)} style={{ flex:1, padding:'8px 0', background:metric===id?T.orange:T.card, border:`1px solid ${metric===id?T.orange:T.border}`, borderRadius:10, color:metric===id?'#fff':T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>

      {/* Chart */}
      <Card>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={weeklyData} margin={{ top:8, right:0, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.orange} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={T.orange} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="week" tick={{ fill:T.muted, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:T.muted, fontSize:9 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:11 }}/>
              <Area type="monotone" dataKey={metric} stroke={T.orange} strokeWidth={2.5} fill="url(#mg)" dot={{ fill:T.orange, r:3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', color:T.muted, fontSize:13 }}>
            Sin datos aún — completa algunos entrenos para ver tu progreso
          </div>
        )}
      </Card>

      {/* Race predictor */}
      <RacePredictor/>

      {/* Radar */}
      {radarData.length > 0 && (
        <Card>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:6 }}>PERFIL DE ATLETA</div>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="stat" tick={{ fill:T.muted, fontSize:9, fontFamily:"'Barlow Condensed',sans-serif" }}/>
              <Radar dataKey="value" stroke={T.orange} fill={T.orange} fillOpacity={0.15} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Personal records */}
      <Card>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:12 }}>RÉCORDS PERSONALES</div>
        {records.length > 0 ? records.map((r, i) => (
          <div key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<records.length-1?`1px solid ${T.border}`:'none' }}>
            <div style={{ fontSize:13, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", width:40 }}>{DIST_LABELS[r.distance] || r.distance}</div>
            <div style={{ fontSize:18, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>{formatTime(r.time_secs)}</div>
            <div style={{ fontSize:11, color:T.muted }}>{r.date ? new Date(r.date).toLocaleDateString('es-ES',{month:'short',year:'numeric'}) : ''}</div>
          </div>
        )) : (
          <div style={{ fontSize:13, color:T.muted, lineHeight:1.5 }}>
            Aún no tienes récords registrados. Al sincronizar Strava o registrar sesiones manualmente, tus mejores tiempos aparecerán aquí.
          </div>
        )}
      </Card>
    </div>
  )
}
