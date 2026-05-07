// ─── Strava Webhook Handler ───────────────────────────────────────────────
// Vercel Serverless Function — POST /api/strava/webhook
//
// Two jobs:
//   GET  → Strava subscription verification challenge (one-time setup)
//   POST → Process incoming activity event in real time
//
// Setup (one time, run once after deploy):
//   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
//     -F client_id=YOUR_ID \
//     -F client_secret=YOUR_SECRET \
//     -F callback_url=https://YOUR_APP.vercel.app/api/strava/webhook \
//     -F verify_token=halfpace_webhook_token

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Helpers ───────────────────────────────────────────────────────────────
async function refreshTokenIfNeeded(tokenRow) {
  if (Date.now() / 1000 < tokenRow.expires_at - 300) return tokenRow.access_token
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: tokenRow.refresh_token, grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  await supabase.from('strava_tokens').update({
    access_token: data.access_token, refresh_token: data.refresh_token,
    expires_at: data.expires_at, updated_at: new Date().toISOString(),
  }).eq('user_id', tokenRow.user_id)
  return data.access_token
}

function classifyRun(act) {
  const km   = act.distance / 1000
  const name = (act.name || '').toLowerCase()
  if (km >= 16)                                                  return 'long'
  if (name.includes('interval') || name.includes('series') || name.includes('repeticion')) return 'interval'
  if (name.includes('tempo') || name.includes('umbral'))         return 'tempo'
  if (km >= 10)                                                  return 'medium'
  return 'easy'
}

