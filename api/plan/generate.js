import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, level, goalTime, trainDays, trainingDays, longRunDay, raceDate } = req.body

  // Build human-readable day schedule for Claude
  const DAYS_ES = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo']
  const trainingDayNames = (trainingDays || [1,3,5,6]).map(d => DAYS_ES[d]).join(', ')
  const longRunDayName   = DAYS_ES[longRunDay ?? 5]
  const restDays         = [0,1,2,3,4,5,6]
    .filter(d => !(trainingDays || [1,3,5,6]).includes(d))
    .map(d => DAYS_ES[d]).join(', ')

  const prompt = `Genera un plan de entrenamiento de 12 semanas para media maratón en formato JSON.

Perfil del atleta:
- Nivel: ${level}
- Objetivo: ${goalTime}
- Días de entrenamiento: ${trainingDayNames}
- Día de la tirada larga: ${longRunDayName} (OBLIGATORIO — siempre en este día)
- Días de descanso: ${restDays}
- Fecha de carrera: ${raceDate}

Reglas importantes:
1. La tirada larga SIEMPRE va en ${longRunDayName} (day_of_week: ${longRunDay ?? 5})
2. Los días de descanso son SIEMPRE: ${restDays}
3. Nunca pongas dos sesiones duras (intervalos, tempo, tirada larga) consecutivas
4. La semana 12 es semana de carrera — volumen muy reducido
5. Cada 4ª semana es semana de recuperación con -30% volumen
6. Adapta el ritmo objetivo al nivel: ${level} con meta ${goalTime}

Devuelve SOLO un array JSON válido con exactamente 84 objetos (12 semanas × 7 días):
{ week: número, day_of_week: 0-6 (0=lunes), type: "easy"|"medium"|"long"|"interval"|"tempo"|"rest"|"race", km: número o 0, pace_target: "mm:ss" o null, zone: "Z1-Z2" etc o null, notes: string con descripción breve o null }

Sin texto adicional, sin markdown, solo el array JSON.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data     = await response.json()
    const raw      = data.content[0].text
    const clean    = raw.replace(/```json|```/g, '').trim()
    const sessions = JSON.parse(clean)

    // Validate and force correct rest days
    const validated = sessions.map(s => {
      const isTrainingDay = (trainingDays || [1,3,5,6]).includes(s.day_of_week)
      if (!isTrainingDay && s.type !== 'rest') {
        return { ...s, type: 'rest', km: 0, pace_target: null, zone: null, notes: 'Descanso' }
      }
      return s
    })

    await supabase.from('plans').delete().eq('user_id', userId)
    const { error } = await supabase.from('plans').insert(
      validated.map(s => ({ ...s, user_id: userId }))
    )

    if (error) throw error
    res.status(200).json({ ok: true, sessions: validated.length })

  } catch (err) {
    console.error('Plan generation error:', err)
    res.status(500).json({ error: err.message })
  }
}
