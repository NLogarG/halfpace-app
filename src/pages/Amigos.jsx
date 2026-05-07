import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const T = { bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222', orange:'#FF5500', orangeDim:'#FF550022', muted:'#666', text:'#F0F0F0', green:'#00E57A', blue:'#0099FF' }

const MEMBER_COLORS = ['#FF5500','#0099FF','#00E57A','#CC44FF','#FFB800','#FF2266']

export default function Amigos() {
  const { user, profile } = useAuth()
  const [members,     setMembers]     = useState([])
  const [group,       setGroup]       = useState(null)
  const [feed,        setFeed]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showInvite,  setShowInvite]  = useState(false)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => { if (profile?.id) fetchData() }, [profile])

  async function fetchData() {
    // Find group user belongs to
    const { data: membership } = await supabase
      .from('group_members').select('group_id').eq('user_id', user.id).single()

    if (!membership) { setLoading(false); return }

    const { data: grp } = await supabase
      .from('groups').select('*').eq('id', membership.group_id).single()
    setGroup(grp)

    // Get all members with their weekly km
    const { data: groupMembers } = await supabase
      .from('group_members')
      .select('user_id, profiles(id, name)')
      .eq('group_id', membership.group_id)

    if (groupMembers) {
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const weekStr   = weekStart.toISOString().split('T')[0]
      const enriched  = await Promise.all(groupMembers.map(async (m, idx) => {
        const { data: sessions } = await supabase
          .from('sessions').select('km, pace, date')
          .eq('user_id', m.user_id).gte('date', weekStr)
        const km      = sessions?.reduce((s, x) => s + (x.km || 0), 0) || 0
        const paces   = sessions?.filter(s => s.pace).map(s => s.pace) || []
        const lastPace = paces[paces.length - 1] || '—'
        return {
          id:       m.user_id,
          name:     m.profiles?.name || 'Atleta',
          km:       Math.round(km * 10) / 10,
          pace:     lastPace,
          isMe:     m.user_id === user.id,
          color:    MEMBER_COLORS[idx % MEMBER_COLORS.length],
          sessions: sessions?.length || 0,
        }
      }))
      setMembers(enriched.sort((a, b) => b.km - a.km))

      // Activity feed — last 10 sessions from all members
      const { data: recentSessions } = await supabase
        .from('sessions').select('user_id, date, type, km, source')
        .in('user_id', groupMembers.map(m => m.user_id))
        .order('date', { ascending:false }).limit(10)
      if (recentSessions) {
        const SESSION_LABELS = { easy:'completó un rodaje suave', medium:'completó un rodaje medio', long:'completó una tirada larga', interval:'completó intervalos', tempo:'completó un tempo', race:'¡completó la carrera!' }
        const EMOJIS = { easy:'🟢', medium:'🔵', long:'🔴', interval:'🟡', tempo:'🟣', race:'🏁' }
        setFeed(recentSessions.map(s => ({
          ...s,
          name:   groupMembers.find(m => m.user_id === s.user_id)?.profiles?.name || 'Atleta',
          label:  SESSION_LABELS[s.type] || 'registró una sesión',
          emoji:  EMOJIS[s.type] || '🏃',
          color:  MEMBER_COLORS[groupMembers.findIndex(m => m.user_id === s.user_id) % MEMBER_COLORS.length],
          timeAgo: (() => {
            const diff = (new Date() - new Date(s.date)) / (1000*3600)
            return diff < 1 ? 'hace <1h' : diff < 24 ? `hace ${Math.round(diff)}h` : `hace ${Math.floor(diff/24)}d`
          })(),
        })))
      }
    }
    setLoading(false)
  }

  async function createGroup() {
    const { data: grp } = await supabase.from('groups').insert({ name:`Grupo de ${profile.name}`, created_by: user.id }).select().single()
    await supabase.from('group_members').insert({ group_id: grp.id, user_id: user.id })
    setGroup(grp)
    fetchData()
  }

  async function joinGroup(code) {
    const { data: grp } = await supabase.from('groups').select('*').eq('invite_code', code.toUpperCase()).single()
    if (!grp) return alert('Código no válido')
    await supabase.from('group_members').insert({ group_id: grp.id, user_id: user.id })
    setGroup(grp); fetchData()
  }

  function copyInviteLink() {
    const link = `${window.location.origin}?join=${group?.invite_code}`
    navigator.clipboard?.writeText(link)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${T.orange}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // No group yet
  if (!group) return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em' }}>COMUNIDAD</div>
        <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Amigos</div>
      </div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Aún no tienes grupo</div>
        <div style={{ fontSize:13, color:T.muted, marginBottom:20, lineHeight:1.5 }}>Crea un grupo e invita a tus amigos, o únete al grupo de alguien con un código de invitación.</div>
        <button onClick={createGroup} style={{ width:'100%', background:T.orange, border:'none', borderRadius:12, padding:'14px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:15, cursor:'pointer', marginBottom:10 }}>
          Crear grupo
        </button>
        <JoinGroupInput onJoin={joinGroup}/>
      </div>
    </div>
  )

  const maxKm = Math.max(...members.map(m => m.km), 1)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.15em' }}>ESTA SEMANA</div>
          <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Amigos</div>
        </div>
        <button onClick={()=>setShowInvite(true)} style={{ background:T.orange, border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>+ Invitar</button>
      </div>

      {/* Ranking */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
        <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:14 }}>🏆 RANKING SEMANAL — KM</div>
        {members.map((m, i) => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<members.length-1?`1px solid ${T.border}`:'none', background:m.isMe?T.orangeDim:'transparent', borderRadius:m.isMe?10:0, paddingLeft:m.isMe?8:0 }}>
            <div style={{ width:22, fontSize:15, textAlign:'center' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}</div>
            <div style={{ width:34, height:34, borderRadius:'50%', background:m.color+'33', border:`2px solid ${m.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:m.color, fontFamily:"'Barlow Condensed',sans-serif" }}>
              {m.name[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{m.name}{m.isMe ? ' (tú)' : ''}</div>
              <div style={{ height:3, background:T.border, borderRadius:2, marginTop:5 }}>
                <div style={{ height:'100%', width:`${(m.km/maxKm)*100}%`, background:m.color, borderRadius:2 }}/>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:16, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", color:m.color }}>{m.km}</div>
              <div style={{ fontSize:9, color:T.muted }}>km · {m.sessions} ses.</div>
            </div>
          </div>
        ))}
      </div>

      {/* Feed */}
      {feed.length > 0 && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:18 }}>
          <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em', marginBottom:14 }}>ACTIVIDAD RECIENTE</div>
          {feed.slice(0, 6).map((a, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:i<Math.min(feed.length,6)-1?`1px solid ${T.border}`:'none' }}>
              <div style={{ fontSize:18 }}>{a.emoji}</div>
              <div style={{ flex:1 }}>
                <span style={{ fontWeight:700, color:a.color }}>{a.name}</span>
                <span style={{ color:T.muted, fontSize:12 }}> {a.label}{a.km ? ` de ${a.km} km` : ''}</span>
                <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{a.timeAgo} · {a.source === 'strava' ? '🟠 Strava' : '✏️ Manual'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-end' }} onClick={()=>setShowInvite(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:430, margin:'0 auto', background:'#1a1a1a', borderRadius:'24px 24px 0 0', padding:'24px 20px 40px', border:`1px solid ${T.border}` }}>
            <div style={{ width:36, height:4, background:'#444', borderRadius:2, margin:'0 auto 20px' }}/>
            <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:6 }}>Invitar al grupo</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:18, lineHeight:1.5 }}>Código del grupo: <strong style={{color:T.orange, fontSize:18, fontFamily:"'Barlow Condensed',sans-serif"}}>{group?.invite_code}</strong></div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:12, color:T.muted }}>{window.location.origin}?join={group?.invite_code}</span>
              <button onClick={copyInviteLink} style={{ background:copied?T.green+'22':T.orange, border:`1px solid ${copied?T.green:T.orange}`, borderRadius:8, padding:'6px 12px', color:copied?T.green:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['💬','WhatsApp'],['📩','Email'],['📱','Mensaje'],['🔗','Más']].map(([icon,lbl])=>(
                <button key={lbl} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:'11px', color:T.text, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  {icon} {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JoinGroupInput({ onJoin }) {
  const [code, setCode] = useState('')
  return (
    <div style={{ display:'flex', gap:8, marginTop:8 }}>
      <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Código de invitación"
        style={{ flex:1, background:'#111', border:'1px solid #222', borderRadius:10, padding:'11px 14px', color:'#F0F0F0', fontSize:14, textTransform:'uppercase', letterSpacing:'0.1em' }}/>
      <button onClick={()=>onJoin(code)} style={{ background:'#222', border:'1px solid #333', borderRadius:10, padding:'11px 16px', color:'#F0F0F0', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, cursor:'pointer' }}>
        Unirse
      </button>
    </div>
  )
}
