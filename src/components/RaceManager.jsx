import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const T = {
  bg:'#0A0A0A', card:'#161616', surface:'#111', border:'#222',
  orange:'#FF5500', orangeDim:'#FF550022', orangeMid:'#FF550055',
  muted:'#666', text:'#F0F0F0', green:'#00E57A', blue:'#0099FF',
}

const POPULAR_RACES = [
  { name:'Valencia Half Marathon',   date:'2026-11-29', location:'Valencia' },
  { name:'Barcelona Half Marathon',  date:'2026-02-15', location:'Barcelona' },
  { name:'Madrid Half Marathon',     date:'2026-04-26', location:'Madrid' },
  { name:'Sevilla Half Marathon',    date:'2026-02-22', location:'Sevilla' },
  { name:'Bilbao Half Marathon',     date:'2026-10-11', location:'Bilbao' },
  { name:'San Sebastián Half',       date:'2026-05-17', location:'San Sebastián' },
]

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (24*3600*1000))
  return diff
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })
}

export default function RaceManager({ onClose, onUpdated }) {
  const { user, profile, updateProfile } = useAuth()
  const [races,      setRaces]      = useState([])
  const [showAdd,    setShowAdd]    = useState(false)
  const [editRace,   setEditRace]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [form,       setForm]       = useState({ name:'', date:'', goal_time:'', location:'', distance:'21k' })
  const [showPopular,setShowPopular]= useState(false)

  useEffect(() => { fetchRaces() }, [])

  async function fetchRaces() {
    const { data } = await supabase.from('races').select('*')
      .eq('user_id', user.id).order('date')
    setRaces(data || [])
    setLoading(false)
  }

  async function saveRace() {
    if (!form.name || !form.date) return
    if (editRace) {
      await supabase.from('races').update({ ...form }).eq('id', editRace.id)
    } else {
      await supabase.from('races').insert({ ...form, user_id: user.id })
    }
    // If it's the first race or marked primary, update profile
    if (races.length === 0 || form.is_primary) {
      await updateProfile({ race_date: form.date, goal_time: form.goal_time })
    }
    setForm({ name:'', date:'', goal_time:'', location:'', distance:'21k' })
    setShowAdd(false); setEditRace(null)
    fetchRaces()
    onUpdated?.()
  }

  async function setPrimary(race) {
    await updateProfile({ race_date: race.date, goal_time: race.goal_time || profile?.goal_time })
    onUpdated?.()
    fetchRaces()
  }

  async function deleteRace(id) {
    await supabase.from('races').delete().eq('id', id)
    fetchRaces()
  }

  function startEdit(race) {
    setForm({ name:race.name, date:race.date, goal_time:race.goal_time||'', location:race.location||'', distance:race.distance||'21k' })
    setEditRace(race)
    setShowAdd(true)
  }

  function fillFromPopular(race) {
    setForm(f => ({ ...f, name:race.name, date:race.date, location:race.location }))
    setShowPopular(false)
  }

  const isPrimary = (race) => race.date === profile?.race_date

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(10px)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%', maxWidth:430, margin:'0 auto',
        background:'#1a1a1a', borderRadius:'24px 24px 0 0',
        padding:'20px 20px 40px', border:`1px solid ${T.border}`,
        maxHeight:'88vh', overflowY:'auto',
      }}>
        <div style={{ width:36, height:4, background:'#444', borderRadius:2, margin:'0 auto 18px' }}/>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.1em' }}>GESTIÓN DE</div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>Mis Carreras</div>
          </div>
          {!showAdd && (
            <button onClick={()=>{setShowAdd(true);setEditRace(null);setForm({name:'',date:'',goal_time:'',location:'',distance:'21k'})}}
              style={{ background:T.orange, border:'none', borderRadius:10, padding:'8px 14px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}>
              + Añadir
            </button>
          )}
        </div>

        {/* Add/Edit form */}
        {showAdd && (
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>{editRace ? 'Editar carrera' : 'Nueva carrera'}</div>

            {/* Popular races shortcut */}
            {!editRace && (
              <div style={{ marginBottom:12 }}>
                <button onClick={()=>setShowPopular(!showPopular)} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'8px 12px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer', width:'100%', textAlign:'left' }}>
                  🏅 Elige de carreras populares {showPopular ? '▲' : '▼'}
                </button>
                {showPopular && (
                  <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:5 }}>
                    {POPULAR_RACES.map(r => (
                      <button key={r.date} onClick={()=>fillFromPopular(r)} style={{
                        background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
                        padding:'10px 12px', cursor:'pointer', display:'flex', justifyContent:'space-between',
                        alignItems:'center',
                      }}>
                        <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{r.name}</span>
                        <span style={{ fontSize:11, color:T.muted }}>{formatDate(r.date)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fields */}
            {[['Nombre de la carrera','name','text','Valencia Half Marathon'],['Lugar (opcional)','location','text','Valencia']].map(([lbl,key,type,ph])=>(
              <div key={key} style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>{lbl.toUpperCase()}</div>
                <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={ph}
                  style={{ width:'100%', background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 12px', color:T.text, fontSize:14 }}/>
              </div>
            ))}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>FECHA</div>
                <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
                  onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                  style={{ width:'100%', background:T.bg, border:`1px solid ${T.orange}`, borderRadius:10, padding:'10px 12px', color:T.text, fontSize:14, colorScheme:'dark' }}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:'0.08em' }}>OBJETIVO</div>
                <select value={form.goal_time} onChange={e=>setForm(f=>({...f,goal_time:e.target.value}))}
                  style={{ width:'100%', background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:'10px 12px', color:T.text, fontSize:14 }}>
                  <option value="">Sin objetivo</option>
                  {['Sub 2:30h','Sub 2:00h','Sub 1:45h','Sub 1:30h'].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{setShowAdd(false);setEditRace(null)}} style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'11px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={saveRace} disabled={!form.name||!form.date} style={{
                flex:2, background:form.name&&form.date?T.orange:T.surface,
                border:'none', borderRadius:10, padding:'11px', color:'#fff',
                fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14,
                cursor:form.name&&form.date?'pointer':'default',
              }}>
                {editRace ? 'Guardar cambios' : 'Añadir carrera'}
              </button>
            </div>
          </div>
        )}

        {/* Race list */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'20px', color:T.muted }}>Cargando...</div>
        ) : races.length === 0 && !showAdd ? (
          <div style={{ textAlign:'center', padding:'32px 20px', color:T.muted }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🏁</div>
            <div style={{ fontSize:14 }}>No tienes carreras añadidas.<br/>Añade tu próxima carrera para empezar.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {races.map(race => {
              const days    = daysUntil(race.date)
              const primary = isPrimary(race)
              const past    = days < 0
              return (
                <div key={race.id} style={{
                  background: primary ? T.orangeDim : T.card,
                  border:`1px solid ${primary ? T.orange+'55' : T.border}`,
                  borderRadius:14, padding:14,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <div style={{ fontSize:15, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif" }}>{race.name}</div>
                        {primary && <div style={{ background:T.orange, color:'#fff', fontSize:9, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, padding:'2px 7px', borderRadius:6, letterSpacing:'0.06em' }}>PRINCIPAL</div>}
                      </div>
                      <div style={{ fontSize:12, color:T.muted }}>
                        📅 {formatDate(race.date)}
                        {race.location ? ` · 📍 ${race.location}` : ''}
                        {race.goal_time ? ` · 🎯 ${race.goal_time}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                      {past ? (
                        <div style={{ fontSize:11, color:T.muted }}>Completada</div>
                      ) : (
                        <>
                          <div style={{ fontSize:22, fontWeight:900, fontFamily:"'Barlow Condensed',sans-serif", color:primary?T.orange:T.muted, lineHeight:1 }}>{days}</div>
                          <div style={{ fontSize:9, color:T.muted }}>días</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                    {!primary && !past && (
                      <button onClick={()=>setPrimary(race)} style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, cursor:'pointer' }}>
                        ⭐ Hacer principal
                      </button>
                    )}
                    <button onClick={()=>startEdit(race)} style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'7px', color:T.muted, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, cursor:'pointer' }}>
                      ✏️ Editar
                    </button>
                    <button onClick={()=>deleteRace(race.id)} style={{ background:T.surface, border:'1px solid #FF444433', borderRadius:8, padding:'7px 10px', color:'#FF4444', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, cursor:'pointer' }}>
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
