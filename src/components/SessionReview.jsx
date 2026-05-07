import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const T = {
  bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222',
  orange:'#FF5500', orangeDim:'#FF550022', muted:'#666',
  text:'#F0F0F0', green:'#00E57A', blue:'#0099FF', purple:'#CC44FF',
}

const SESSION_LABELS = {
  easy:'Rodaje suave', medium:'Rodaje medio', long:'Tirada larga',
  interval:'Intervalos', tempo:'Tempo', rest:'Descanso', race:'¡Carrera!',
}
const SESSION_COLORS = {
  easy:T.green, medium:T.blue, long:T.orange,
  interval:'#FFB800', tempo:T.purple, rest:T.muted, race:T.orange,
}

// ─── REVIEW ENGINE ─────────────────────────────────────────────────────────
// Generates a coach review based on planned vs actual data. Zero API cost.
function generateReview({ planned, actual }) {
  const type     = planned?.type || 'easy'
  const planKm   = planned?.km || 0
  const planPace = planned?.pace_target || null
  const actKm    = parseFloat(actual.km) || 0
  const actRpe   = parseInt(actual.rpe) || 5
  const actTime  = actual.time || null

  // Calculate deviation
  const kmDiff   = planKm > 0 ? ((actKm - planKm) / planKm) * 100 : 0
  const kmDiffAbs = Math.abs(kmDiff)

  // Parse paces to seconds/km
  function paceToSecs(p) {
    if (!p) return null
    const parts = p.replace('/km','').split(':')
    return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0)
  }
  const planPaceSecs = paceToSecs(planPace)
  const actPaceSecs  = paceToSecs(actual.pace)
  const paceDiff     = planPaceSecs && actPaceSecs ? actPaceSecs - planPaceSecs : null

  // ── Score ──────────────────────────────────────────────────────────────
  let score = 100

  // Distance deviation
  if (kmDiff < -15)      score -= 20
  else if (kmDiff < -8)  score -= 10
  else if (kmDiff > 20)  score -= 5

  // RPE check by type
  const rpeRanges = { easy:[1,5], medium:[4,7], long:[4,7], interval:[7,10], tempo:[6,9], race:[7,10] }
  const [rpeMin, rpeMax] = rpeRanges[type] || [1,10]
  if (actRpe < rpeMin)      score -= 8   // too easy
  else if (actRpe > rpeMax) score -= 15  // too hard

  // Pace check (only for easy/medium/long)
  if (paceDiff !== null && ['easy','medium','long'].includes(type)) {
    if (paceDiff < -15)      score -= 15  // went too fast
    else if (paceDiff < -8)  score -= 8
    else if (paceDiff > 20)  score -= 5   // slightly slow, ok
  }

  score = Math.max(40, Math.min(100, score))

  // ── Stars ──────────────────────────────────────────────────────────────
  const stars = score >= 90 ? 5 : score >= 78 ? 4 : score >= 65 ? 3 : score >= 50 ? 2 : 1

  // ── Headline ───────────────────────────────────────────────────────────
  const headlines = {
    5: ['¡Sesión perfecta! 🔥', '¡Bordar el entreno! 💪', '¡Exactamente lo que tocaba! ⚡'],
    4: ['Muy buen entreno 👏', 'Sesión muy sólida 💪', 'Casi perfecto, muy bien 👌'],
    3: ['Entreno completado ✅', 'Sesión aceptable 👍', 'Trabajo hecho, con margen de mejora'],
    2: ['Entreno irregular ⚠️', 'Hay cosas a corregir 🔧', 'Sesión por debajo del plan'],
    1: ['Sesión muy alejada del plan 📋', 'Hay que revisar qué pasó 🤔'],
  }
  const headline = headlines[stars][Math.floor(Math.random() * headlines[stars].length)]

  // ── Blocks of analysis ─────────────────────────────────────────────────
  const blocks = []

  // Distance block
  if (planKm > 0 && actKm > 0) {
    if (kmDiffAbs <= 5) {
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm} km — exactamente lo previsto (${planKm} km). Perfecto.`, positive:true })
    } else if (kmDiff < -15) {
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm} km vs ${planKm} km planificados (−${kmDiffAbs.toFixed(0)}%). Has cortado bastante. Si fue por molestia física, bien hecho. Si fue por fatiga, toca revisar la carga esta semana.`, positive:false })
    } else if (kmDiff < 0) {
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm} km vs ${planKm} km planificados. Un poco menos de lo previsto, pero perfectamente válido.`, positive:true })
    } else if (kmDiff > 15) {
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm} km vs ${planKm} km planificados (+${kmDiff.toFixed(0)}%). Ojo con pasarte — el exceso de volumen es la principal causa de lesiones. La semana que viene respeta más el plan.`, positive:false })
    } else {
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm} km — ligeramente por encima del plan (${planKm} km). Bien.`, positive:true })
    }
  }

  // Intensity/RPE block
  if (type === 'easy') {
    if (actRpe <= 4) blocks.push({ icon:'💚', label:'Intensidad', text:`RPE ${actRpe}/10 — ritmo muy cómodo, perfecto para un rodaje suave. Los rodajes fáciles deben ser fáciles de verdad.`, positive:true })
    else if (actRpe <= 6) blocks.push({ icon:'💚', label:'Intensidad', text:`RPE ${actRpe}/10 — dentro del rango correcto para rodaje suave. Bien.`, positive:true })
    else blocks.push({ icon:'⚠️', label:'Intensidad', text:`RPE ${actRpe}/10 — demasiado intenso para un rodaje suave. Este tipo de sesión debería sentirse conversacional. Ir muy rápido en los días fáciles compromete la recuperación.`, positive:false })
  } else if (type === 'long') {
    if (actRpe <= 6) blocks.push({ icon:'💚', label:'Intensidad', text:`RPE ${actRpe}/10 — ritmo controlado en la tirada larga, exactamente lo que buscamos. El objetivo es llegar bien al final, no ir rápido.`, positive:true })
    else if (actRpe <= 8) blocks.push({ icon:'🟡', label:'Intensidad', text:`RPE ${actRpe}/10 — algo más intenso de lo ideal para tirada larga. No es grave, pero trata de guardar margen la próxima vez.`, positive:null })
    else blocks.push({ icon:'⚠️', label:'Intensidad', text:`RPE ${actRpe}/10 — la tirada larga fue demasiado intensa. Hay riesgo de no recuperar bien para las sesiones de calidad de la semana. La próxima: ritmo conversacional de principio a fin.`, positive:false })
  } else if (type === 'interval' || type === 'tempo') {
    if (actRpe >= 7) blocks.push({ icon:'🔥', label:'Intensidad', text:`RPE ${actRpe}/10 — buena intensidad para una sesión de calidad. Has trabajado la zona que tocaba.`, positive:true })
    else blocks.push({ icon:'📈', label:'Intensidad', text:`RPE ${actRpe}/10 — para ${SESSION_LABELS[type].toLowerCase()} deberías sentirlo más intenso. La próxima sesión, confía en el ritmo objetivo del plan y aprieta un poco más.`, positive:false })
  }

  // Pace block
  if (paceDiff !== null && actual.pace) {
    if (['easy','medium','long'].includes(type)) {
      if (Math.abs(paceDiff) <= 10) {
        blocks.push({ icon:'⚡', label:'Ritmo', text:`${actual.pace}/km — muy cerca del objetivo (${planPace}/km). Excelente control del ritmo.`, positive:true })
      } else if (paceDiff < -15) {
        blocks.push({ icon:'⚡', label:'Ritmo', text:`${actual.pace}/km — ${Math.abs(paceDiff)}s/km más rápido que el objetivo (${planPace}/km). Para este tipo de sesión, ir más lento es parte del plan. El ritmo suave construye la base aeróbica.`, positive:false })
      } else if (paceDiff > 20) {
        blocks.push({ icon:'⚡', label:'Ritmo', text:`${actual.pace}/km — algo más lento que el objetivo (${planPace}/km). Puede ser por condiciones (calor, terreno, cansancio). Sin problema si el esfuerzo percibido fue correcto.`, positive:null })
      } else {
        blocks.push({ icon:'⚡', label:'Ritmo', text:`${actual.pace}/km — dentro del rango objetivo. Buen trabajo.`, positive:true })
      }
    }
  }

  // Notes analysis
  if (actual.notes) {
    const notes = actual.notes.toLowerCase()
    const hasPain = ['duele','dolor','molestia','pincha','lesión','lesion','mal','flojo','cargado'].some(w => notes.includes(w))
    const hasGood = ['bien','genial','perfecto','fuerte','fácil','facil','ligero','cómodo','comodo'].some(w => notes.includes(w))
    if (hasPain) {
      blocks.push({ icon:'🩹', label:'Sensaciones', text:`Has mencionado molestias. No lo ignores — si persiste en el próximo entreno, tómate un día extra de descanso y consulta con un fisio si hace falta.`, positive:false })
    } else if (hasGood) {
      blocks.push({ icon:'😊', label:'Sensaciones', text:`Buenas sensaciones, eso es lo más importante. Cuando el cuerpo responde bien, el rendimiento llega solo.`, positive:true })
    }
  }

  // ── Next session advice ─────────────────────────────────────────────────
  const nextTips = {
    easy:     'El siguiente entreno de calidad será más efectivo gracias a este rodaje. Mantén la hidratación y duerme bien.',
    medium:   'Buen trabajo de base. Asegúrate de comer bien en las próximas 2h para recuperar el glucógeno.',
    long:     'La tirada larga es la reina del plan. Aprovecha hoy para recuperar bien: come carbohidratos, estira suavemente y descansa.',
    interval: 'Las adaptaciones de los intervalos se producen en las 24-48h de recuperación. Hoy y mañana son tan importantes como la sesión.',
    tempo:    'Excelente trabajo de umbral. Tu ritmo de carrera mejora con cada tempo bien ejecutado.',
    race:     '¡Lo conseguiste! La recuperación post-carrera lleva 2-3 semanas. Esta semana: rodajes muy suaves si te apetece, sin presión.',
  }

  return {
    score,
    stars,
    headline,
    blocks,
    nextTip: nextTips[type] || 'Buen trabajo. Descansa bien y a por el siguiente.',
  }
}

// ─── STAR RATING DISPLAY ───────────────────────────────────────────────────
function Stars({ count }) {
  return (
    <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:28, filter: i <= count ? 'none' : 'grayscale(1) opacity(0.25)', transition:'all 0.3s', transitionDelay:`${i*0.08}s` }}>⭐</span>
      ))}
    </div>
  )
}

// ─── SCORE RING ────────────────────────────────────────────────────────────
function ScoreRing({ score, color }) {
  const r   = 36
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position:'relative', width:88, height:88, flexShrink:0 }}>
      <svg width="88" height="88" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="44" cy="44" r={r} fill="none" stroke={T.border} strokeWidth="6"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:22, fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", color, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:9, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif" }}>/ 100</span>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function SessionReview({ planned, onClose, onSaved }) {
  const { user } = useAuth()
  const [step,    setStep]   = useState('log')   // 'log' | 'review'
  const [form,    setForm]   = useState({
    km:    planned?.km ? String(planned.km) : '',
    time:  '',
    pace:  planned?.pace_target || '',
    rpe:   '5',
    notes: '',
  })
  const [review,  setReview] = useState(null)
  const [saving,  setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const type    = planned?.type || 'easy'
  const color   = SESSION_COLORS[type] || T.orange
  const label   = SESSION_LABELS[type] || type

  function handleAnalyze() {
    const r = generateReview({ planned, actual: form })
    setReview(r)
    setStep('review')
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('sessions').insert({
      user_id:  user.id,
      date:     new Date().toISOString().split('T')[0],
      type,
      km:       parseFloat(form.km) || null,
      duration: form.time || null,
      pace:     form.pace || null,
      rpe:      parseInt(form.rpe),
      notes:    form.notes || null,
      source:   'manual',
    })
    setSaving(false)
    onSaved?.()
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(12px)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:430, margin:'0 auto',
        background:'#181818', borderRadius:'24px 24px 0 0',
        padding:'20px 20px 40px', border:`1px solid ${T.border}`,
        maxHeight:'90vh', overflowY:'auto',
      }}>
        <div style={{ width:36, height:4, background:'#444', borderRadius:2, margin:'0 auto 18px' }}/>

        {/* ── STEP 1: LOG ─────────────────────────────────────────── */}
        {step === 'log' && (
          <>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:color+'22', border:`1px solid ${color}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                🏃
              </div>
              <div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em' }}>SESIÓN DE HOY</div>
                <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color }}>{label}</div>
                {planned?.km > 0 && <div style={{ fontSize:12, color:T.muted }}>Objetivo: {planned.km} km{planned.pace_target ? ` · ${planned.pace_target}/km` : ''}</div>}
              </div>
            </div>

            {/* Fields */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[
                ['km', 'DISTANCIA (km)', 'number', '12.5'],
                ['time', 'TIEMPO (h:mm:ss)', 'text', '1:05:30'],
                ['pace', 'RITMO MEDIO (/km)', 'text', '5:30'],
              ].map(([key, lbl, type, ph]) => (
                <div key={key} style={{ gridColumn: key === 'time' ? 'span 1' : 'span 1' }}>
                  <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>{lbl}</div>
                  <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph}
                    style={{ width:'100%', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 12px', color:T.text, fontSize:15, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 }}/>
                </div>
              ))}
              {/* RPE spans full */}
              <div style={{ gridColumn:'1 / -1' }}>
                <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>
                  ESFUERZO PERCIBIDO (RPE) — <span style={{ color, fontWeight:700 }}>{form.rpe}/10</span>
                  <span style={{ marginLeft:6, fontSize:9, color:T.muted }}>
                    {form.rpe <= 3 ? 'Muy fácil' : form.rpe <= 5 ? 'Moderado' : form.rpe <= 7 ? 'Duro' : form.rpe <= 9 ? 'Muy duro' : 'Máximo'}
                  </span>
                </div>
                <input type="range" min="1" max="10" value={form.rpe} onChange={e => set('rpe', e.target.value)}
                  style={{ width:'100%', accentColor:color }}/>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:T.muted }}>
                  <span>1</span><span>5</span><span>10</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>NOTAS (opcional)</div>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="¿Cómo te has sentido? ¿Alguna molestia? ¿Condiciones del tiempo?" rows={2}
                style={{ width:'100%', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 12px', color:T.text, fontSize:13, resize:'none', fontFamily:'inherit', lineHeight:1.5 }}/>
            </div>

            {/* CTA */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'13px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleAnalyze} disabled={!form.km} style={{
                flex:2, background: form.km ? color : T.surface,
                border:`1px solid ${form.km ? color : T.border}`,
                borderRadius:12, padding:'13px', color: form.km ? '#fff' : T.muted,
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, cursor: form.km ? 'pointer' : 'default',
              }}>
                Ver análisis del coach →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: REVIEW ──────────────────────────────────────── */}
        {step === 'review' && review && (
          <>
            {/* Score header */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em', marginBottom:12 }}>ANÁLISIS DEL COACH</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:14 }}>
                <ScoreRing score={review.score} color={color}/>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1.2, marginBottom:8 }}>{review.headline}</div>
                  <Stars count={review.stars}/>
                </div>
              </div>
            </div>

            {/* Analysis blocks */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {review.blocks.map((b, i) => (
                <div key={i} style={{
                  background: b.positive === true ? T.green+'0d' : b.positive === false ? '#FF440011' : T.surface,
                  border:`1px solid ${b.positive === true ? T.green+'33' : b.positive === false ? '#FF440033' : T.border}`,
                  borderRadius:12, padding:'12px 14px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:16 }}>{b.icon}</span>
                    <span style={{ fontSize:11, fontWeight:700, color: b.positive === true ? T.green : b.positive === false ? '#FF6644' : T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.06em' }}>{b.label.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{b.text}</div>
                </div>
              ))}
            </div>

            {/* Next tip */}
            <div style={{ background:`linear-gradient(135deg,#000A1A,#0d1117)`, border:'1px solid #002244', borderRadius:12, padding:'14px', marginBottom:18 }}>
              <div style={{ fontSize:11, color:T.blue, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:6 }}>🤖 SIGUIENTE PASO</div>
              <div style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{review.nextTip}</div>
            </div>

            {/* Save */}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep('log')} style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'13px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>
                ← Editar
              </button>
              <button onClick={handleSave} disabled={saving} style={{ flex:2, background:T.green, border:'none', borderRadius:12, padding:'13px', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, cursor:'pointer' }}>
                {saving ? 'Guardando...' : '✓ Guardar sesión'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
