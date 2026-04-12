import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HowItWorksModal from '../components/ui/HowItWorksModal'
import AuthModal from '../components/ui/AuthModal'
import DarkModeToggle from '../components/ui/DarkModeToggle'
import { HiShieldCheck, HiChip, HiDatabase, HiKey } from 'react-icons/hi'

const FEATURES = [
  { icon: <HiShieldCheck />, color: '#004ac6', bg: 'rgba(0,74,198,0.08)', title: 'Blockchain Verified', desc: 'Every post and account is SHA-256 hashed and anchored to Ethereum. Tamper-proof by design.' },
  { icon: <HiChip />, color: '#6b38d4', bg: 'rgba(107,56,212,0.08)', title: 'AI Content Guard', desc: 'Real-time toxicity detection across 4 severity levels — silent, flagged, alerted, and blocked.' },
  { icon: <HiDatabase />, color: '#006242', bg: 'rgba(0,98,66,0.08)', title: 'Immutable Audit Log', desc: 'Deleted posts leave traces. Admins can always recover the original content and its chain record.' },
  { icon: <HiKey />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', title: 'End-to-End Privacy', desc: 'JWT-secured sessions and role-based access control. Your data never leaves your control.' },
]

const STEPS = [
  { num: '01', title: 'Register your identity', desc: 'Your account hash is minted to the Ethereum blockchain on signup.' },
  { num: '02', title: 'Create & publish content', desc: 'Your post is scanned by AI in real-time before going live.' },
  { num: '03', title: 'Chain fingerprint created', desc: 'An immutable SHA-256 hash is anchored on-chain — permanent proof of existence.' },
]

/* ─── Hash Animation ────────────────────────────────────────── */
function HashTerminal() {
  const [lines, setLines] = useState([])
  const [step, setStep] = useState(0)
  const ref = useRef(null)
  const SEQUENCE = [
    { text: '> Initializing NexusAuth.sol ...', color: '#64748b', delay: 600 },
    { text: '> Profile data received', color: '#059669', delay: 800 },
    { text: '  username: "satoshi_01"',  color: '#6b38d4', delay: 400 },
    { text: '  email:    "s@nexus.sys"', color: '#6b38d4', delay: 400 },
    { text: '> Generating SHA-256 hash ...', color: '#d97706', delay: 1000 },
    { text: '  0x8f7e3a19c4b2d156e890fa2b71c39d4e', color: '#004ac6', delay: 300 },
    { text: '  a827f51e0c6d934b28a1e5f706823c91', color: '#004ac6', delay: 300 },
    { text: '> Anchoring to Ethereum Mainnet ...', color: '#d97706', delay: 1200 },
    { text: '  Block #14,290,412 confirmed ✓', color: '#059669', delay: 400 },
    { text: '> Account securely created ✓', color: '#059669', delay: 600 },
    { text: '  Status: ON_CHAIN | Immutable', color: '#059669', delay: 0 },
  ]

  useEffect(() => {
    if (step >= SEQUENCE.length) {
      const t = setTimeout(() => { setLines([]); setStep(0) }, 3000)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setLines(prev => [...prev, SEQUENCE[step]])
      setStep(s => s + 1)
    }, SEQUENCE[step].delay)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [lines])

  return (
    <div style={{
      background: '#0f172a', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(15,23,42,0.35)', border: '1px solid rgba(255,255,255,0.06)',
      fontFamily: "'Space Mono', monospace", fontSize: '0.75rem',
    }}>
      {/* Title Bar */}
      <div style={{ padding: '0.625rem 1rem', display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: 8, fontSize: '0.625rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>NexusAuth.sol — Secure Account Creation</span>
      </div>
      {/* Terminal Body */}
      <div ref={ref} style={{ padding: '1rem 1.25rem', minHeight: 220, maxHeight: 280, overflowY: 'auto' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color, lineHeight: 1.8, opacity: 0.95 }}>{l.text}</div>
        ))}
        {step < SEQUENCE.length && (
          <span style={{ color: '#f8fafc', animation: 'blink 1s step-end infinite' }}>▌</span>
        )}
      </div>
      <style>{`@keyframes blink{50%{opacity:0}}`}</style>
    </div>
  )
}

