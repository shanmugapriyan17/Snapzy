import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { formatDistanceToNow } from 'date-fns'
import {
  HiPaperAirplane, HiShieldCheck, HiSearch, HiX, HiChat,
  HiTrash, HiPhotograph, HiBan, HiShieldExclamation, HiEye
} from 'react-icons/hi'
import { FiTrash2, FiShield, FiLock, FiX, FiAlertTriangle } from 'react-icons/fi'
import { HiOutlineCube } from 'react-icons/hi'
import toast from 'react-hot-toast'

/* ─── Blockchain Delete Confirm Modal ─────────────────────────── */
function HashTicker() {
  const HEX = '0123456789abcdef'
  const rand = (n) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join('')
  const [hash, setHash] = useState(() => rand(32))
  useEffect(() => {
    const id = setInterval(() => setHash(rand(32)), 80)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--danger)', opacity: 0.7, letterSpacing: '0.04em', userSelect: 'none' }}>
      0x{hash}…
    </span>
  )
}

function MsgDeleteModal({ open, onClose, onConfirm, loading, msgHash, msgPreview }) {
  const overlayRef = useRef(null)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(5,2,15,0.8)', backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
        animation: 'dmFadeIn 0.18s ease both',
      }}
    >
      <style>{`
        @keyframes dmFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes dmSlideUp { from{opacity:0;transform:translateY(22px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes dmPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 10px rgba(220,38,38,0)} }
        @keyframes dmChain   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes dmDot     { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-2)',
        borderRadius: 20,
        border: '1px solid rgba(220,38,38,0.25)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,38,38,0.1) inset',
        overflow: 'hidden',
        animation: 'dmSlideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Scrolling chain banner */}
        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', background: 'rgba(220,38,38,0.07)', borderBottom: '1px solid rgba(220,38,38,0.15)', padding: '5px 0' }}>
          <div style={{ display: 'inline-block', animation: 'dmChain 12s linear infinite' }}>
            {[...Array(8)].map((_, i) => (
              <span key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'rgba(220,38,38,0.65)', padding: '0 1.5rem', letterSpacing: '0.08em' }}>
                ⛓ MSG_DELETION_EVENT · IMMUTABLE_AUDIT · DEL_HASH_PENDING ·&nbsp;
              </span>
            ))}
            {[...Array(8)].map((_, i) => (
              <span key={`d${i}`} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'rgba(220,38,38,0.65)', padding: '0 1.5rem', letterSpacing: '0.08em' }}>
                ⛓ MSG_DELETION_EVENT · IMMUTABLE_AUDIT · DEL_HASH_PENDING ·&nbsp;
              </span>
            ))}
          </div>
        </div>

        <div style={{ padding: '1.75rem 2rem 0' }}>
          {/* Close */}
          <button onClick={onClose} style={{ position: 'absolute', top: 52, right: 18, background: 'var(--bg-4)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <FiX size={15} />
          </button>

          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(220,38,38,0.1)', border: '2px solid rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', animation: 'dmPulse 2s ease-in-out infinite' }}>
            <FiTrash2 size={28} color="var(--danger)" />
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Delete Message?</h2>
          <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.125rem' }}>
            The message will be <strong style={{ color: 'var(--danger)' }}>removed from your view</strong>.
            However, it stays on the immutable audit log for admin review.
          </p>

          {/* Message preview */}
          {msgPreview && (
            <div style={{ background: 'var(--bg-4)', border: '1px dashed rgba(220,38,38,0.25)', borderRadius: 10, padding: '0.625rem 0.875rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{msgPreview.length > 80 ? msgPreview.slice(0, 80) + '…' : msgPreview}"
              </p>
            </div>
          )}

          {/* Blockchain record panel */}
          <div style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.75rem 0.875rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
              <HiOutlineCube size={13} color="var(--warning)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Blockchain Write Pending
              </span>
              <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', display: 'inline-block', animation: 'dmDot 1.2s ease-in-out infinite' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <FiLock size={10} color="var(--text-muted)" />
              <span style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>DEL_HASH:</span>
              {msgHash
                ? <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5875rem', color: 'var(--danger)', opacity: 0.8 }}>{msgHash.slice(0, 16)}…{msgHash.slice(-6)}</span>
                : <HashTicker />
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <FiShield size={10} color="var(--success)" />
              <span style={{ fontSize: '0.5625rem', color: 'var(--success)', fontFamily: "'Space Mono', monospace", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AUDIT_STATUS: IMMUTABLE_ON_CHAIN
              </span>
            </div>
          </div>

          {/* Warning */}
          <div style={{ display: 'flex', gap: 9, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 10, padding: '0.625rem 0.875rem', marginBottom: '1.5rem' }}>
            <FiAlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
              Admin can still see this message in the SQLite audit log. The original SHA-256 hash and content remain in the immutable ledger.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '0 2rem 1.75rem' }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, background: 'var(--bg-4)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = 'var(--bg-5)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-4)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '0.7rem', borderRadius: 12, background: loading ? 'rgba(220,38,38,0.5)' : 'var(--danger)', border: 'none', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Poppins', sans-serif", boxShadow: loading ? 'none' : '0 4px 16px rgba(220,38,38,0.35)', transition: 'all 0.15s' }}
            onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#b91c1c'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,0.5)' } }}
            onMouseOut={e => { e.currentTarget.style.background = loading ? 'rgba(220,38,38,0.5)' : 'var(--danger)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 16px rgba(220,38,38,0.35)' }}>
            {loading
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" /></path></svg> Deleting…</>
              : <><FiTrash2 size={15} /> Delete Message</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Message Hash Badge ────────────────────────────────────── */
function MsgHashBadge({ hash, isFlagged = false }) {
  if (!hash) return null
  const isPending = isFlagged;
  const short = isPending ? 'Pending...' : `${hash.slice(0, 8)}…${hash.slice(-5)}`
  const color = isPending ? 'var(--warning)' : 'var(--success)'
  const bg = isPending ? 'rgba(245,158,11,0.1)' : 'rgba(5,150,105,0.1)'

  return (
    <button
      onClick={() => navigator.clipboard.writeText(hash).then(() => toast.success('Hash copied!'))}
      title="Click to copy full message hash"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: bg, borderRadius: 5, padding: '2px 7px',
        border: `1px solid ${isPending ? 'rgba(245,158,11,0.2)' : 'transparent'}`, cursor: 'pointer',
      }}
    >
      {isPending ? <FiAlertTriangle size={9} style={{ color, flexShrink: 0 }} /> : <FiShield size={9} style={{ color, flexShrink: 0 }} />}
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color, letterSpacing: '0.03em', fontWeight: 600 }}>
        {short}
      </span>
    </button>
  )
}

/* ─── Main MessagesPage ──────────────────────────────────────── */
export default function MessagesPage() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [convos, setConvos] = useState([])
  const [messages, setMessages] = useState([])
  const [active, setActive] = useState(null)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [blocked, setBlocked] = useState(false)
  const [hoveredMsg, setHoveredMsg] = useState(null)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null) // { _id, msgHash, content }
  const [deleting, setDeleting] = useState(false)

  const chatContainerRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/messages/conversations').then(({ data }) => setConvos(data)).catch(() => { })
  }, [])

  useEffect(() => {
    if (!userId) { setActive(null); setMessages([]); return }
    api.get(`/users/${userId}`).then(({ data }) => setActive(data)).catch(() => { })
    api.get(`/messages/${userId}`).then(({ data }) => setMessages(data)).catch(() => { })
  }, [userId])

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!active) return
    api.get(`/users/${me._id || me.id}`).then(({ data }) => {
      setBlocked(data.blocked?.some(b => (b._id || b) === active._id))
    }).catch(() => { })
  }, [active])

  /* Socket */
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleNewMsg = (msg) => {
      const isRelevant = (msg.sender?._id || msg.sender) === active?._id ||
        (msg.receiver?._id || msg.receiver) === active?._id
      if (isRelevant) {
        setMessages(p => [...p, msg])
      } else {
        toast(`💬 New message from @${msg.sender?.username || 'someone'}`, { icon: '📩' })
        setConvos(prev => prev.map(c =>
          c._id === (msg.sender?._id || msg.sender)
            ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: { content: msg.content || '📷 Image' } }
            : c
        ))
      }
    }
    const handleTypingStart = ({ senderId }) => { if (active && senderId === active._id) setTyping(true) }
    const handleTypingStop = ({ senderId }) => { if (active && senderId === active._id) setTyping(false) }
    const handleRead = ({ by }) => { if (active && by === active._id) setMessages(p => p.map(m => m.sender?._id === me._id ? { ...m, isRead: true } : m)) }

    socket.on('new_message', handleNewMsg)
    socket.on('typing_start', handleTypingStart)
    socket.on('typing_stop', handleTypingStop)
    socket.on('messages_read', handleRead)
    return () => {
      socket.off('new_message', handleNewMsg)
      socket.off('typing_start', handleTypingStart)
      socket.off('typing_stop', handleTypingStop)
      socket.off('messages_read', handleRead)
    }
  }, [active, me._id])

  const sendMsg = async (e) => {
    e.preventDefault()
    if ((!text.trim() && !image) || !active) return
    const content = text; setText('')
    const socket = getSocket()
    socket?.emit('typing_stop', { receiverId: active._id })
    try {
      const formData = new FormData()
      formData.append('receiverId', active._id)
      if (content.trim()) formData.append('content', content)
      if (image) formData.append('image', image)
      const { data } = await api.post('/messages', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessages(p => [...p, data])
      setImage(null); setPreview(null)
      setConvos(prev => {
        const exists = prev.find(c => c._id === active._id)
        if (exists) return prev.map(c => c._id === active._id ? { ...c, lastMessage: { content: content || '📷 Image' } } : c)
        return [{ _id: active._id, user: active, lastMessage: { content: content || '📷 Image' }, unreadCount: 0 }, ...prev]
      })
    } catch (err) {
      setText(content)
      toast.error(err.response?.data?.error || 'Failed to send')
    }
  }

  /* ── Blockchain-aware delete ──────────────────────────────── */
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/messages/${deleteTarget._id}`)
      setMessages(p => p.filter(m => m._id !== deleteTarget._id))
      setDeleteTarget(null)

      // Rich blockchain toast
      toast.custom((t) => (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 11,
          background: 'var(--bg-2)', border: '1px solid rgba(220,38,38,0.25)',
          borderLeft: '4px solid var(--danger)', borderRadius: 12,
          padding: '0.875rem 1rem', maxWidth: 360,
          fontFamily: "'Poppins', sans-serif",
          opacity: t.visible ? 1 : 0, transition: 'opacity 0.3s ease',
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiTrash2 size={16} color="var(--danger)" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text)', marginBottom: 2 }}>Message Deleted</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 5 }}>
              Removed from your view. Audit record permanently stored.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-4)', borderRadius: 5, padding: '2px 7px', width: 'fit-content' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ⛓ DEL_HASH WRITTEN · IMMUTABLE_AUDIT
              </span>
            </div>
            {deleteTarget?.msgHash && (
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 4 }}>
                HASH: {deleteTarget.msgHash.slice(0, 14)}…{deleteTarget.msgHash.slice(-6)}
              </p>
            )}
          </div>
        </div>
      ), { duration: 6000 })
    } catch {
      toast.error('Failed to delete message')
    } finally {
      setDeleting(false)
    }
  }

  const toggleBlock = async () => {
    try {
      const { data } = await api.post(`/messages/block/${active._id}`)
      setBlocked(data.blocked)
      toast.success(data.message)
    } catch { toast.error('Failed') }
  }

  const handleTyping = (e) => {
    setText(e.target.value)
    const socket = getSocket()
    if (active) {
      socket?.emit('typing_start', { receiverId: active._id })
      clearTimeout(window._typingTimer)
      window._typingTimer = setTimeout(() => socket?.emit('typing_stop', { receiverId: active._id }), 1500)
    }
  }

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    setImage(file); setPreview(URL.createObjectURL(file))
  }

  const doSearch = async (q) => {
    setSearchQ(q)
    if (q.length < 1) { setSearchRes([]); return }
    const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`)
    setSearchRes(data.filter(u => u._id !== me._id))
  }

  const startConvo = (user) => {
    setSearching(false); setSearchQ(''); setSearchRes([])
    navigate(`/messages/${user._id}`)
  }

  const getImageSrc = (url) => url?.startsWith('http') ? url : url

  return (
    <>
      {/* ── Blockchain Message Delete Modal ─────────────────── */}
      <MsgDeleteModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        msgHash={deleteTarget?.msgHash}
        msgPreview={deleteTarget?.content}
      />

      <div style={{ display: 'flex', overflow: 'hidden', position: 'relative', height: 'calc(100dvh - 62px)', marginLeft: '-1rem', marginRight: '-1rem' }}>

        {/* ── Left: Conversation List ────────────────────────── */}
        <div
          style={{
            flexDirection: 'column', flexShrink: 0,
            width: '100%', maxWidth: 288,
            borderRight: '1px solid var(--border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            position: 'relative', zIndex: 10,
            display: active ? 'none' : 'flex',
          }}
          className="lg:flex"
        >
          {/* List header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>Messages</h2>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                ⛓ Blockchain-anchored DMs
              </p>
            </div>
            <button
              onClick={() => setSearching(s => !s)}
              style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
              onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {searching ? <HiX size={16} /> : <HiSearch size={16} />}
            </button>
          </div>

          {/* Search UI */}
          {searching && (
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <input
                autoFocus
                className="input"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.875rem', borderRadius: 10 }}
                placeholder="Search users…"
                value={searchQ}
                onChange={e => doSearch(e.target.value)}
              />
              {searchRes.map(u => (
                <button key={u._id} onClick={() => startConvo(u)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.5rem', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, marginTop: 4, transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-4)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Conversations */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {convos.map(c => (
              <button key={c._id} onClick={() => navigate(`/messages/${c._id}`)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.875rem 1rem',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: userId === c._id ? 'var(--primary-dim)' : 'none',
                  borderLeft: userId === c._id ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer', border: 'none', transition: 'background 0.15s',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseOver={e => { if (userId !== c._id) e.currentTarget.style.background = 'var(--bg-4)' }}
                onMouseOut={e => { if (userId !== c._id) e.currentTarget.style.background = 'none' }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                    {c.user?.avatar
                      ? <img src={c.user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" />
                      : c.user?.username?.[0]?.toUpperCase()}
                  </div>
                  {c.user?.isOnline && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: 'var(--success)', borderRadius: '50%', border: '2px solid var(--bg-2)' }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user?.fullName}</div>
                  <div style={{ fontSize: '0.75rem', color: c.unreadCount > 0 ? 'var(--text)' : 'var(--text-muted)', fontWeight: c.unreadCount > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.lastMessage?.content || 'Start chatting…'}
                  </div>
                </div>
                {c.unreadCount > 0 && (
                  <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.625rem', fontWeight: 700, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
            {convos.length === 0 && !searching && (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <HiChat style={{ fontSize: 32, margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.8125rem' }}>Click 🔍 to find someone!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat Window ─────────────────────────────── */}
        <div
          style={{
            flex: 1, flexDirection: 'column', background: 'var(--bg)', minWidth: 0,
            display: !active ? 'none' : 'flex',
          }}
          className="lg:flex lg:flex-1"
        >
          {active ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  className="lg:hidden"
                  onClick={() => navigate('/messages')}
                  style={{ padding: '6px 8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                >
                  <HiX size={20} />
                </button>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
                    {active.avatar
                      ? <img src={active.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" />
                      : active.username?.[0]?.toUpperCase()}
                  </div>
                  {active.isOnline && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: 'var(--success)', borderRadius: '50%', border: '2px solid var(--bg-2)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/profile/${active.username}`} style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {active.fullName}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: active.isOnline ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: active.isOnline ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
                    @{active.username} · {active.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                {/* Block button */}
                <button onClick={toggleBlock}
                  style={{
                    alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                    background: blocked ? 'var(--primary-dim)' : 'rgba(220,38,38,0.08)',
                    border: `1px solid ${blocked ? 'var(--primary)' : 'rgba(220,38,38,0.25)'}`,
                    color: blocked ? 'var(--primary)' : 'var(--danger)',
                    fontSize: '0.75rem', fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif", flexShrink: 0,
                  }}
                  className="hidden md:flex"
                >
                  <HiBan size={14} /> {blocked ? 'Unblock' : 'Block'}
                </button>
                {/* On-chain badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(5,150,105,0.1)', borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>
                  <HiShieldCheck style={{ color: 'var(--success)', fontSize: 12 }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>On-Chain</span>
                </div>
              </div>

              {/* Blocked banner */}
              {blocked && (
                <div style={{ background: 'rgba(220,38,38,0.08)', borderBottom: '1px solid rgba(220,38,38,0.2)', color: 'var(--danger)', fontSize: '0.8125rem', textAlign: 'center', padding: '0.5rem', fontWeight: 600 }}>
                  🚫 You have blocked this user. Unblock to send messages.
                </div>
              )}

              {/* Messages */}
              <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
                    <p style={{ fontSize: '0.875rem' }}>Say hello to <strong style={{ color: 'var(--text)' }}>@{active.username}</strong>!</p>
                    <p style={{ fontSize: '0.6875rem', marginTop: 4, fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All messages are SHA-256 hashed &amp; on-chain</p>
                  </div>
                )}

                {messages.map(m => {
                  // String() comparison: reliable ObjectId vs string matching
                  const isMe = String(m.sender?._id || m.sender || '') === String(me?._id || '')
                  const isViolent = m.isFlagged && m.violenceWords?.length > 0
                  return (
                    <div key={m._id}
                      style={{
                        display: 'flex',
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        gap: 8,
                        alignItems: 'flex-end',
                        marginBottom: 2,
                      }}
                      onMouseEnter={() => setHoveredMsg(m._id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      {/* Avatar */}
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: isMe ? 'linear-gradient(135deg,#3c557e,#546e98)' : 'var(--bg-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMe ? '#fff' : 'var(--primary)', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, border: '2px solid var(--border)', overflow: 'hidden' }}>
                        {isMe
                          ? (me?.avatar ? <img src={me.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : me?.username?.[0]?.toUpperCase())
                          : (active?.avatar ? <img src={active.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : active?.username?.[0]?.toUpperCase())}
                      </div>

                      {/* Message column */}
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '68%', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
                        {/* Violence warning */}
                        {isViolent && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                            <HiShieldExclamation size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--warning)' }}>⚠ Violent: <strong>{m.violenceWords?.join(', ')}</strong></span>
                          </div>
                        )}

                        {/* Bubble + delete button row */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          {/* Delete button on hover — only for sender */}
                          {hoveredMsg === m._id && isMe && (
                            <button
                              onClick={() => setDeleteTarget({ _id: m._id, msgHash: m.msgHash, content: m.content })}
                              title="Delete message — stored in audit log"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 8px', borderRadius: 7, flexShrink: 0,
                                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
                                color: 'var(--danger)', cursor: 'pointer',
                                fontSize: '0.625rem', fontWeight: 600,
                                fontFamily: "'Poppins', sans-serif",
                                transition: 'all 0.15s',
                              }}
                              onMouseOver={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff' }}
                              onMouseOut={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; e.currentTarget.style.color = 'var(--danger)' }}
                            >
                              <FiTrash2 size={11} />
                            </button>
                          )}

                          {/* Message bubble */}
                          <div style={{
                            padding: '0.625rem 0.875rem',
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            fontSize: '0.875rem', lineHeight: 1.55,
                            maxWidth: '100%', wordBreak: 'break-word',
                            background: isViolent
                              ? 'rgba(245,158,11,0.1)'
                              : isMe
                                ? 'var(--primary)'
                                : 'var(--bg-3)',
                            border: isViolent
                              ? '1px solid rgba(245,158,11,0.35)'
                              : isMe
                                ? 'none'
                                : '1px solid var(--border)',
                            color: isViolent ? 'var(--warning)' : isMe ? '#fff' : 'var(--text)',
                            boxShadow: isMe ? '0 2px 8px rgba(60,85,126,0.25)' : 'var(--shadow)',
                          }}>
                            {m.mediaUrl && (
                              <div style={{ marginBottom: 6, borderRadius: 10, overflow: 'hidden', maxWidth: 200 }}>
                                <img src={getImageSrc(m.mediaUrl)} alt="shared" style={{ width: '100%', height: 'auto', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                              </div>
                            )}
                            {m.content && <span>{m.content}</span>}
                          </div>
                        </div>

                        {/* Timestamp + hash + read receipt */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
                            {m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}
                          </span>
                          {isMe && (m.isRead
                            ? <span style={{ fontSize: '0.5875rem', fontWeight: 700, color: 'var(--primary)' }}>✓✓</span>
                            : <span style={{ fontSize: '0.5875rem', color: 'var(--text-muted)' }}>✓</span>
                          )}
                          {hoveredMsg === m._id && m.msgHash && <MsgHashBadge hash={m.msgHash} isFlagged={m.isFlagged} />}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {typing && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                      {active?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span key={i} style={{ width: 7, height: 7, background: 'var(--text-muted)', borderRadius: '50%', display: 'inline-block', animation: `dmDot 0.9s ${delay}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Image preview */}
              {preview && (
                <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-3)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                    <button onClick={() => { setImage(null); setPreview(null) }}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                      <HiX size={10} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Image ready to send</span>
                </div>
              )}

              {/* Input Bar */}
              <form onSubmit={sendMsg} style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={blocked}
                  style={{ background: 'none', border: 'none', cursor: blocked ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: 8, opacity: blocked ? 0.4 : 1, transition: 'color 0.15s' }}
                  onMouseOver={e => { if (!blocked) e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  <HiPhotograph size={22} />
                </button>
                <input
                  className="input"
                  style={{ flex: 1, borderRadius: 999, padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  placeholder={blocked ? 'Blocked — unblock to send' : 'Type a message…'}
                  value={text}
                  onChange={handleTyping}
                  disabled={blocked}
                />
                <button type="submit" className="btn-primary" style={{ borderRadius: 999, padding: '0.5rem 1rem', flexShrink: 0 }} disabled={blocked || (!text.trim() && !image)}>
                  <HiPaperAirplane style={{ transform: 'rotate(90deg)' }} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', padding: '2rem' }}>
              <div style={{ fontSize: 56 }}>💬</div>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)' }}>Your Messages</p>
              <p style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: 280, lineHeight: 1.6, color: 'var(--text-2)' }}>
                Private, AI-moderated, blockchain-anchored messaging. Every message has a SHA-256 hash.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(5,150,105,0.1)', borderRadius: 8, padding: '6px 14px', marginTop: 4 }}>
                <FiShield size={13} color="var(--success)" />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>On-chain anchored</span>
              </div>
              <button onClick={() => setSearching(true)} className="btn-primary" style={{ marginTop: 8, padding: '0.75rem 1.5rem' }}>
                <HiSearch style={{ marginRight: 6 }} /> Start a conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
