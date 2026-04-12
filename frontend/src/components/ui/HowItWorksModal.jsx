import { useEffect, useState } from 'react'
import { FiX, FiUser, FiCpu, FiEdit3, FiShield, FiCheckCircle } from 'react-icons/fi'

const STEPS = [
  { icon: FiUser,        color: '#004ac6', title: 'Create Identity',           desc: 'Register with your email. Your account hash is instantly minted onto the Ethereum blockchain.' },
  { icon: FiCpu,         color: '#6b38d4', title: 'Hash Generated on Chain',   desc: 'A unique SHA-256 hash is generated from your profile data and permanently anchored on-chain.' },
  { icon: FiEdit3,       color: '#006242', title: 'Post & Interact',           desc: 'Write posts, send messages, and interact. Every action is logged with an immutable chain fingerprint.' },
  { icon: FiShield,      color: '#d97706', title: 'AI Moderation Checks',      desc: 'Our AI engine scans all content in real-time across 4 severity levels — from silent to blocked.' },
  { icon: FiCheckCircle, color: '#059669', title: 'Admin Reviews & Approves', desc: 'Admins verify accounts, review flagged content, and maintain the integrity of the social ledger.' },
]

export default function HowItWorksModal({ open, onClose }) {
  const [visibleStep, setVisibleStep] = useState(-1)

  useEffect(() => {
    if (!open) { setVisibleStep(-1); return }
    const timers = STEPS.map((_, i) => setTimeout(() => setVisibleStep(i), 300 + i * 400))
    return () => timers.forEach(clearTimeout)
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = '' };
  }, [open]);

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 600,
        background: 'var(--bg-2)', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        overflow: 'hidden', border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>How Snapzy Works</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>PROTOCOL_WALKTHROUGH_v2.0</p>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg-4)', border: 'none', borderRadius: 8,
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
          }}><FiX size={18} /></button>
        </div>

        {/* Steps */}
        <div style={{ padding: '1.5rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const visible = i <= visibleStep
            return (
              <div key={i} style={{ display: 'flex', gap: '1.25rem', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.4s ease' }}>
                {/* Connector & Dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: step.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: step.color, flexShrink: 0,
                  }}><Icon size={18} /></div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 24, background: `linear-gradient(${step.color}40, ${STEPS[i + 1].color}40)` }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: i < STEPS.length - 1 ? '1.25rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', fontWeight: 700, color: step.color }}>STEP {String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{step.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
