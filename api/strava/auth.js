// Vercel Serverless Function
// POST /api/strava/auth
// Exchanges OAuth code for tokens and stores them securely in Supabase

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role = full access, server only
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { code, userId } = req.body

  // Exchange code for tokens with Strava
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) return res.status(400).json({ error: 'Strava token exchange failed' })

  const tokens = await tokenRes.json()

  // Save tokens in Supabase (server-side only, never exposed to client)
  await supabase.from('strava_tokens').upsert({
    user_id:       userId,
    access_token:  tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at:    tokens.expires_at,
    athlete_id:    tokens.athlete.id,
    updated_at:    new Date().toISOString(),
  })

  res.status(200).json({ ok: true, athlete: tokens.athlete.firstname })
}
