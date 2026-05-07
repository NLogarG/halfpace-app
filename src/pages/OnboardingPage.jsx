import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const T = {
  bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222',
  orange:'#FF5500', orangeDim:'#FF550022', muted:'#666',
  text:'#F0F0F0', green:'#00E57A', blue:'#0099FF',
}

const DAYS = [
  { id:0, short:'L', long:'Lunes'     },
  { id:1, short:'M', long:'Martes'    },
  { id:2, short:'X', long:'Miércoles' },
  { id:3, short:'J', long:'Jueves'    },
  { id:4, short:'V', long:'Viernes'   },
  { id:5, short:'S', long:'Sábado'    },
  { id:6, short:'D', long:'Domingo'   },
]

// Recommended combos by number of days
const RECOMMENDED = {
  2: [1, 5],        // Mar + Sáb
  3: [1, 3, 5],     // Mar + Jue + Sáb
  4: [1, 3, 5, 6],  // Mar + Jue + Sáb + Dom
  5: [0, 2, 3, 5, 6],
  6: [0, 1, 2, 3, 5, 6],
}

const STEPS = [
  { id:'level',     title:'¿Cuál es tu nivel actual?',  options:['Principiante','Intermedio','Avanzado'] },
  { id:'goal_time', title:'¿Qué tiempo objetivo tienes?', options:['Sub 2:30h','Sub 2:00h','Sub 1:45h','Sub 1:30h'] },
  { id:'train_days',title:'¿Cuántos días a la semana puedes entrenar?', isDays: true },
  { id:'race_date', title:'¿Cuándo es tu carrera?',     isDate: true },
]

