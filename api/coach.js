export const maxDuration = 30

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages, userContext } = req.body

  const system = `Eres un entrenador experto en running y media maratón llamado "Coach HalfPace".
Respondes en español, de forma cercana, motivadora y concisa (máximo 3-4 frases por respuesta).
Atleta: ${userContext.name}, nivel ${userContext.level}, objetivo ${userContext.goal_time}.
Carrera: ${userContext.race_date}. Semana ${userContext.current_week} de 12.
${userContext.records ? `Récords: ${userContext.records}.` : ''}
Da consejos prácticos y específicos. Si hay posible lesión, recomienda descanso o un profesional.`

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 300,
          temperature: 0.7,
          messages: [
            { role: 'system', content: system },
            ...messages.map((m) => ({ role: m.role, content: m.content }))
          ]
        })
      }
    )

    if (!response.ok) {
      const err = await response.json()
      console.error('Groq error:', err)
      return res.status(500).json({ error: 'Groq API error', details: err })
    }

    const data = await response.json()
    const reply =
      data.choices?.[0]?.message?.content ||
      'No pude procesar tu pregunta. Intenta de nuevo.'

    res.status(200).json({
      content: [{ type: 'text', text: reply }]
    })
  } catch (err) {
    console.error('Coach error:', err)
    res.status(500).json({ error: err.message })
  }
}
