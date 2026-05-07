import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useStrava } from '../hooks/useStrava'

const T = { bg:'#0A0A0A', card:'#161616', border:'#222', orange:'#FF5500', muted:'#666', text:'#F0F0F0', green:'#00E57A', surface:'#111' }

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{ width:44, height:26, borderRadius:13, cursor:'pointer', transition:'all 0.25s', background:on?T.orange:T.border, position:'relative' }}>
      <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:on?21:3, transition:'left 0.25s' }}/>
    </div>
  )
}

export default function Ajustes() {
  const { profile, signOut } = useAuth()
  const { connectStrava, syncActivities, syncing } = useStrava()
  const [stravaConnected, setStravaConnected] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [notifPanel, setNotifPanel] = useState(false)
  const [notifs, setNotifs] = useState({ daily:true, reminder:true, friends:true, weekly:true, tips:false })

  async function handleSync() {
    const count = await syncActivities()
    setSyncMsg(`${count} actividades importadas ✓`)
    setTimeout(() => setSyncMsg(''), 3000)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em' }}>PERFIL</div>
        <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Ajustes</div>
      </div>

      {/* Profile card */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:T.orange, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>
          {profile?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontSize:17, fontWeight:700 }}>{profile?.name || 'Atleta'}</div>
          <div style={{ fontSize:12, color:T.muted }}>{profile?.level} · {profile?.goal_time}</div>
        </div>
      </div>

      {/* Strava */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:14 }}>INTEGRACIÓN STRAVA</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:26 }}>🟠</span>
            <div>
              <div style={{ fontSize:14, fontWeight:600 }}>Strava</div>
              <div style={{ fontSize:11, color:T.muted }}>{stravaConnected ? 'Conectado' : 'No conectado'}</div>
            </div>
          </div>
          <button onClick={stravaConnected ? handleSync : connectStrava}
            style={{ background:stravaConnected?T.surface:T.orange, border:`1px solid ${stravaConnected?T.border:T.orange}`, borderRadius:8, padding:'7px 14px', color:stravaConnected?T.muted:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer' }}>
            {syncing ? 'Sincronizando...' : stravaConnected ? 'Sincronizar' : 'Conectar'}
          </button>
        </div>
        {syncMsg && <div style={{ marginTop:10, fontSize:12, color:T.green }}>{syncMsg}</div>}
        {!stravaConnected && (
          <div style={{ marginTop:12, fontSize:12, color:T.muted, lineHeight:1.5, background:T.surface, borderRadius:10, padding:'10px 12px' }}>
            Al conectar Strava, tus actividades de running se importarán automáticamente como sesiones en HalfPace.
          </div>
        )}
      </div>

      {/* Notifications */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: notifPanel?16:0 }}>
          <div style={{ fontSize:14, fontWeight:600 }}>🔔 Notificaciones</div>
          <Toggle on={notifPanel} onToggle={()=>setNotifPanel(!notifPanel)}/>
        </div>
        {notifPanel && [
          ['daily',   'Sesión del día',      'Resumen diario de tu entreno'],
          ['friends', 'Actividad de amigos', 'Cuando tus amigos entrenen'],
          ['weekly',  'Resumen semanal',     'Cada domingo por la noche'],
          ['tips',    'Consejos del coach',  'Tips de entrenamiento IA'],
        ].map(([key,title,sub]) => (
          <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>{title}</div>
              <div style={{ fontSize:11, color:T.muted }}>{sub}</div>
            </div>
            <Toggle on={notifs[key]} onToggle={()=>setNotifs(n=>({...n,[key]:!n[key]}))}/>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
        {[['🎯','Objetivo','Valencia HM · '+profile?.race_date],['📏','Unidades','Kilómetros · min/km'],['👥','Privacidad','Solo amigos']].map(([icon,title,sub],i)=>(
          <div key={title} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:i<2?`1px solid ${T.border}`:'none' }}>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:17 }}>{icon}</span>
              <div><div style={{ fontSize:13, fontWeight:500 }}>{title}</div><div style={{ fontSize:11, color:T.muted }}>{sub}</div></div>
            </div>
            <span style={{ color:T.muted }}>›</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={signOut} style={{ background:'transparent', border:`1px solid #FF444444`, borderRadius:12, padding:'13px', color:'#FF4444', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>
        Cerrar sesión
      </button>
    </div>
  )
}

// Note: To reschedule training days after onboarding,
// user can regenerate plan via "Regenerar Plan con IA" which
// goes through the full onboarding flow again including day selection.
