import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Shell from './components/Shell'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import StravaCallbackPage from './pages/StravaCallbackPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0A0A' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #FF5500', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!user) return <LoginPage />
  if (!profile?.race_date) return <OnboardingPage />
  return (
    <Routes>
      <Route path="/strava/callback" element={<StravaCallbackPage />} />
      <Route path="/*" element={<Shell />} />
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
