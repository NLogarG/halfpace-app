import { supabase } from './supabase'

export async function buildAthleteContext(userId, profile) {
  const today = new Date()

  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14)
  const { data: recentSessions } = await supabase
    .from('sessions').select('*').eq('user_id', userId)
    .gte('date', twoWeeksAgo.toISOString().split('T')[0]).order('date', { ascending: false })

  const eightWeeksAgo = new Date(today); eightWeeksAgo.setDate(today.getDate() - 56)
  const { data: allSessions } = await supabase
    .from('sessions').select('date,km,pace,hr_avg,type').eq('user_id', userId)
    .gte('date', eightWeeksAgo.toISOString().split('T')[0]).order('date', { ascending: false })

  const dayOfWeek = (today.getDay() + 6) % 7
  const planStart = profile?.race_date
    ? new Date(new Date(profile.race_date).getTime() - 84 * 24 * 3600 * 1000) : new Date()
  const weekNumber = Math.max(1, Math.min(12,
    Math.ceil((today - planStart) / (7 * 24 * 3600 * 1000))
  ))
  const { data: todayPlan } = await supabase.from('plans').select('*')
    .eq('user_id', userId).eq('week', weekNumber).eq('day_of_week', dayOfWeek).single()

  const { data: records } = await supabase.from('records').select('*').eq('user_id', userId)

  // Week km
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const weekKm = (recentSessions || [])
    .filter(s => new Date(s.date) >= weekStart)
    .reduce((s, x) => s + (x.km || 0), 0)

  const lastSession = (recentSessions || [])[0]

  // Avg pace
  const paceSessions = (allSessions || []).slice(0, 20).filter(s => s.pace)
  const avgPaceSecs = paceSessions.length > 0
    ? paceSessions.reduce((sum, s) => {
        const [m, sec] = s.pace.split(':').map(Number)
        return sum + m * 60 + (sec || 0)
      }, 0) / paceSessions.length : null
  const avgPaceStr = avgPaceSecs
    ? `${Math.floor(avgPaceSecs / 60)}:${String(Math.round(avgPaceSecs % 60)).padStart(2, '0')}/km` : null

  // Fatigue
  const last7Km = (recentSessions || [])
    .filter(s => new Date(s.date) >= new Date(today.getTime() - 7 * 24 * 3600 * 1000))
    .reduce((s, x) => s + (x.km || 0), 0)
  const fatigue = last7Km > 50 ? 'alta' : last7Km > 30 ? 'moderada' : 'baja'

  const daysToRace = profile?.race_date
    ? Math.max(0, Math.ceil((new Date(profile.race_date) - today) / (24 * 3600 * 1000))) : null

  const recordsText = records?.length > 0
    ? records.map(r => {
        const m = Math.floor(r.time_secs / 60), s = r.time_secs % 60
        return `${r.distance}: ${m}:${String(s).padStart(2,'0')}`
      }).join(', ') : null

  const TYPE_ES = { easy:'rodaje suave', medium:'rodaje medio', long:'tirada larga', interval:'intervalos', tempo:'tempo', rest:'descanso', race:'carrera' }
  const recentSummary = (recentSessions || []).slice(0, 3)
    .map(s => `${new Date(s.date).toLocaleDateString('es-ES',{weekday:'long'})} ${TYPE_ES[s.type]||s.type}${s.km?` ${s.km}km`:''}${s.pace?` a ${s.pace}/km`:''}${s.hr_avg?` FC${s.hr_avg}`:''}`)
    .join(' | ')

  return {
    name: profile?.name || 'Atleta',
    level: profile?.level || 'intermedio',
    goal_time: profile?.goal_time || 'Sub 2:00h',
    race_date: profile?.race_date || null,
    current_week: weekNumber,
    days_to_race: daysToRace,
    week_km: Math.round(weekKm * 10) / 10,
    fatigue,
    avg_pace: avgPaceStr,
    today_plan: todayPlan || null,
    last_session: lastSession || null,
    recent_summary: recentSummary || 'Sin actividad reciente',
    records: recordsText,
  }
}

export function buildSystemPrompt(ctx) {
  const raceInfo = ctx.days_to_race !== null
    ? `Carrera en ${ctx.days_to_race} días (${ctx.race_date}).` : 'Sin carrera configurada.'
  const todayInfo = ctx.today_plan
    ? `Hoy toca: ${ctx.today_plan.type}${ctx.today_plan.km ? ` ${ctx.today_plan.km}km` : ''}${ctx.today_plan.pace_target ? ` a ${ctx.today_plan.pace_target}/km` : ''}.`
    : 'Sin sesión planificada hoy.'
  const lastInfo = ctx.last_session
    ? `Último entreno: ${ctx.last_session.type} ${ctx.last_session.km || ''}km${ctx.last_session.pace ? ` a ${ctx.last_session.pace}/km` : ''}${ctx.last_session.hr_avg ? ` FC${ctx.last_session.hr_avg}` : ''}.`
    : 'Sin entrenos recientes.'

  return `Eres el entrenador personal de running de ${ctx.name}. Experto en media maratón. Hablas español, directo, cercano, motivador. Máximo 3-4 frases salvo que pidan análisis.

ATLETA: ${ctx.name}, nivel ${ctx.level}, objetivo ${ctx.goal_time}. ${raceInfo} Semana ${ctx.current_week}/12. ${ctx.week_km}km esta semana, fatiga ${ctx.fatigue}. Ritmo reciente: ${ctx.avg_pace || 'sin datos'}. ${ctx.records ? `Récords: ${ctx.records}.` : ''}

HOY: ${todayInfo} ${lastInfo} Historial: ${ctx.recent_summary}.

REGLAS: Llama por su nombre ocasionalmente. Lesión → descanso + fisio si persiste. Fatiga alta → sugiere reducir carga. Responde con datos concretos del contexto, no genéricos.`
}
