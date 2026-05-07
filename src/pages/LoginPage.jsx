import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const T = { bg:'#0A0A0A', card:'#161616', border:'#222', orange:'#FF5500', muted:'#666', text:'#F0F0F0', green:'#00E57A' }

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]   = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [name,  setName]  = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await signIn(email, pass)
      else await signUp(email, pass, name)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontSize:48 }}>🏃</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:900, color:T.orange, letterSpacing:'-0.02em' }}>HalfPace</div>
        <div style={{ fontSize:14, color:T.muted, marginTop:4 }}>Tu entrenador para media maratón</div>
      </div>

      <div style={{ width:'100%', maxWidth:380, background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:28 }}>
        <div style={{ fontSize:20, fontWeight:800, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:20 }}>
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </div>

        {mode === 'register' && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>NOMBRE</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={{ width:'100%', background:'#111', border:`1px solid ${T.border}`, borderRadius:10, padding:'11px 14px', color:T.text, fontSize:15 }}/>
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>EMAIL</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={{ width:'100%', background:'#111', border:`1px solid ${T.border}`, borderRadius:10, padding:'11px 14px', color:T.text, fontSize:15 }}/>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:T.muted, marginBottom:5 }}>CONTRASEÑA</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={{ width:'100%', background:'#111', border:`1px solid ${T.border}`, borderRadius:10, padding:'11px 14px', color:T.text, fontSize:15 }}/>
        </div>

        {error && <div style={{ fontSize:13, color:'#FF4444', marginBottom:14, padding:'10px 14px', background:'#FF444411', borderRadius:8, border:'1px solid #FF444433' }}>{error}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', background:T.orange, border:'none', borderRadius:12, padding:'14px', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:16, cursor:'pointer' }}>
          {loading ? '...' : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'}
        </button>

        <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:T.muted }}>
          {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <span onClick={()=>setMode(mode==='login'?'register':'login')} style={{ color:T.orange, cursor:'pointer', fontWeight:600 }}>
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </span>
        </div>
      </div>
    </div>
  )
}
