// Vercel Serverless Function
// POST /api/strava/sync
// Fetches recent Strava activities and saves them as sessions in Supabase

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function refreshTokenIfNeeded(tokenRow) {
  if (Date.now() / 1000 < tokenRow.expires_at - 300) return tokenRow.access_token

  const res = await fetch('https://www.strava.com/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: tokenRow.refresh_token,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  await supabase.from('strava_tokens').update({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    data.expires_at,
    updated_at:    new Date().toISOString(),
  }).eq('user_id', tokenRow.user_id)

  return data.access_token
}

function classifyActivity(stravaActivity) {
  const km = stravaActivity.distance / 1000
  const name = stravaActivity.name.toLowerCase()
  if (km >= 15)                      return 'long'
  if (name.includes('interval') || name.includes('series')) return 'interval'
  if (name.includes('tempo') || name.includes('umbral'))    return 'tempo'
  if (km >= 10)                      return 'medium'
  return 'easy'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId } = req.body

  // Get stored tokens
  const { data: tokenRow } = await supabase
    .from('strava_tokens').select('*').eq('user_id', userId).single()
  if (!tokenRow) return res.status(400).json({ error: 'Strava not connected' })

  const accessToken = await refreshTokenIfNeeded(tokenRow)

  // Fetch last 30 days of activities
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600
  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${since}&per_page=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const activities = await activitiesRes.json()
  const runs = activities.filter(a => a.type === 'Run')

  let synced = 0
  for (const act of runs) {
    const km    = act.distance / 1000
    const secs  = act.moving_time
    const paceSecPerKm = km > 0 ? secs / km : 0
    const paceMin = Math.floor(paceSecPerKm / 60)
    const paceSec = Math.round(paceSecPerKm % 60)

    // Upsert so re-syncing is idempotent
    const { error } = await supabase.from('sessions').upsert({
      user_id:    userId,
      date:       act.start_date_local.split('T')[0],
      type:       classifyActivity(act),
      km:         Math.round(km * 10) / 10,
      duration:   `${Math.floor(secs/3600)}h ${Math.floor((secs%3600)/60)}min`,
      pace:       `${paceMin}:${String(paceSec).padStart(2,'0')}`,
      hr_avg:     act.average_heartrate || null,
      source:     'strava',
      strava_id:  act.id,
      notes:      act.name,
    }, { onConflict: 'strava_id' })

    if (!error) synced++
  }

  res.status(200).json({ synced, total: runs.length })
}