// ── Auto-analysis engine (mirrors SessionReview logic, server-side) ────────
function autoAnalyze({ planned, actual }) {
  const type     = planned?.type || actual.type || 'easy'
  const planKm   = planned?.km || 0
  const actKm    = actual.km || 0
  const actRpe   = null  // no RPE from Strava — we skip that check
  const kmDiff   = planKm > 0 ? ((actKm - planKm) / planKm) * 100 : 0

  function paceToSecs(p) {
    if (!p) return null
    const parts = p.split(':'); return parseInt(parts[0]) * 60 + parseInt(parts[1] || 0)
  }
  const planPaceSecs = paceToSecs(planned?.pace_target)
  const actPaceSecs  = actual.pace_secs_per_km || null
  const paceDiff     = planPaceSecs && actPaceSecs ? actPaceSecs - planPaceSecs : null

  let score = 100
  if (kmDiff < -15) score -= 20
  else if (kmDiff < -8) score -= 10
  else if (kmDiff > 20) score -= 5
  if (paceDiff !== null && ['easy','medium','long'].includes(type)) {
    if (paceDiff < -15) score -= 15
    else if (paceDiff < -8) score -= 8
  }
  score = Math.max(40, Math.min(100, score))
  const stars = score >= 90 ? 5 : score >= 78 ? 4 : score >= 65 ? 3 : score >= 50 ? 2 : 1

  const SESSION_LABELS = { easy:'Rodaje suave', medium:'Rodaje medio', long:'Tirada larga', interval:'Intervalos', tempo:'Tempo', race:'¡Carrera!' }

  const headlines = {
    5: '¡Sesión perfecta! 🔥', 4: 'Muy buen entreno 👏',
    3: 'Entreno completado ✅', 2: 'Entreno irregular ⚠️', 1: 'Sesión muy alejada del plan 📋',
  }

  const blocks = []

  // Distance
  if (planKm > 0) {
    if (Math.abs(kmDiff) <= 5)
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm.toFixed(1)} km — exactamente lo previsto. Perfecto.`, positive:true })
    else if (kmDiff < -15)
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm.toFixed(1)} km vs ${planKm} km planificados. Has cortado bastante. Si fue por molestia física, bien hecho. Si fue por fatiga, revisa la carga de esta semana.`, positive:false })
    else if (kmDiff > 15)
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm.toFixed(1)} km vs ${planKm} km planificados. Ojo con pasarte — el exceso de volumen es la principal causa de lesiones.`, positive:false })
    else
      blocks.push({ icon:'📏', label:'Distancia', text:`${actKm.toFixed(1)} km — dentro del rango previsto (${planKm} km). Bien.`, positive:true })
  }

  // Pace
  if (paceDiff !== null) {
    const paceStr = `${Math.floor(actPaceSecs/60)}:${String(actPaceSecs%60).padStart(2,'0')}/km`
    if (Math.abs(paceDiff) <= 10)
      blocks.push({ icon:'⚡', label:'Ritmo', text:`${paceStr} — muy cerca del objetivo (${planned.pace_target}/km). Excelente control.`, positive:true })
    else if (paceDiff < -15)
      blocks.push({ icon:'⚡', label:'Ritmo', text:`${paceStr} — ${Math.abs(paceDiff)}s/km más rápido que el objetivo. Para este tipo de sesión, ir más lento es parte del plan.`, positive:false })
    else if (paceDiff > 20)
      blocks.push({ icon:'⚡', label:'Ritmo', text:`${paceStr} — algo más lento que el objetivo (${planned.pace_target}/km). Puede ser por condiciones del día. Sin problema si el esfuerzo fue correcto.`, positive:null })
    else
      blocks.push({ icon:'⚡', label:'Ritmo', text:`${paceStr} — dentro del rango objetivo. Buen trabajo.`, positive:true })
  }

  // FC if available
  if (actual.hr_avg) {
    const hrRanges = { easy:[130,150], medium:[145,165], long:[140,160], interval:[165,185], tempo:[158,175] }
    const [hrMin, hrMax] = hrRanges[type] || [0, 999]
    if (actual.hr_avg < hrMin)
      blocks.push({ icon:'❤️', label:'Frecuencia cardíaca', text:`FC media ${actual.hr_avg} ppm — por debajo de lo esperado para este tipo de sesión. Podrías haber dado un poco más.`, positive:null })
    else if (actual.hr_avg > hrMax)
      blocks.push({ icon:'❤️', label:'Frecuencia cardíaca', text:`FC media ${actual.hr_avg} ppm — algo elevada. Puede ser calor, deshidratación o fatiga acumulada. Descansa bien hoy.`, positive:false })
    else
      blocks.push({ icon:'❤️', label:'Frecuencia cardíaca', text:`FC media ${actual.hr_avg} ppm — en el rango correcto para ${SESSION_LABELS[type]?.toLowerCase() || type}. Bien controlado.`, positive:true })
  }

  const nextTips = {
    easy:     'Recupera bien — come algo con proteína e hidrádate. El próximo entreno de calidad será más efectivo gracias a este.',
    medium:   'Buen trabajo de base. Come carbohidratos en las próximas 2h para recuperar el glucógeno muscular.',
    long:     'La tirada larga es la reina del plan. Hoy toca comer bien, estirar suavemente y descansar. Es parte del entrenamiento.',
    interval: 'Las adaptaciones de los intervalos ocurren en las 24-48h de recuperación. Hoy y mañana son tan importantes como la sesión.',
    tempo:    'Excelente trabajo de umbral. Tu ritmo de carrera mejora con cada tempo bien ejecutado.',
    race:     '¡Lo conseguiste! La recuperación post-carrera lleva 2-3 semanas. Esta semana: solo rodajes muy suaves si te apetece.',
  }

  return {
    score, stars,
    headline: headlines[stars],
    blocks,
    nextTip: nextTips[type] || 'Buen trabajo. Descansa bien y a por el siguiente.',
    sessionType: SESSION_LABELS[type] || type,
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // ── GET: Strava subscription verification ────────────────────────────────
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query
    if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      return res.status(200).json({ 'hub.challenge': challenge })
    }
    return res.status(403).end()
  }

  // ── POST: incoming activity event ────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).end()

  const { object_type, aspect_type, object_id, owner_id } = req.body

  // Only process new runs
  if (object_type !== 'activity' || aspect_type !== 'create') return res.status(200).end()

  try {
    // 1. Find user by Strava athlete ID
    const { data: tokenRow } = await supabase
      .from('strava_tokens').select('*').eq('athlete_id', owner_id).single()
    if (!tokenRow) return res.status(200).end()

    const userId      = tokenRow.user_id
    const accessToken = await refreshTokenIfNeeded(tokenRow)

    // 2. Fetch full activity from Strava API
    const actRes = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const act = await actRes.json()

    // Only process runs
    if (act.type !== 'Run' && act.sport_type !== 'Run') return res.status(200).end()

    const km            = act.distance / 1000
    const secs          = act.moving_time
    const paceSecs      = km > 0 ? Math.round(secs / km) : 0
    const paceStr       = `${Math.floor(paceSecs/60)}:${String(paceSecs%60).padStart(2,'0')}`
    const actDate       = act.start_date_local.split('T')[0]
    const runType       = classifyRun(act)

    // 3. Save session in Supabase
    await supabase.from('sessions').upsert({
      user_id:    userId,
      date:       actDate,
      type:       runType,
      km:         Math.round(km * 10) / 10,
      duration:   `${Math.floor(secs/3600)}h ${Math.floor((secs%3600)/60)}min`,
      pace:       paceStr,
      hr_avg:     act.average_heartrate || null,
      source:     'strava',
      strava_id:  act.id,
      notes:      act.name,
    }, { onConflict: 'strava_id' })

    // 4. Find planned session for that day
    const { data: profile } = await supabase
      .from('profiles').select('race_date').eq('id', userId).single()

    let plannedSession = null
    if (profile?.race_date) {
      const planStart  = new Date(new Date(profile.race_date).getTime() - 84*24*3600*1000)
      const runDay     = new Date(actDate)
      const diffDays   = Math.floor((runDay - planStart) / (24*3600*1000))
      if (diffDays >= 0 && diffDays < 84) {
        const week = Math.floor(diffDays / 7) + 1
        const dow  = diffDays % 7
        const { data: planned } = await supabase
          .from('plans').select('*').eq('user_id', userId).eq('week', week).eq('day_of_week', dow).single()
        plannedSession = planned
      }
    }

    // 5. Generate auto-analysis
    const analysis = autoAnalyze({
      planned: plannedSession,
      actual: { km: Math.round(km*10)/10, pace_secs_per_km: paceSecs, hr_avg: act.average_heartrate, type: runType },
    })

    // 6. Save review in Supabase so app shows it when opened
    await supabase.from('session_reviews').upsert({
      user_id:    userId,
      date:       actDate,
      strava_id:  act.id,
      score:      analysis.score,
      stars:      analysis.stars,
      headline:   analysis.headline,
      blocks:     JSON.stringify(analysis.blocks),
      next_tip:   analysis.nextTip,
      session_type: analysis.sessionType,
      created_at: new Date().toISOString(),
    }, { onConflict: 'strava_id' })

    // 7. Send push notification (if user has subscribed via OneSignal)
    if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY) {
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}` },
        body: JSON.stringify({
          app_id:             process.env.ONESIGNAL_APP_ID,
          filters:            [{ field:'tag', key:'user_id', relation:'=', value: userId }],
          headings:           { en: `${analysis.stars}⭐ ${analysis.headline}` },
          contents:           { en: `${analysis.sessionType} · ${Math.round(km*10)/10} km · Puntuación ${analysis.score}/100` },
          url:                `${process.env.VITE_APP_URL}/?review=${act.id}`,
          ios_interruption_level: 'active',
        }),
      })
    }

    res.status(200).json({ ok: true, score: analysis.score, stars: analysis.stars })

  } catch (err) {
    console.error('Webhook error:', err)
    res.status(200).end() // Always 200 to Strava or it retries
  }
}
