import { useEffect, useRef, useState } from 'react'
import { FiTrash2, FiX, FiShield, FiAlertTriangle, FiLock } from 'react-icons/fi'
import { HiOutlineCube } from 'react-icons/hi'

/* ── Tiny hash ticker animation ─────────────────────────────── */
function HashTicker() {
  const HEX = '0123456789abcdef'
  const rand = (n) => Array.from({ length: n }, () => HEX[Math.floor(Math.random() * 16)]).join('')
  const [hash, setHash] = useState(() => rand(32))

  useEffect(() => {
    const id = setInterval(() => setHash(rand(32)), 80)
    return () => clearInterval(id)
  }, [])

  return (
    <span style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: '0.6875rem',
      color: 'var(--danger)',
      opacity: 0.7,
      letterSpacing: '0.04em',
      userSelect: 'none',
    }}>
      0x{hash}…
    </span>
  )
}

/* ── Delete Confirm Modal ────────────────────────────────────── */
export default function DeleteConfirmModal({ open, onClose, onConfirm, loading, label, description, hashPreview }) {
  const overlayRef = useRef(null)

  /* lock body scroll */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* Esc key */
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
        background: 'rgba(5, 2, 15, 0.75)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.18s ease both',
      }}
    >
      <style>{`
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(24px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes blockPulse { 0%,100% { opacity:0.5; transform:scale(1) } 50% { opacity:1; transform:scale(1.12) } }
        @keyframes dangerPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4) } 50% { box-shadow: 0 0 0 10px rgba(220,38,38,0) } }
        @keyframes chainScroll { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
      `}</style>

      {/* ── Card ──────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-2)',
          borderRadius: 20,
          border: '1px solid rgba(220,38,38,0.25)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(220,38,38,0.1) inset',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >

        {/* ─── Scrolling chain header ─────────────────────────── */}
        <div style={{
          overflow: 'hidden', whiteSpace: 'nowrap',
          background: 'rgba(220,38,38,0.07)',
          borderBottom: '1px solid rgba(220,38,38,0.15)',
          padding: '6px 0',
        }}>
          <div style={{
            display: 'inline-block',
            animation: 'chainScroll 12s linear infinite',
          }}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                color: 'rgba(220,38,38,0.7)',
                padding: '0 1.5rem',
                letterSpacing: '0.08em',
              }}>
                ⛓ DELETION_EVENT · IMMUTABLE_RECORD · BLOCKCHAIN_LOG · 0x{Math.random().toString(16).slice(2, 10).toUpperCase()} ·&nbsp;
              </span>
            ))}
            {/* duplicate for seamless loop */}
            {Array.from({ length: 6 }, (_, i) => (
              <span key={`d${i}`} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                color: 'rgba(220,38,38,0.7)',
                padding: '0 1.5rem',
                letterSpacing: '0.08em',
              }}>
                ⛓ DELETION_EVENT · IMMUTABLE_RECORD · BLOCKCHAIN_LOG · 0x{Math.random().toString(16).slice(2, 10).toUpperCase()} ·&nbsp;
              </span>
            ))}
          </div>
        </div>

        {/* ─── Body ───────────────────────────────────────────── */}
        <div style={{ padding: '2rem 2rem 0' }}>

          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 56, right: 20,
            background: 'var(--bg-4)', border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <FiX size={16} />
          </button>

          {/* Icon */}
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: 'rgba(220,38,38,0.1)',
            border: '2px solid rgba(220,38,38,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            animation: 'dangerPulse 2s ease-in-out infinite',
          }}>
            <FiTrash2 size={30} color="var(--danger)" />
          </div>

          {/* Title */}
          <h2 style={{
            textAlign: 'center',
            fontSize: '1.25rem', fontWeight: 800,
            color: 'var(--text)',
            marginBottom: 8,
          }}>
            {label || 'Delete Post?'}
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-2)',
            lineHeight: 1.6,
            marginBottom: '1.25rem',
          }}>
            {description || (<>This action is <strong style={{ color: 'var(--danger)' }}>permanent</strong>. The post content will be removed, but a cryptographic deletion record will be written to the blockchain forever.</>)}
          </p>

          {/* Blockchain record panel */}
          <div style={{
            background: 'var(--bg-4)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
          }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <HiOutlineCube size={14} color="var(--warning)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.6875rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Blockchain Write Pending
              </span>
              <span style={{
                marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
                background: 'var(--warning)', display: 'inline-block',
                animation: 'blockPulse 1.2s ease-in-out infinite',
              }} />
            </div>

            {/* Row 2 — hash preview or animated ticker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiLock size={11} color="var(--text-muted)" />
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
                DEL_HASH:
              </span>
              {hashPreview
                ? <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--danger)', opacity: 0.8 }}>{hashPreview.slice(0, 16)}…{hashPreview.slice(-6)}</span>
                : <HashTicker />
              }
            </div>

            {/* Row 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <FiShield size={11} color="var(--success)" />
              <span style={{ fontSize: '0.6875rem', color: 'var(--success)', fontFamily: "'Space Mono', monospace", fontWeight: 600 }}>
                RECORD_STATUS: IMMUTABLE_ON_CHAIN
              </span>
            </div>
          </div>

          {/* Warning notice */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(220,38,38,0.07)',
            border: '1px solid rgba(220,38,38,0.18)',
            borderRadius: 10,
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
          }}>
            <FiAlertTriangle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
              Even after deletion, the audit trail and original SHA-256 hash remain accessible
              to admins via the Immutable Audit Log. You cannot undo this.
            </p>
          </div>
        </div>

        {/* ─── Footer Buttons ──────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 10,
          padding: '0 2rem 2rem',
        }}>
          {/* Cancel */}
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: 12,
              background: 'var(--bg-4)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.9375rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.15s',
              fontFamily: "'Poppins', sans-serif",
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = 'var(--bg-5)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-4)' }}
          >
            Cancel
          </button>

          {/* Delete */}
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: 12,
              background: loading ? 'rgba(220,38,38,0.5)' : 'var(--danger)',
              border: 'none',
              color: '#fff',
              fontSize: '0.9375rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(220,38,38,0.35)',
              fontFamily: "'Poppins', sans-serif",
            }}
            onMouseOver={e => { if (!loading) { e.currentTarget.style.background = '#b91c1c'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,0.5)' } }}
            onMouseOut={e => { e.currentTarget.style.background = loading ? 'rgba(220,38,38,0.5)' : 'var(--danger)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 16px rgba(220,38,38,0.35)' }}
          >
            {loading
              ? <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                  </path>
                </svg>
                Writing to chain…
              </>
              : <><FiTrash2 size={16} /> Delete &amp; Record</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
