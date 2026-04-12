import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import DarkModeToggle from '../ui/DarkModeToggle'
import {
  FiHome, FiSearch, FiMessageCircle, FiBell, FiUser,
  FiShield, FiSettings, FiLogOut, FiMenu, FiX, FiEdit3, FiCpu
} from 'react-icons/fi'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadNotifs,   setUnreadNotifs]   = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [mobileOpen,     setMobileOpen]     = useState(false)

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setUnreadNotifs(data.filter(n => !n.isRead).length)).catch(() => {})
    api.get('/messages/conversations').then(({ data }) => {
      const total = data.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
      setUnreadMessages(total)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const msgHandler = (msg) => {
      if ((msg.receiver?._id || msg.receiver) === user?._id || (msg.receiver?._id || msg.receiver) === user?.id)
        setUnreadMessages(prev => prev + 1)
    }
    const notifHandler = () => setUnreadNotifs(prev => prev + 1)
    socket.on('new_message', msgHandler)
    socket.on('notification', notifHandler)
    return () => { socket.off('new_message', msgHandler); socket.off('notification', notifHandler) }
  }, [user])

  const handleLogout = () => { logout(); navigate('/login'); setMobileOpen(false) }

  const links = [
    { to: '/',              icon: FiHome,       label: 'Home',          exact: true },
    { to: '/explore',       icon: FiSearch,     label: 'Explore' },
    { to: '/szy-ai',        icon: FiCpu,        label: 'Szy (AI)' },
    { to: '/messages',      icon: FiMessageCircle,   label: 'Messages',      badge: unreadMessages },
    { to: '/notifications', icon: FiBell,       label: 'Notifications', badge: unreadNotifs },
    { to: '/blockchain',    icon: FiShield,label: 'Blockchain' },
    { to: `/profile/${user?.username}`, icon: FiUser, label: 'My Profile' },
    { to: '/settings',      icon: FiSettings,        label: 'Settings' },
  ]

  const adminLinks = user?.role === 'admin'
    ? [{ to: '/admin', icon: FiShield, label: 'Admin Panel' }]
    : []

  const initials = user?.fullName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase()

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem 0' }}>

      {/* ── Brand ─────────────────────────────── */}
      <div style={{ padding: '0 1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>S</div>
          <div>
            <p className="snapzy-logo-anim animated-logo-text" style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>Snapzy</p>
            <p style={{ fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>Technical Ledger</p>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div className="hidden lg:block">
            <DarkModeToggle />
          </div>
          <button className="block lg:hidden" onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 4 }}>
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* ── Nav Links ─────────────────────────── */}
      {/* Active state: bg-shift to surface-container-highest + primary text — no border (spec rule) */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[...links, ...adminLinks].map(({ to, icon: Icon, label, exact, badge }) => (
          <NavLink
            key={to} to={to} end={exact}
            onClick={() => {
              setMobileOpen(false)
              if (label === 'Messages') setUnreadMessages(0)
              if (label === 'Notifications') setUnreadNotifs(0)
            }}
            className={({ isActive }) => `sidebar-link glass-hover${isActive ? ' active' : ''}`}
          >
            <Icon style={{ fontSize: 18, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <span style={{
                background: 'var(--danger)', color: '#fff',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.5625rem', fontWeight: 700,
                minWidth: 18, height: 18, padding: '0 4px',
                borderRadius: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── New Post Button ────────────────────── */}
      <div style={{ padding: '0.75rem 1rem' }}>
        <Link to="/" onClick={() => setMobileOpen(false)}
          className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 6 }}>
          <FiEdit3 size={15} /> New Entry
        </Link>
      </div>

      {/* ── Bottom: User + Logout ──────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: 4, marginTop: '0.5rem' }}>

        {/* User mini profile */}
        <Link to={`/profile/${user?.username}`} onClick={() => setMobileOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.875rem', borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-5)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1e293b,#020617)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
            {user?.avatar
              ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              : initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p title={user?.fullName} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</p>
            <p title={`@${user?.username}`} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user?.username}</p>
          </div>
        </Link>

        {/* Logout */}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0.875rem', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem', fontWeight: 500, width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-dim)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <FiLogOut size={18} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────── */}
      <aside className="sidebar-desktop glass-panel hidden lg:block" style={{
        position: 'fixed', top: '1rem', left: '1rem', width: 240, height: 'calc(100vh - 2rem)', zIndex: 50,
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar (always visible on mobile) ───────── */}
      <div className="mobile-hamburger" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, height: 56,
        background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem',
      }}>
        {/* Hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--bg-4)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)', cursor: 'pointer',
          }}
        >
          <FiMenu size={19} />
        </button>

        {/* Dark Mode Toggle — centered */}
        <DarkModeToggle />

        {/* Spacer to maintain symmetry */}
        <div style={{ width: 38 }} />
      </div>

      {/* ── Mobile Drawer ─────────────────────── */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(19,27,46,0.35)', backdropFilter: 'blur(4px)' }}
          />
          <aside style={{
            position: 'fixed', top: 0, left: 0, width: 260, height: '100vh', zIndex: 80,
            background: 'var(--bg-2)', overflowY: 'auto',
            animation: 'slideIn 0.25s ease',
          }}>
            <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
