import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/ui/AuthModal'
import { FiArrowLeft } from 'react-icons/fi'

const SECTIONS = [
  { category: 'Protocol', items: [
    { id: 'whitepaper', title: 'Whitepaper' },
    { id: 'governance', title: 'Governance' },
    { id: 'security-audits', title: 'Security Audits' },
    { id: 'open-source', title: 'Open Source' },
  ]},
  { category: 'Ecosystem', items: [
    { id: 'developers', title: 'Developers' },
    { id: 'block-explorer', title: 'Block Explorer' },
    { id: 'ai-oracle', title: 'AI Oracle' },
    { id: 'token-bridge', title: 'Token Bridge' },
  ]},
  { category: 'Connect', items: [
    { id: 'twitter-x-', title: 'Twitter (X)' },
    { id: 'discord', title: 'Discord' },
    { id: 'github', title: 'GitHub' },
    { id: 'mirror', title: 'Mirror' },
  ]}
]

const CONTENT_MAP = {
  'whitepaper': {
    title: 'The Snapzy Genesis',
    pill: 'Protocol Core',
    body: (
      <>
        <p className="about-text">Snapzy is a zero-knowledge, cryptographically secure social ledger designed to restore architectural trust to human communication. Born out of the necessity to dismantle surveillance capitalism, Snapzy represents the next evolutionary step in deterministic network interactions.</p>
        <p className="about-text">By shifting the paradigm from centralized data silos to an immutable Ethereum-anchored topology, user identities cannot be arbitrarily revoked, shadow-banned, or manipulated without public consequence. Every action generates a verifiable SHA-256 fingerprint, ensuring algorithmic equality across the entire distributed ecosystem.</p>
      </>
    )
  },
  'governance': {
    title: 'Decentralized Consensus',
    pill: 'Protocol Core',
    body: (
      <>
        <p className="about-text">Network governance is mathematically enforced. Every verified user intrinsically carries a cryptographic weight across feature proposals, minimizing vector attacks from bad actors and bots. The foundation exclusively acts on on-chain executed consensus decisions, securing the network trajectory permanently.</p>
      </>
    )
  },
  'security-audits': {
    title: 'Mathematical Guarantees',
    pill: 'Protocol Core',
    body: (
       <p className="about-text">Operating under a strict Zero-Trust philosophy, the Snapzy smart contracts and the underlying Node execution layers undergo continuous simulated audits. Our integration arrays (`NexusProfile.sol`) strictly employ fail-safe reentrancy guards. Mathematical proof of truth is our highest imperative.</p>
    )
  },
  'open-source': {
    title: 'Radical Transparency',
    pill: 'Protocol Core',
    body: (
      <p className="about-text">The Snapzy interface, AI defense matrices, and core backend logic are strictly open source. What you see is exactly what compiles. No proprietary black boxes—just verifiable state transitions on your data arrays.</p>
    )
  },
  'developers': {
    title: 'Core Engine Developers',
    pill: 'Ecosystem',
    body: (
      <>
        <p className="about-text" style={{ marginBottom: '1.25rem' }}>Snapzy is engineered to seamlessly synthesize deep learning moderation systems with immutable blockchain ledgers. If you require bespoke dApp integration, API protocol connections, or professional engineering audits, contact the core foundation architect.</p>
        
        <div style={{ background: 'var(--bg-3)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
             <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>S</div>
             <div>
               <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.02em' }}>Shanmugapriyan S</h4>
               <p style={{ fontSize: '0.6875rem', fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)', letterSpacing: '0.05em' }}>FOUNDER & PRIMARY ARCHITECT</p>
             </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem', color: 'var(--text-2)' }}>
             <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <span style={{ color: 'var(--primary)' }}>■</span> 
               <strong>Secure Comms:</strong> <a href="mailto:ranjithssp2003@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>ranjithssp2003@gmail.com</a>
             </p>
             <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <span style={{ color: 'var(--success)' }}>■</span> 
               <strong>Network ID:</strong> <span style={{ fontFamily: "'Space Mono', monospace", color: 'var(--text)' }}>+91 9894982411</span>
             </p>
          </div>
        </div>
      </>
    )
  },
  'block-explorer': {
    title: 'Public Ledger Output',
    pill: 'Ecosystem',
    body: (
      <>
        <p className="about-text">Every action is mathematically hashed. You can trace moderation actions, profile verifications, and toxicity flags directly to their transaction roots via our proprietary block explorer. Every single payload hash generated inside the platform is independently verifiable at your discretion.</p>
        <div className="p-6 rounded-xl font-mono text-sm mt-4" style={{ background: 'var(--bg-3)', color: 'var(--success)' }}>
          Latest Block: 19482910<br/>
          Anchors Synced: 100%<br/>
          Status: Operational Network
        </div>
      </>
    )
  },
  'ai-oracle': {
    title: 'AI Defensive Matrix',
    pill: 'Ecosystem',
    body: <p className="about-text">To prevent network toxicity without establishing human bias, Snapzy utilizes a deterministic Natural Language Processing (NLP) matrix. Every payload is probabilistically analyzed for threats, violence, and harassment in real-time, enforcing security silently before a single byte hits the blockchain.</p>
  },
  'token-bridge': {
    title: 'Cross-Chain Bridges',
    pill: 'Ecosystem',
    body: <p className="about-text">Seamlessly transport identity metadata and governance rights across Ethereum L2 infrastructure. Build decentralized dApps utilizing the Snapzy social graph.</p>
  },
  'twitter-x-': {
    title: 'Global Broadcast',
    pill: 'Connect',
    body: <p className="about-text">Follow Snapzy's official feeds for real-time protocol updates and zero-knowledge architecture deep dives.</p>
  },
  'discord': {
    title: 'Cypherpunk Society',
    pill: 'Connect',
    body: <p className="about-text">Join thousands of node runners, architects, and cryptography enthusiasts in our active Discord channels.</p>
  },
  'github': {
    title: 'Collaborate',
    pill: 'Connect',
    body: <p className="about-text">Inspect the codebase. Find bugs. Submit PRs. The architecture belongs to the community.</p>
  },
  'mirror': {
    title: 'Protocol Research',
    pill: 'Connect',
    body: <p className="about-text">Read highly technical whitepapers and release post-mortems published immutably on Mirror.xyz.</p>
  }
}

export default function AboutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('whitepaper')
  const [authOpen, setAuthOpen] = useState(false)
  const [authLoginMode, setAuthLoginMode] = useState(true)

  useEffect(() => {
    if (location.hash) {
      const target = location.hash.replace('#', '')
      if (CONTENT_MAP[target]) setActiveTab(target)
    } else {
      window.scrollTo(0, 0)
    }
  }, [location])

  const handleAuthTrigger = (isLogin) => {
    setAuthLoginMode(isLogin);
    setAuthOpen(true);
  }

  const content = CONTENT_MAP[activeTab] || CONTENT_MAP['whitepaper']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Poppins', sans-serif" }}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} defaultIsLogin={authLoginMode} />

      {/* ── CUSTOM HEADER ──────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--glass-bg)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>S</div>
            <div className="hidden sm:block">
              <p className="snapzy-logo-anim animated-logo-text" style={{ fontSize: '0.9375rem', fontWeight: 800, lineHeight: 1.1 }}>Snapzy</p>
              <p style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>Technical Ledger</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            {!user ? (
              <>
                <button className="btn-ghost" style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }} onClick={() => handleAuthTrigger(true)}>Sign In</button>
                <button className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }} onClick={() => handleAuthTrigger(false)}>Get Started</button>
              </>
            ) : (
              <button className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }} onClick={() => navigate('/')}>Go to Ledger</button>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>
        
        {/* Title & Back Button */}
        <div style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <button onClick={() => navigate('/')} className="btn-ghost mb-4" style={{ padding: '0.5rem', borderRadius: 999 }}>
            <FiArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em' }}>About Us</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.0625rem' }}>Discover the mechanics defining the next era of cryptographic interaction.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Sidebar */}
          <aside className="w-full md:w-[280px] shrink-0 md:sticky" style={{ top: '7rem' }}>
            {SECTIONS.map((group, i) => (
              <div key={i} className="mb-6">
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', paddingLeft: '1rem' }}>
                  {group.category}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        textAlign: 'left', padding: '0.625rem 1rem', borderRadius: 8,
                        background: activeTab === item.id ? 'var(--primary-dim)' : 'transparent',
                        color: activeTab === item.id ? 'var(--primary)' : 'var(--text-2)',
                        fontWeight: activeTab === item.id ? 700 : 500,
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        fontSize: '0.9375rem', fontFamily: "'Poppins', sans-serif"
                      }}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Body content */}
          <div className="flex-1 max-w-[800px] animate-fade-up">
            <div style={{ display: 'inline-block', marginBottom: '1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', background: 'var(--primary-dim)', color: 'var(--primary)', padding: '0.3rem 0.75rem', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {content.pill}
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>
              {content.title}
            </h2>
            <div style={{ fontSize: '1.0625rem', color: 'var(--text-2)', lineHeight: 1.8 }}>
              {content.body}
            </div>
          </div>

        </div>
      </main>

      <style>{`
        .about-text { margin-bottom: 1.5rem; }
      `}</style>
    </div>
  )
}
