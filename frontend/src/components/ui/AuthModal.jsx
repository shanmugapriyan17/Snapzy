import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { FiX, FiLock } from 'react-icons/fi'
import SnapzyLoader from './SnapzyLoader'

export default function AuthModal({ open, onClose, defaultIsLogin = true }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(defaultIsLogin)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', fullName: '', bio: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (open) {
      setIsLogin(defaultIsLogin)
      setForm({ username: '', email: '', password: '', confirmPassword: '', fullName: '', bio: '' })
      setShowPw(false)
    }
  }, [open, defaultIsLogin])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = '' };
  }, [open]);

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isLogin && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
        toast.success('Welcome back to Snapzy!')
        onClose()
        navigate('/')
      } else {
        await register({ ...form })
        toast.success('Identity minted on blockchain! Welcome to Snapzy!')
        onClose()
        navigate('/')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-fade-up" style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-2)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        overflow: 'hidden', border: '1px solid var(--border)',
      }}>
        {/* Header styling matching Stitch */}
        <div style={{
          position: 'relative', padding: '2rem 2rem 0',
          backgroundImage: 'radial-gradient(circle, #004ac6 0.5px, transparent 0.5px)',
          backgroundSize: '28px 28px',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            background: 'var(--bg-4)', border: 'none', borderRadius: 8,
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
          }}><FiX size={18} /></button>

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingBottom: '1.5rem' }}>
            <h2 className="animated-logo-text" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Snapzy</h2>
            <p style={{ fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>Technical Ledger Access</p>
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, var(--bg-2))', pointerEvents: 'none' }} />
        </div>

        <div style={{ padding: '0 2rem 2rem' }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-4)', borderRadius: 10, padding: 4, marginBottom: '1.5rem' }}>
            {['Sign In', 'Register'].map((label, i) => (
              <button key={label} onClick={() => setIsLogin(i === 0)} style={{
                flex: 1, padding: '0.5rem', fontSize: '0.875rem', fontWeight: isLogin === (i === 0) ? 700 : 500,
                background: isLogin === (i === 0) ? 'var(--bg-2)' : 'transparent',
                border: 'none', borderRadius: 8, color: isLogin === (i === 0) ? 'var(--text)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Poppins', sans-serif",
                boxShadow: isLogin === (i === 0) ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em', fontWeight: 600 }}>Display Name</label>
                  <input className="input" placeholder="Satoshi Nakamoto" value={form.fullName} onChange={set('fullName')} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em', fontWeight: 600 }}>Node Handle</label>
                  <input className="input" placeholder="nexus_user" value={form.username} onChange={set('username')} required />
                </div>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em', fontWeight: 600 }}>Identity Identifier</label>
              <input className="input" type="email" placeholder="node_address@nexus.sys" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em', fontWeight: 600 }}>Access Protocol</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.password} onChange={set('password')} required style={{ paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.06em', fontWeight: 600 }}>Verify Protocol</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required style={{ paddingRight: '2.75rem' }} />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem', marginTop: '0.25rem', fontSize: '0.9375rem', width: '100%', justifyContent: 'center', height: '3rem' }}>
              {loading
                ? <><SnapzyLoader size={26} />&nbsp;&nbsp;Please wait…</>
                : isLogin ? 'Sign In to Snapzy' : 'Mint Identity on Chain'}
            </button>
          </form>

          {isLogin && (
            <>
              {/* Admin Quick Access */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '1.25rem 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.6875rem', fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                Admin Quick Access
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['admin1@snapzy.io', 'admin@123', '👤 Admin 1'], ['admin2@snapzy.io', 'admin@456', '👤 Admin 2']].map(([em, pw, label]) => (
                  <button key={label} type="button" className="btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.5rem', fontFamily: "'Poppins', sans-serif" }}
                    onClick={() => setForm(f => ({ ...f, email: em, password: pw }))}>{label}</button>
                ))}
              </div>

              {/* Badge for Login to mimic stitch details */}
              <div style={{ marginTop: '1rem', background: 'var(--bg-4)', borderRadius: 8, padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.6875rem', fontFamily: "'Space Mono', monospace" }}>
                  <FiLock size={12} color="#f59e0b" /> SHA-256: 8F7E...A29C_AUTH_PENDING
                </div>
                <span style={{ fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: 'var(--success)', letterSpacing: '0.05em' }}>V-STATUS: OK</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