/* ─── Landing Page ──────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [showHow, setShowHow] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoginMode, setAuthLoginMode] = useState(true)

  const handleAuthTrigger = (isLogin) => {
    setAuthLoginMode(isLogin);
    setAuthOpen(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Poppins', sans-serif", overflowX: 'hidden' }}>

      {/* Modals */}
      <HowItWorksModal open={showHow} onClose={() => setShowHow(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultIsLogin={authLoginMode} />

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* On mobile: Logo | [DARK/LIGHT] centered | ☰
            On desktop: Logo | Nav Links + [DARK/LIGHT] centered | Sign In Get Started */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>

          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>S</div>
            <div className="hidden sm:block">
              <p className="snapzy-logo-anim animated-logo-text" style={{ fontSize: '0.9375rem', fontWeight: 800, lineHeight: 1.1 }}>Snapzy</p>
              <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>Technical Ledger</p>
            </div>
          </div>

          {/* Center: ALWAYS VISIBLE — Nav Links (desktop only) + Dark Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, justifyContent: 'center' }}>
            <div className="hidden md:flex" style={{ gap: '2rem', alignItems: 'center' }}>
              {[['Features', '#features'], ['Security', '#stats'], ['About Us', '/about']].map(([label, href]) => (
                <a key={label} href={href}
                  onClick={(e) => { if(href.startsWith('/')) { e.preventDefault(); navigate(href); } }}
                  style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
                >{label}</a>
              ))}
            </div>
            {/* Dark Mode Toggle — always centered, always visible */}
            <DarkModeToggle />
          </div>

          {/* Right: Auth buttons (desktop) + Hamburger (mobile) */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            <button className="btn-ghost hidden md:inline-flex" style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }} onClick={() => handleAuthTrigger(true)}>Sign In</button>
            <button className="btn-primary hidden md:inline-flex" style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }} onClick={() => handleAuthTrigger(false)}>Get Started</button>
            {/* Mobile hamburger */}
            <button className="md:hidden" onClick={() => setMobileMenu(v => !v)}
              style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', padding: '6px 10px', color: 'var(--text)', fontSize: 18, lineHeight: 1 }}>
              {mobileMenu ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown — dark mode aware */}
        {mobileMenu && (
          <div className="md:hidden" style={{ padding: '1rem 1.5rem', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a href="#features" onClick={() => setMobileMenu(false)} style={{ fontSize: '0.9375rem', color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>Features</a>
            <a href="#stats" onClick={() => setMobileMenu(false)} style={{ fontSize: '0.9375rem', color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>Security</a>
            <button onClick={() => { navigate('/about'); setMobileMenu(false); }} style={{ textAlign: 'left', fontSize: '0.9375rem', color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>About Us</button>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <button className="btn-ghost" style={{ flex: 1, fontSize: '0.8125rem' }} onClick={() => { handleAuthTrigger(true); setMobileMenu(false) }}>Sign In</button>
              <button className="btn-primary" style={{ flex: 1, fontSize: '0.8125rem' }} onClick={() => { handleAuthTrigger(false); setMobileMenu(false) }}>Register</button>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* ── HERO ─────────────────────────────────────────── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '7.5rem 1.5rem 5rem', position: 'relative' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(107,56,212,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center" style={{ position: 'relative', zIndex: 1 }}>
            {/* Left — Hero Text */}
            <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-4)', borderRadius: 9999, padding: '0.3rem 1rem', width: 'fit-content' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} className="animate-pulse-slow" />
                <span style={{ fontSize: '0.6875rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>v2.0 Mainnet Active</span>
              </div>

              <h1 style={{ fontSize: 'clamp(2rem,5vw,3.75rem)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-0.04em', color: 'var(--text)' }}>
                Blockchain-Secured,<br />
                <span style={{ color: 'var(--secondary)' }}>AI-Moderated.</span>
              </h1>

              <p style={{ fontSize: '1.0625rem', color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 480 }}>
                Snapzy is a sovereign social ledger where data is owned by you, validated by consensus, and curated by neutral AI protocols.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#64748b' }}>
                <span>e.g. chain hash:</span>
                <span className="hash-badge">0x18081be7…8e67</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button className="btn-primary" onClick={() => handleAuthTrigger(false)} style={{ padding: '0.7rem 1.75rem', fontSize: '0.9375rem' }}>
                  Explore the Ledger →
                </button>
                <button className="btn-ghost" onClick={() => setShowHow(true)} style={{ padding: '0.7rem 1.75rem', fontSize: '0.9375rem' }}>
                  How it Works
                </button>
              </div>
            </div>

            {/* Right — Hash Animation Terminal */}
            <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <HashTerminal />
            </div>
          </div>
        </section>

        {/* ── FEATURES / BENTO GRID ──────────────────────────── */}
        <section id="features" style={{ background: 'var(--bg-dim)', padding: '5rem 1.5rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: '3.5rem' }}>
              <h2 style={{ fontSize: 'clamp(1.75rem,3vw,2.25rem)', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 8 }}>
                The Architecture of Truth
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '1rem', fontWeight: 500 }}>
                Why transparency is no longer optional in the digital age.
              </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Large Feature */}
              <div className="md:col-span-8 glass-hover" style={{
                background: 'var(--bg-2)', borderRadius: 14, padding: '2.5rem', boxShadow: 'var(--shadow)',
                border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', minHeight: 260,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{ zIndex: 1 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', fontSize: 22, color: 'var(--primary)' }}>
                    <HiShieldCheck size={26} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Immutable Governance</h3>
                  <p style={{ color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 420 }}>
                    Every action, from content moderation to protocol upgrades, is recorded on a public ledger. No hidden algorithms, no black-box decisions.
                  </p>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.9 }}>
                  <span style={{ color: 'var(--secondary)' }}>pragma</span> solidity ^0.8.20;<br />
                  <span style={{ color: 'var(--text)' }}>contract</span> <span style={{ color: '#059669' }}>NexusProfile</span> {'{'}<br />
                  &nbsp;&nbsp;<span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>// Hash of identity off-chain</span><br />
                  &nbsp;&nbsp;<span style={{ color: 'var(--text)' }}>mapping</span>(address =&gt; bytes32) identities;<br />
                  {'}'}
                </div>
              </div>

              {/* AI Card */}
              <div className="md:col-span-4 glass-hover" style={{
                background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: 14,
                padding: '2rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1rem',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  <HiChip size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI Clarity</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, opacity: 0.8 }}>
                  Our LLM-based moderation provides a Reasoning Hash for every action, allowing you to audit the logic behind content sorting.
                </p>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem', borderRadius: 6, width: 'fit-content', color: 'rgba(255,255,255,0.7)' }}>
                  #sha256:8f4e...9a2
                </span>
              </div>

              {/* Bottom 3 */}
              {FEATURES.slice(1).map((f, i) => (
                <div key={i} className="md:col-span-4 glass-hover" style={{
                  background: i === 2 ? 'var(--primary-container)' : 'var(--bg-2)',
                  borderRadius: 14, padding: '1.75rem', boxShadow: 'var(--shadow)',
                  border: i === 2 ? '1px solid rgba(180,138,255,0.2)' : '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '0.875rem',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 9, background: i === 2 ? 'rgba(255,255,255,0.15)' : 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: i === 2 ? '#fff' : 'var(--primary)' }}>{f.icon}</div>
                  <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: i === 2 ? '#fff' : 'var(--text)' }}>{f.title}</h4>
                  <p style={{ fontSize: '0.8125rem', color: i === 2 ? 'rgba(255,255,255,0.8)' : 'var(--text-2)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section id="stats" style={{ padding: '5rem 1.5rem' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{
              background: '#0f172a', borderRadius: 20, padding: '3.5rem 2.5rem',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(107,56,212,0.2)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-block', marginBottom: '1.5rem', fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', padding: '0.3rem 1rem', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  150,000+ Architects Building
                </div>
                <h2 style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 14 }}>
                  Ready to secure your digital footprint?
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '2rem', maxWidth: 520, margin: '0 auto 2rem' }}>
                  Join Snapzy — where every word you publish is permanently anchored and AI-protected.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => handleAuthTrigger(false)} style={{ padding: '0.8rem 2.25rem', fontSize: '1rem' }}>
                    Get Started →
                  </button>
                  <button className="btn-ghost" onClick={() => navigate('/about')} style={{ padding: '0.8rem 2.25rem', fontSize: '1rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}>
                    View Public Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ background: 'var(--bg-dim)', padding: '3rem 1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8" style={{ marginBottom: '2.5rem' }}>
            <div className="col-span-2 md:col-span-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>S</div>
                <span className="animated-logo-text" style={{ fontWeight: 800, color: '#131b2e', fontSize: '1rem' }}>Snapzy</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.7 }}>
                The Technical Ledger for Human Interaction.<br />Secured by Ethereum. Moderated by Intelligence.
              </p>
            </div>
            {[
              ['Protocol', ['Whitepaper','Governance','Security Audits','Open Source']],
              ['Ecosystem', ['Developers','Block Explorer','AI Oracle','Token Bridge']],
              ['Connect', ['Twitter (X)','Discord','GitHub','Mirror']],
            ].map(([title, links]) => (
              <div key={title}>
                <h6 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '1rem' }}>{title}</h6>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {links.map(l => {
                    const hashId = l.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    return (
                      <li key={l}>
                        <button onClick={() => navigate(`/about#${hashId}`)} style={{ fontSize: '0.8125rem', color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          onMouseEnter={e => e.target.style.color = 'var(--primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
                        >{l}</button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              © 2026 SNAPZY FOUNDATION. NO RIGHTS RESERVED.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['0x00...0000_GENESIS', 'STATUS: STABLE'].map(t => (
                <span key={t} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.625rem', color: 'var(--text-muted)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
