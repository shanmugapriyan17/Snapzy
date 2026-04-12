import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider }         from './context/ThemeContext'
import { Toaster }               from 'react-hot-toast'
import MainLayout         from './components/layout/MainLayout'
import LandingPage        from './pages/LandingPage'
import HomePage           from './pages/HomePage'
import ExplorePage        from './pages/ExplorePage'
import ProfilePage        from './pages/ProfilePage'
import MessagesPage       from './pages/MessagesPage'
import NotificationsPage  from './pages/NotificationsPage'
import BlockchainPage     from './pages/BlockchainPage'
import PostDetailPage     from './pages/PostDetailPage'
import AdminPage          from './pages/AdminPage'
import AboutPage          from './pages/AboutPage'
import SettingsPage       from './pages/SettingsPage'
import SzyChatPage        from './pages/SzyChatPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid var(--primary)', borderTopColor:'transparent', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              zIndex: 9999,
              background: '#ffffff',
              color: '#131b2e',
              boxShadow: '0 8px 32px rgba(19,27,46,0.12)',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
              border: 'none',
            },
            success: { iconTheme: { primary: '#006242', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ba1a1a', secondary: '#fff' } },
          }}
        />
        <BrowserRouter>
          <Routes>
             <Route path="/login"    element={<PublicRoute><LandingPage /></PublicRoute>} />
             <Route path="/register" element={<PublicRoute><LandingPage /></PublicRoute>} />
             <Route path="/about"    element={<AboutPage />} />
             <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
               <Route index               element={<HomePage />} />
               <Route path="explore"      element={<ExplorePage />} />
               <Route path="profile/:username" element={<ProfilePage />} />
               <Route path="messages"     element={<MessagesPage />} />
               <Route path="messages/:userId" element={<MessagesPage />} />
               <Route path="notifications" element={<NotificationsPage />} />
               <Route path="blockchain"   element={<BlockchainPage />} />
               <Route path="post/:id"     element={<PostDetailPage />} />
               <Route path="admin"        element={<AdminRoute><AdminPage /></AdminRoute>} />
               <Route path="settings"     element={<SettingsPage />} />
               <Route path="szy-ai"       element={<SzyChatPage />} />
             </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