// ── Day picker step ────────────────────────────────────────────────────────
function DayPicker({ numDays, selectedDays, onChange }) {
  function toggle(dayId) {
    if (selectedDays.includes(dayId)) {
      // Don't deselect if already at minimum
      if (selectedDays.length <= 2) return
      onChange(selectedDays.filter(d => d !== dayId))
    } else {
      if (selectedDays.length >= numDays + 1) return // max 1 extra
      onChange([...selectedDays, dayId].sort((a,b) => a-b))
    }
  }

  const isOptimal  = selectedDays.length === numDays
  const hasConflict = selectedDays.length > numDays

  // Detect consecutive days (recovery risk)
  function hasConsecutive(days) {
    const sorted = [...days].sort((a,b)=>a-b)
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i+1] - sorted[i] === 1) return true
    }
    return false
  }
  const warnConsecutive = hasConsecutive(selectedDays)

  return (
    <div>
      {/* Day grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:14 }}>
        {DAYS.map(d => {
          const selected = selectedDays.includes(d.id)
          return (
            <div key={d.id} onClick={() => toggle(d.id)} style={{
              aspectRatio:'1', borderRadius:12, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', cursor:'pointer',
              background: selected ? T.orange : T.surface,
              border:`2px solid ${selected ? T.orange : T.border}`,
              transition:'all 0.15s', gap:2,
            }}>
              <span style={{ fontSize:13, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color: selected ? '#fff' : T.muted }}>
                {d.short}
              </span>
              <span style={{ fontSize:8, color: selected ? '#fff' : T.muted, fontFamily:"'Barlow Condensed',sans-serif" }}>
                {d.long.slice(0,3)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Selected summary */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
        <div style={{ fontSize:10, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:6 }}>
          DÍAS SELECCIONADOS — {selectedDays.length}
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {selectedDays.length > 0 ? selectedDays.map(id => (
            <span key={id} style={{ background:T.orange+'22', border:`1px solid ${T.orange}55`, borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", color:T.orange }}>
              {DAYS.find(d=>d.id===id)?.long}
            </span>
          )) : (
            <span style={{ fontSize:12, color:T.muted }}>Ninguno seleccionado</span>
          )}
        </div>
      </div>

      {/* Warnings and tips */}
      {warnConsecutive && (
        <div style={{ background:'#FFB80011', border:'1px solid #FFB80033', borderRadius:10, padding:'10px 12px', marginBottom:10, display:'flex', gap:8 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
          <div style={{ fontSize:12, color:'#FFB800', lineHeight:1.5 }}>
            Tienes días consecutivos. Te recomendamos separar los entrenos para dar tiempo a recuperar. No pasa nada si es necesario, el plan lo tendrá en cuenta.
          </div>
        </div>
      )}

      {isOptimal && !warnConsecutive && (
        <div style={{ background:T.green+'11', border:`1px solid ${T.green}33`, borderRadius:10, padding:'10px 12px', marginBottom:10, display:'flex', gap:8 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>✅</span>
          <div style={{ fontSize:12, color:T.green, lineHeight:1.5 }}>
            Distribución perfecta. El plan se adaptará exactamente a estos días.
          </div>
        </div>
      )}

      {/* Suggestion pill */}
      {selectedDays.length < numDays && (
        <div style={{ fontSize:12, color:T.muted, textAlign:'center', marginBottom:8 }}>
          Selecciona {numDays - selectedDays.length} día{numDays - selectedDays.length > 1 ? 's' : ''} más
        </div>
      )}
    </div>
  )
}

// ── Adjust step (shown after day picking) ─────────────────────────────────
function AdjustStep({ selectedDays, onConfirm }) {
  const [days, setDays] = useState(selectedDays)
  const [longRun, setLongRun] = useState(
    days.includes(6) ? 6 : days.includes(5) ? 5 : days[days.length - 1]
  )
  const [restDay, setRestDay] = useState(
    DAYS.map(d=>d.id).find(id => !days.includes(id) && id > 0)
  )

  const SESSION_TYPES = { long:'Tirada larga 🔴', interval:'Intervalos 🟡', tempo:'Tempo 🟣', easy:'Rodaje suave 🟢', rest:'Descanso 😴' }

  // Auto-assign session types based on days
  function buildSchedule(trainingDays, longDay) {
    const sorted = [...trainingDays].sort((a,b)=>a-b)
    const schedule = {}
    sorted.forEach((d, i) => {
      if (d === longDay) { schedule[d] = 'long'; return }
      // First training day of week → easy
      if (i === 0) { schedule[d] = 'easy'; return }
      // Second → interval or tempo alternating
      if (i === 1) { schedule[d] = 'interval'; return }
      if (i === 2) { schedule[d] = sorted.length >= 4 ? 'tempo' : 'medium'; return }
      if (i === 3) { schedule[d] = 'medium'; return }
      schedule[d] = 'easy'
    })
    return schedule
  }

  const schedule = buildSchedule(days, longRun)

  return (
    <div>
      <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em', marginBottom:8 }}>AJUSTA TU PLAN</div>
      <div style={{ fontSize:24, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:6 }}>¿Cuándo haces la tirada larga?</div>
      <div style={{ fontSize:13, color:T.muted, marginBottom:18, lineHeight:1.5 }}>
        La tirada larga es la sesión más importante. Ponla el día que tengas más tiempo y puedas descansar al día siguiente.
      </div>

      {/* Long run day selector */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
        {days.map(id => {
          const day = DAYS.find(d=>d.id===id)
          const nextDay = DAYS.find(d=>d.id===id+1) || DAYS.find(d=>d.id===0)
          const nextIsFree = !days.includes((id+1)%7)
          return (
            <button key={id} onClick={() => setLongRun(id)} style={{
              background: longRun===id ? T.orange+'22' : T.card,
              border:`2px solid ${longRun===id ? T.orange : T.border}`,
              borderRadius:14, padding:'14px 16px', cursor:'pointer',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              transition:'all 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:longRun===id?T.orange:'#222', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:longRun===id?'#fff':T.muted }}>
                  {day?.short}
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{day?.long}</div>
                  <div style={{ fontSize:11, color:T.muted }}>
                    {nextIsFree ? `✅ ${nextDay?.long} libre para recuperar` : `⚠️ ${nextDay?.long} también entrenas`}
                  </div>
                </div>
              </div>
              {longRun===id && <span style={{ color:T.orange, fontSize:18 }}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Preview schedule */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:10 }}>ASÍ QUEDARÍA TU SEMANA TIPO</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {DAYS.map(d => {
            const type    = schedule[d.id]
            const isRest  = !days.includes(d.id)
            const label   = isRest ? 'Descanso' : SESSION_TYPES[type] || 'Rodaje'
            const color   = isRest ? T.muted : type==='long' ? T.orange : type==='interval' ? '#FFB800' : type==='tempo' ? '#CC44FF' : T.green
            return (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:28, fontSize:10, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", color: days.includes(d.id) ? T.text : T.muted }}>{d.short}</div>
                <div style={{ flex:1, height:3, borderRadius:2, background: isRest ? T.border : color, opacity: isRest ? 0.3 : 1 }}/>
                <div style={{ fontSize:12, color, fontFamily:"'Barlow Condensed',sans-serif", fontWeight: isRest ? 400 : 600, width:130, textAlign:'right' }}>{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <button onClick={() => onConfirm({ days, longRunDay: longRun, schedule })} style={{
        width:'100%', background:T.orange, border:'none', borderRadius:14,
        padding:'15px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif",
        fontWeight:800, fontSize:16, cursor:'pointer',
      }}>
        Confirmar y generar plan →
      </button>
    </div>
  )
}

// ── Main onboarding ────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, updateProfile } = useAuth()
  const [step,         setStep]        = useState(0)
  const [answers,      setAnswers]     = useState({})
  const [selectedDays, setSelectedDays] = useState([])
  const [subStep,      setSubStep]     = useState('count') // 'count' | 'pick' | 'adjust'
  const [numDays,      setNumDays]     = useState(4)
  const [loading,      setLoading]     = useState(false)

  const cur = STEPS[step]

  // ── Day step logic ────────────────────────────────────────────────────────
  function handleDayCountSelect(count) {
    const n = parseInt(count)
    setNumDays(n)
    setSelectedDays(RECOMMENDED[n] || RECOMMENDED[4])
    setSubStep('pick')
  }

  function handleDaysConfirmed() {
    if (selectedDays.length < 2) return
    setSubStep('adjust')
  }

  async function handleScheduleConfirmed({ days, longRunDay, schedule }) {
    const finalAnswers = {
      ...answers,
      train_days:   days.length,
      training_days: days,        // array of day indices
      long_run_day:  longRunDay,
      schedule,
    }
    setAnswers(finalAnswers)
    // Move to next step (race date)
    setStep(step + 1)
    setSubStep('count')
  }

  // ── Generic step ──────────────────────────────────────────────────────────
  function handleOption(value) {
    const newAnswers = { ...answers, [cur.id]: value }
    setAnswers(newAnswers)
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish(newAnswers)
  }

  async function finish(finalAnswers) {
    setLoading(true)
    await updateProfile({
      level:         finalAnswers.level,
      goal_time:     finalAnswers.goal_time,
      train_days:    finalAnswers.train_days || 4,
      race_date:     finalAnswers.race_date,
    })
    // Generate AI plan with full schedule context
    await fetch('/api/plan/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        userId:       user.id,
        level:        finalAnswers.level,
        goalTime:     finalAnswers.goal_time,
        trainDays:    finalAnswers.train_days,
        trainingDays: finalAnswers.training_days || [1,3,5,6],
        longRunDay:   finalAnswers.long_run_day ?? 5,
        raceDate:     finalAnswers.race_date,
      }),
    })
    setLoading(false)
  }

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ height:'100vh', background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:'0 32px', textAlign:'center' }}>
      <div style={{ fontSize:52 }}>🤖</div>
      <div style={{ fontSize:24, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Generando tu plan...</div>
      <div style={{ fontSize:14, color:T.muted, lineHeight:1.6 }}>
        Claude está creando 12 semanas de entrenamiento personalizadas para ti, con tus días y horarios.
      </div>
      <div style={{ width:180, height:4, background:T.border, borderRadius:2, marginTop:8 }}>
        <div style={{ height:'100%', width:'60%', background:T.orange, borderRadius:2, animation:'load 1.5s ease-in-out infinite' }}/>
      </div>
      <style>{`@keyframes load{0%{width:10%}50%{width:85%}100%{width:10%}}`}</style>
    </div>
  )

  // ── Progress bar ──────────────────────────────────────────────────────────
  const totalSteps = STEPS.length + 1 // +1 for the adjust sub-step
  const currentProgress = step + (cur?.isDays ? (subStep==='pick'?0.5:subStep==='adjust'?0.8:0) : 0)
  const pct = Math.round((currentProgress / totalSteps) * 100)

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column', padding:'48px 20px 32px' }}>

      {/* Progress */}
      <div style={{ fontSize:11, color:T.orange, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em', marginBottom:8 }}>
        {cur?.isDays ? (subStep==='count'?'PASO 3':'subStep'==='pick'?'PASO 3':'PASO 3') : `PASO ${step+1} DE ${STEPS.length}`}
      </div>
      <div style={{ height:3, background:T.border, borderRadius:2, marginBottom:32 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:T.orange, borderRadius:2, transition:'width 0.4s' }}/>
      </div>

      {/* ── Day step (has sub-steps) ───────────────────────────────────── */}
      {cur?.isDays ? (
        <>
          {subStep === 'count' && (
            <>
              <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:24 }}>
                ¿Cuántos días a la semana puedes entrenar?
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['2','2 días — mínimo viable'],['3','3 días — ideal para empezar'],['4','4 días — equilibrio perfecto'],['5','5 días — nivel serio'],['6','6 días — alta dedicación']].map(([val, lbl]) => (
                  <button key={val} onClick={() => handleDayCountSelect(val)} style={{
                    background:T.card, border:`1px solid ${T.border}`, borderRadius:14,
                    padding:'16px 18px', color:T.text, fontFamily:"'Barlow Condensed',sans-serif",
                    fontWeight:700, fontSize:16, textAlign:'left', cursor:'pointer', transition:'all 0.2s',
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <span>{lbl}</span>
                    <span style={{ fontSize:13, color:T.muted }}>›</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {subStep === 'pick' && (
            <>
              <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:8 }}>
                ¿Qué días te vienen mejor?
              </div>
              <div style={{ fontSize:13, color:T.muted, marginBottom:20, lineHeight:1.5 }}>
                Te hemos sugerido la distribución óptima para {numDays} días. Puedes cambiarlo si no te encaja.
              </div>
              <DayPicker numDays={numDays} selectedDays={selectedDays} onChange={setSelectedDays}/>
              <div style={{ display:'flex', gap:10, marginTop:8 }}>
                <button onClick={() => setSubStep('count')} style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'13px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, cursor:'pointer' }}>
                  ← Atrás
                </button>
                <button onClick={handleDaysConfirmed} disabled={selectedDays.length < 2} style={{
                  flex:2, background: selectedDays.length >= 2 ? T.orange : T.surface,
                  border:`1px solid ${selectedDays.length >= 2 ? T.orange : T.border}`,
                  borderRadius:12, padding:'13px', color: selectedDays.length >= 2 ? '#fff' : T.muted,
                  fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15,
                  cursor: selectedDays.length >= 2 ? 'pointer' : 'default',
                }}>
                  Siguiente →
                </button>
              </div>
            </>
          )}

          {subStep === 'adjust' && (
            <>
              <AdjustStep selectedDays={selectedDays} onConfirm={handleScheduleConfirmed}/>
              <button onClick={() => setSubStep('pick')} style={{ marginTop:12, background:'none', border:'none', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', padding:'8px 0' }}>
                ← Cambiar días
              </button>
            </>
          )}
        </>
      ) : (
        /* ── Generic step ─────────────────────────────────────────────── */
        <>
          <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:24 }}>{cur?.title}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {cur?.isDate ? (
              <input type="date" onChange={e => handleOption(e.target.value)}
                style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:'16px', color:T.text, fontSize:16, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}/>
            ) : (
              cur?.options?.map(opt => (
                <button key={opt} onClick={() => handleOption(opt)} style={{
                  background:T.card, border:`1px solid ${T.border}`, borderRadius:14,
                  padding:'16px 18px', color:T.text, fontFamily:"'Barlow Condensed',sans-serif",
                  fontWeight:700, fontSize:16, textAlign:'left', cursor:'pointer', transition:'all 0.2s',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <span>{opt}</span><span style={{ color:T.muted }}>›</span>
                </button>
              ))
            )}
          </div>
          {step > 0 && (
            <button onClick={() => setStep(step-1)} style={{ marginTop:20, background:'none', border:`1px solid ${T.border}`, borderRadius:12, padding:'12px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, cursor:'pointer' }}>
              ← Atrás
            </button>
          )}
        </>
      )}
    </div>
  )
}
