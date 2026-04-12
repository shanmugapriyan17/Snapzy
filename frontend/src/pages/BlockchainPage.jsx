import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FiShield, FiDatabase, FiServer, FiCheckCircle, FiXCircle, FiUsers, FiFileText, FiMessageSquare, FiStar, FiFlag, FiTrash2, FiLink, FiInfo, FiBox } from 'react-icons/fi'

export default function BlockchainPage() {
  const { user } = useAuth()
  const [stats,     setStats]     = useState(null)
  const [query,     setQuery]     = useState('')
  const [type,      setType]      = useState('post')
  const [result,    setResult]    = useState(null)
  const [checking,  setChecking]  = useState(false)
  const [activeTab, setActiveTab] = useState('blockchain')
  const [auditTab,  setAuditTab]  = useState('messages')
  const [auditData, setAuditData] = useState([])
  const [auditStats,setAuditStats]= useState(null)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    api.get('/blockchain/stats').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'audit' && user?.role === 'admin') {
      setLoading(true)
      api.get(`/audit/${auditTab}`).then(({ data }) => setAuditData(data)).catch(() => {})
      api.get('/audit/stats').then(({ data }) => setAuditStats(data)).catch(() => {})
      setLoading(false)
    }
  }, [activeTab, auditTab, user])

  const [submitLoading, setSubmitLoading] = useState(false)

  const verify = async (e) => {
    e.preventDefault(); setChecking(true); setResult(null)
    try {
      const endpoint = type === 'post'
        ? `/blockchain/verify-post/${encodeURIComponent(query)}`
        : `/blockchain/verify-account/${encodeURIComponent(query)}`
      const { data } = await api.get(endpoint)
      setResult(data)
    } catch { setResult({ error: 'Verification failed — check the hash and try again' }) }
    setChecking(false)
  }

  const submitToAdmin = async () => {
    if (!query.trim()) return toast.error('Enter a hash first')
    setSubmitLoading(true)
    try {
      await api.post('/admin/submit-hash-verification', {
        hash: query.trim(),
        hashType: type === 'account' ? 'account' : 'post',
        context: result ? `Content: ${result.content || result.note || ''}` : 'User submitted from Blockchain page',
      })
      toast.success('✅ Submitted to Admin review panel! Admins will verify this hash.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    }
    setSubmitLoading(false)
  }

  const statCards = [
    { label: 'Accounts',         value: stats?.accounts,      icon: <FiUsers size={26} color="#004ac6" />, bg: 'rgba(0,74,198,0.1)' },
    { label: 'Posts',            value: stats?.posts,         icon: <FiFileText size={26} color="#006242" />, bg: 'rgba(0,98,66,0.1)' },
    { label: 'Messages',         value: stats?.messages,      icon: <FiMessageSquare size={26} color="#ba1a1a" />, bg: 'rgba(186,26,26,0.1)' },
    { label: 'AI Verifications', value: stats?.verifications, icon: <FiStar size={26} color="#6b38d4" />, bg: 'rgba(107,56,212,0.1)' },
    { label: 'Admin Flags',      value: stats?.flagged,       icon: <FiFlag size={26} color="#c2410c" />, bg: 'rgba(194,65,12,0.1)' },
    { label: 'Deletions',        value: stats?.deletions,     icon: <FiTrash2 size={26} color="#434656" />, bg: 'rgba(67,70,86,0.1)' },
  ]

  const isConnected = stats?.connected

  return (
    <div className="animate-fade-up" style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* ── Page Header ─────────────────────────── */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 8 }}>
            <FiShield style={{ color: 'var(--tertiary-container)', fontSize: '1.5rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>System Integrity & Audit</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Space Mono', monospace", fontSize: '0.625rem', fontWeight: 700, color: isConnected ? 'var(--tertiary-container)' : 'var(--danger)', background: isConnected ? 'rgba(0,98,66,0.10)' : 'var(--danger-dim)', padding: '0.2rem 0.75rem', borderRadius: 9999, textTransform: 'uppercase' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} className={isConnected ? 'animate-pulse-slow' : ''} />
              {isConnected ? 'HARDHAT ONLINE' : 'NODE OFFLINE'}
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.625rem', color: 'var(--text-muted)' }}>
              Last Sync: {new Date().toLocaleTimeString()} UTC
            </span>
          </div>
        </div>

        {/* Tab switcher (Admin only) */}
        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-3)', borderRadius: 10, padding: 4 }}>
            {[
              { id: 'blockchain', icon: <FiServer style={{ fontSize: '1rem' }} />, label: 'On-Chain Ledger' },
              { id: 'audit',      icon: <FiDatabase style={{ fontSize: '1rem' }} />, label: 'SQLite Audit DB' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0.5rem 1rem', borderRadius: 8,
                  fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                  fontFamily: "'Poppins', sans-serif",
                  background: activeTab === t.id ? 'linear-gradient(135deg,#004ac6,#2563eb)' : 'transparent',
                  color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'blockchain' ? (
        <>
          {/* ── My Account Block (Hero Panel) ────────────────── */}
          <div className="card-lift" style={{ 
            background: 'linear-gradient(135deg,rgba(0,74,198,0.03),rgba(107,56,212,0.03))', 
            borderRadius: 14, padding: '1.5rem', marginBottom: '2rem', 
            border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' 
          }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#004ac6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiBox size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text)' }}>My Account Block</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>{user?.blockchainTxHash ? 'CONFIRMED ON CHAIN' : 'PENDING OR OFFLINE'}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (!user?.accountHash) return toast.error('Account hash missing');
                  try {
                    await api.post('/admin/submit-verification', { accountHash: user.accountHash });
                    toast.success('Submitted for Admin Review');
                  } catch { toast.error('Submission failed (Offline mode?)') }
                }}
                className="btn-primary w-full md:w-auto" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8125rem' }}>
                Submit to Admin Review
              </button>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-4 bg-bg-3 p-4 rounded-lg">
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>Account Hash</div>
                <code style={{ fontSize: '0.75rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{user?.accountHash || '—'}</code>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>Blockchain Tx</div>
                <code style={{ fontSize: '0.75rem', color: 'var(--secondary)', wordBreak: 'break-all' }}>{user?.blockchainTxHash || 'null'}</code>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(user?.accountHash); toast.success('Hash copied'); }} className="btn-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>Copy Hash</button>
            </div>
          </div>

          {/* ── Live Stats Grid ─────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
            {statCards.map(({ label, value, icon, bg }) => (
              <div key={label} className="card-lift" style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                    {value ?? '—'}
                  </div>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
            {/* Node Status Card */}
            <div style={{
              background: isConnected ? 'rgba(0,98,66,0.06)' : 'var(--danger-dim)',
              borderRadius: 10, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: isConnected ? 'rgba(0,98,66,0.1)' : 'rgba(186,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isConnected ? <FiLink size={20} color="#006242" /> : <FiXCircle size={20} color="#ba1a1a" />}
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isConnected ? '#006242' : '#ba1a1a', fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                  {isConnected ? 'LIVE' : 'DOWN'}
                </div>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: isConnected ? '#006242' : '#ba1a1a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                  {isConnected ? 'Node Sync' : 'Offline'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Verify Block Integrity ──────────── */}
          {/* Left accent bar — decorative (allowed per spec), tonal card */}
          <div style={{
            background: 'var(--bg-2)', borderRadius: 12,
            borderLeft: '4px solid var(--primary)',
            padding: '2rem', marginBottom: '1.5rem',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FiShield style={{ color: 'var(--primary)', fontSize: 18 }} />
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text)' }}>Verify Block Integrity</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
                // Cryptographically verify post or account existence on Ethereum
              </p>
            </div>

            <form onSubmit={verify}>
              {/* Type Toggle */}
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg-3)', borderRadius: 8, padding: 4, width: 'fit-content', marginBottom: '1.25rem' }}>
                {['post', 'account'].map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '0.4rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: '0.8125rem', fontWeight: 600, fontFamily: "'Poppins', sans-serif",
                      background: type === t ? 'var(--bg-2)' : 'transparent',
                      color: type === t ? 'var(--primary)' : 'var(--text-muted)',
                      boxShadow: type === t ? 'var(--shadow)' : 'none', transition: 'all 0.15s',
                    }}>
                    {t === 'post' ? <FiFileText /> : <FiUsers />}
                    {t === 'post' ? 'Post Hash' : 'Account'}
                  </button>
                ))}
              </div>

              {/* Input + Submit */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input className="input" style={{ fontFamily: "'Space Mono', monospace", flex: 1 }}
                  placeholder={type === 'post' ? '0x18081be7...8e67 (post hash)' : 'Enter username or 0x account hash'}
                  value={query} onChange={e => setQuery(e.target.value)}
                />
                <button type="submit" disabled={checking || !query.trim()} className="btn-primary" style={{ padding: '0.625rem 1.5rem', whiteSpace: 'nowrap' }}>
                  {checking ? 'Verifying…' : 'Verify on Chain'}
                </button>
              </div>
            </form>

            {/* Result Panel */}
            {result && (
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                  ▶ BLOCKCHAIN_RESPONSE
                </p>
                <div style={{
                  background: result.error ? 'var(--danger-dim)' : result.verified ? 'rgba(0,98,66,0.08)' : 'var(--warning-dim)',
                  borderRadius: 8, padding: '1.25rem',
                  fontFamily: "'Space Mono', monospace", fontSize: '0.8125rem',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem',
                  border: `1px solid ${result.error ? '#fecaca' : result.verified ? '#bbf7d0' : '#fde68a'}`,
                }}>
                  {result.error ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 700 }}>
                      <FiXCircle /> {result.error}
                    </div>
                  ) : (
                    <>
                      {/* Status header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        {result.verified
                          ? <FiCheckCircle size={20} color="#006242" />
                          : <FiXCircle size={20} color="#ba1a1a" />}
                        <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: result.verified ? '#006242' : '#ba1a1a' }}>
                          {result.verified ? 'VERIFIED ✓' : 'NOT FOUND IN LEDGER'}
                        </span>
                        {result.source && (
                          <span style={{ fontSize: '0.5rem', padding: '2px 8px', borderRadius: 999, background: 'rgba(0,74,198,0.12)', color: '#004ac6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            source: {result.source}
                          </span>
                        )}
                      </div>
                      {/* Data rows */}
                      {Object.entries(result)
                        .filter(([k]) => !['verified', 'source', 'error'].includes(k))
                        .map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ width: 110, flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{k}</span>
                            <span style={{
                              fontWeight: 600, wordBreak: 'break-all', fontSize: '0.75rem',
                              color: k === 'isFlagged' && v ? '#ba1a1a' : k === 'isFlagged' ? '#006242' : 'var(--text)',
                            }}>
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                    </>
                  )}
                </div>

                {/* Submit to Admin button — shows after any verify */}
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={submitToAdmin}
                    disabled={submitLoading}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiFlag size={14} /> {submitLoading ? 'Sending…' : 'Submit Hash to Admin for Review'}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
                    {result.isFlagged ? '⚠ This content was flagged — admins will review the violation.' : result.verified ? '✓ Hash found — submit if you need admin manual confirmation.' : 'Hash not found — submit to request admin investigation.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Blockchain Architecture Info ──── */}
          <div style={{
            background: 'var(--bg-3)', borderRadius: 12, padding: '1.75rem',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '1.5rem',
          }}>
            {[
              { title: 'Layer 1 Contract', value: 'NexusProfile.sol', sub: 'Account hash registry', icon: <FiBox size={24} color="#004ac6" /> },
              { title: 'Consensus', value: 'Hardhat Local', sub: 'Proof-of-authority dev net', icon: <FiLink size={24} color="#006242" /> },
              { title: 'Hash Algorithm', value: 'SHA-256', sub: 'All content fingerprinted', icon: <FiShield size={24} color="#6b38d4" /> },
            ].map(({ title, value, sub, icon }) => (
              <div key={title}>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{title}</p>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', padding: 6, background: 'var(--bg-2)', borderRadius: 8 }}>{icon}</div> {value}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 4 }}>{sub}</p>
              </div>
            ))}
          </div>
        </>

      ) : (
        /* ── SQLITE AUDIT DB ────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Info Banner */}
          <div style={{ background: 'var(--primary-fixed)', borderLeft: '4px solid var(--primary)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: 18, color: 'var(--primary)', flexShrink: 0, marginTop: 2 }}>
              <FiInfo />
            </span>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>Central Audit Log — Append-Only SQLite</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>All actions are permanently recorded. Even if a user deletes content, the original and the deletion event remain forever preserved.</p>
            </div>
          </div>

          {/* Stats Summary */}
          {auditStats && (
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {[
                ['Messages', auditStats.messages || 0],
                ['Posts', auditStats.posts || 0],
                ['Deletions', auditStats.deletions || 0],
                ['Violence Events', auditStats.violence_events || 0],
                ['User Events', auditStats.user_events || 0],
              ].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center', padding: '0.75rem 1.25rem', background: 'var(--bg-2)', borderRadius: 8, boxShadow: 'var(--shadow)', minWidth: 100 }}>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{v}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{l}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['messages','posts','deletions','violence','users'].map(tab => (
              <button key={tab} onClick={() => setAuditTab(tab)} style={{
                padding: '0.4rem 1rem',
                borderRadius: 9999, border: 'none', cursor: 'pointer',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                background: auditTab === tab ? 'linear-gradient(135deg,#004ac6,#2563eb)' : 'var(--bg-4)',
                color: auditTab === tab ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>
                {tab} ({auditStats?.[tab === 'violence' ? 'violence_events' : tab === 'users' ? 'user_events' : tab] || 0})
              </button>
            ))}
          </div>

          {/* Table — alternating tonal rows instead of borders */}
          <div style={{ background: 'var(--bg-2)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", fontSize: '0.875rem' }}>
                Loading secure audit logs…
              </div>
            ) : (
              <AuditTable tab={auditTab} rows={auditData} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AuditTable({ tab, rows }) {
  const colMap = {
    messages:  ['Recorded At', 'Sender', 'Receiver', 'Content', 'Flagged', 'Event ID'],
    posts:     ['Recorded At', 'Author', 'Content Preview', 'Hash', 'Status'],
    deletions: ['Deleted At', 'Actor', 'Type', 'Preview', 'Reason'],
    violence:  ['Detected At', 'Content', 'Confidence', 'Action'],
    users:     ['Time', 'Event', 'Actor', 'Details'],
  }
  const cols = colMap[tab] || ['Data']

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
        {/* Header: slightly elevated tonal layer */}
        <thead>
          <tr style={{ background: 'var(--bg-4)' }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '0.75rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        {/* Alternating rows: surface / surface-container-low — no border  */}
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
                No records found in {tab} log.
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={row.id || i} style={{ background: i % 2 === 0 ? 'var(--bg-2)' : 'var(--bg-3)', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-5)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-2)' : 'var(--bg-3)'}
            >
              <td style={{ padding: '0.75rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {row.recorded_at || row.created_at ? new Date(row.recorded_at || row.created_at).toLocaleString() : '—'}
              </td>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--primary)' }}>
                @{row.sender_name || row.author_name || row.actor_name || '—'}
              </td>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.receiver_name || row.content_preview || row.target_type || '—'}
              </td>
              <td style={{ padding: '0.75rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.content || row.content_hash || row.reason || '—'}
              </td>
              {cols.length > 4 && (
                <td style={{ padding: '0.75rem 1rem' }}>
                  {row.is_flagged
                    ? <span className="badge-flagged">Flagged</span>
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>—</span>}
                </td>
              )}
              {cols.length > 5 && (
                <td style={{ padding: '0.75rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                  {(row.event_id || '—')?.toString().slice(0, 16)}…
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
