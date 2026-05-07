import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSessionReview } from '../hooks/useSessionReview'
import Dashboard from '../pages/Dashboard'
import Plan from '../pages/Plan'
import Progreso from '../pages/Progreso'
import Coach from '../pages/Coach'
import Amigos from '../pages/Amigos'
import Ajustes from '../pages/Ajustes'
import AutoReviewBanner from './AutoReviewBanner'

const T = { bg:'#0A0A0A', border:'#222', orange:'#FF5500', muted:'#666', text:'#F0F0F0', green:'#00E57A' }

const TABS = [
  { id:'dashboard', icon:'◈', label:'Inicio'   },
  { id:'plan',      icon:'▦', label:'Plan'     },
  { id:'progreso',  icon:'∿', label:'Progreso' },
  { id:'coach',     icon:'◐', label:'Coach'    },
  { id:'amigos',    icon:'◎', label:'Amigos'   },
  { id:'ajustes',   icon:'◉', label:'Ajustes'  },
]

export default function Shell() {
  const [active, setActive]   = useState('dashboard')
  const { review, markSeen }  = useSessionReview()

  const screens = {
    dashboard: <Dashboard setActive={setActive}/>,
    plan:      <Plan/>,
    progreso:  <Progreso/>,
    coach:     <Coach/>,
    amigos:    <Amigos/>,
    ajustes:   <Ajustes/>,
  }

  return (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', background:T.bg, position:'relative' }}>
      {/* Status bar */}
      <div style={{ height:44, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', fontSize:12, color:T.muted }}>
        <span style={{ fontWeight:600 }}>9:41</span>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          <span>●●●</span><span>WiFi</span><span>🔋</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding:'6px 18px 120px', overflowY:'auto' }}>
        {screens[active]}
      </div>

      {/* NavBar */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430,
        background:'rgba(10,10,10,0.96)', backdropFilter:'blur(20px)', borderTop:`1px solid ${T.border}`,
        display:'flex', justifyContent:'space-around', padding:'10px 0 18px', zIndex:100 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActive(t.id)} style={{
            background:'none', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color: active===t.id ? T.orange : T.muted, transition:'all 0.2s', padding:'0 6px',
            position:'relative',
          }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{t.icon}</span>
            <span style={{ fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em', fontWeight:600 }}>{t.label}</span>
            {active===t.id && <div style={{ width:4, height:4, borderRadius:'50%', background:T.orange, marginTop:-1 }}/>}
            {/* Red dot for unread review on dashboard tab */}
            {t.id === 'dashboard' && review && active !== 'dashboard' && (
              <div style={{ position:'absolute', top:0, right:4, width:8, height:8, borderRadius:'50%', background:T.orange, border:'2px solid #0A0A0A' }}/>
            )}
          </button>
        ))}
      </div>

      {/* Auto-review banner — appears as soon as Strava syncs */}
      {review && (
        <AutoReviewBanner
          review={review}
          onDismiss={() => markSeen(review.id)}
        />
      )}
    </div>
  )
}
