// Banner that pops up automatically when Strava syncs a new activity
// and the webhook has generated the analysis
import { useState } from 'react'

const T = {
  bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222',
  orange:'#FF5500', orangeMid:'#FF550055', muted:'#666',
  text:'#F0F0F0', green:'#00E57A', blue:'#0099FF',
}

function Stars({ count }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:20, filter: i <= count ? 'none' : 'grayscale(1) opacity(0.2)' }}>⭐</span>
      ))}
    </div>
  )
}

function ScoreRing({ score, color }) {
  const r = 30, circ = 2 * Math.PI * r, dash = (score / 100) * circ
  return (
    <div style={{ position:'relative', width:72, height:72, flexShrink:0 }}>
      <svg width="72" height="72" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke={T.border} strokeWidth="5"/>
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:18, fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", color, lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:8, color:T.muted }}>/ 100</span>
      </div>
    </div>
  )
}

export default function AutoReviewBanner({ review, onDismiss }) {
  const [expanded, setExpanded] = useState(false)

  const scoreColor = review.score >= 80 ? T.green : review.score >= 60 ? T.orange : '#FF4444'

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:400,
      background:'rgba(0,0,0,0.88)', backdropFilter:'blur(12px)',
      display:'flex', alignItems:'flex-end',
    }} onClick={!expanded ? onDismiss : undefined}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:430, margin:'0 auto',
        background:'#181818', borderRadius:'24px 24px 0 0',
        padding:'20px 20px 40px', border:`1px solid ${T.border}`,
        maxHeight:'88vh', overflowY:'auto',
      }}>
        <div style={{ width:36, height:4, background:'#444', borderRadius:2, margin:'0 auto 18px' }}/>

        {/* Strava badge */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <span style={{ fontSize:18 }}>🟠</span>
          <span style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em' }}>
            STRAVA SINCRONIZADO — ANÁLISIS AUTOMÁTICO
          </span>
        </div>

        {/* Score + headline */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <ScoreRing score={review.score} color={scoreColor}/>
          <div>
            <div style={{ fontSize:19, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1.2, marginBottom:6 }}>
              {review.headline}
            </div>
            <Stars count={review.stars}/>
          </div>
        </div>

        {/* Session info */}
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', marginBottom:14, display:'flex', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700 }}>{review.session_type}</div>
            <div style={{ fontSize:11, color:T.muted }}>{new Date(review.date).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</div>
          </div>
          <div style={{ fontSize:22, fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", color:scoreColor }}>
            {review.score}<span style={{ fontSize:12, color:T.muted }}>/100</span>
          </div>
        </div>

        {/* Collapsed: first block only + expand button */}
        {!expanded && (
          <>
            {review.blocks?.[0] && (
              <div style={{ background: review.blocks[0].positive === true ? T.green+'0d' : review.blocks[0].positive === false ? '#FF440011' : T.surface,
                border:`1px solid ${review.blocks[0].positive === true ? T.green+'33' : review.blocks[0].positive === false ? '#FF440033' : T.border}`,
                borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:15 }}>{review.blocks[0].icon}</span>
                  <span style={{ fontSize:10, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.06em',
                    color: review.blocks[0].positive === true ? T.green : review.blocks[0].positive === false ? '#FF6644' : T.muted }}>
                    {review.blocks[0].label?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{review.blocks[0].text}</div>
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onDismiss} style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>
                Cerrar
              </button>
              <button onClick={() => setExpanded(true)} style={{ flex:2, background:T.orange, border:'none', borderRadius:12, padding:'12px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, cursor:'pointer' }}>
                Ver análisis completo →
              </button>
            </div>
          </>
        )}

        {/* Expanded: all blocks */}
        {expanded && (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
              {review.blocks?.map((b, i) => (
                <div key={i} style={{
                  background: b.positive === true ? T.green+'0d' : b.positive === false ? '#FF440011' : T.surface,
                  border:`1px solid ${b.positive === true ? T.green+'33' : b.positive === false ? '#FF440033' : T.border}`,
                  borderRadius:12, padding:'12px 14px',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:15 }}>{b.icon}</span>
                    <span style={{ fontSize:10, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.06em',
                      color: b.positive === true ? T.green : b.positive === false ? '#FF6644' : T.muted }}>
                      {b.label?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{b.text}</div>
                </div>
              ))}
            </div>

            {/* Next tip */}
            <div style={{ background:'linear-gradient(135deg,#000A1A,#0d1117)', border:'1px solid #002244', borderRadius:12, padding:14, marginBottom:16 }}>
              <div style={{ fontSize:11, color:T.blue, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:6 }}>🤖 SIGUIENTE PASO</div>
              <div style={{ fontSize:13, color:T.text, lineHeight:1.55 }}>{review.next_tip}</div>
            </div>

            <button onClick={onDismiss} style={{ width:'100%', background:T.green, border:'none', borderRadius:12, padding:'14px', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, cursor:'pointer' }}>
              ✓ Entendido
            </button>
          </>
        )}
      </div>
    </div>
  )
}
