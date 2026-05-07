import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStrava } from '../hooks/useStrava'

export default function StravaCallbackPage() {
  const { user }          = useAuth()
  const { handleCallback } = useStrava()
  const navigate          = useNavigate()
  const [status, setStatus] = useState('Conectando con Strava...')

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code || !user) { navigate('/'); return }
    handleCallback(code)
      .then(() => { setStatus('¡Strava conectado! ✓'); setTimeout(() => navigate('/'), 2000) })
      .catch(() => { setStatus('Error al conectar. Inténtalo de nuevo.'); setTimeout(() => navigate('/'), 3000) })
  }, [user])

  return (
    <div style={{ height:'100vh', background:'#0A0A0A', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:48 }}>🟠</div>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:800 }}>{status}</div>
    </div>
  )
}
