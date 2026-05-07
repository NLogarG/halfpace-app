import { useState } from 'react'
import { useAuth } from './useAuth'

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID
const REDIRECT_URI     = `${window.location.origin}/strava/callback`

export function useStrava() {
  const { user } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [connected, setConnected] = useState(false)

  // Step 1: Redirect user to Strava OAuth
  function connectStrava() {
    const scope  = 'activity:read_all'
    const params = new URLSearchParams({
      client_id:     STRAVA_CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      approval_prompt: 'auto',
      scope,
    })
    window.location.href = `https://www.strava.com/oauth/authorize?${params}`
  }

  // Step 2: Called from /strava/callback page after OAuth redirect
  async function handleCallback(code) {
    const res = await fetch('/api/strava/auth', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId: user.id }),
    })
    if (!res.ok) throw new Error('Strava auth failed')
    setConnected(true)
  }

  // Step 3: Sync activities from Strava
  async function syncActivities() {
    setSyncing(true)
    try {
      const res = await fetch('/api/strava/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      return data.synced // number of activities synced
    } finally {
      setSyncing(false)
    }
  }

  return { connectStrava, handleCallback, syncActivities, syncing, connected, setConnected }
}
