import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import {
  HiShieldExclamation, HiRefresh, HiTrash, HiCheck, HiBan, HiSearch,
  HiUser, HiDocumentText, HiFlag, HiCheckCircle, HiEyeOff,
  HiChat, HiExclamation, HiShieldCheck, HiLink, HiSpeakerphone,
  HiLockClosed, HiLockOpen, HiXCircle, HiUsers
} from 'react-icons/hi'
import toast from 'react-hot-toast'

const TABS = ['Dashboard', 'Activity Feed', 'All Users', 'Content Violations', 'Deletion Log', 'Pending Verifications']

const actionIcons = {
  user_registered: <HiUser />, post_created: <HiDocumentText />, post_deleted: <HiTrash />, post_flagged: <HiFlag />,
  post_approved: <HiCheckCircle />, post_hidden: <HiEyeOff />, message_sent: <HiChat />, message_flagged: <HiExclamation />,
  admin_action: <HiShieldCheck />, blockchain_tx: <HiLink />, content_reported: <HiSpeakerphone />,
  user_suspended: <HiLockClosed />, user_unsuspended: <HiLockOpen />, user_deleted: <HiXCircle />
}

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [stats, setStats] = useState(null)
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => { api.get('/admin/dashboard').then(({ data }) => setStats(data)).catch(() => { }) }, [])

  useEffect(() => {
    setData([])
    if (tab === 1) api.get('/admin/activity').then(({ data }) => setData(data)).catch(() => { })
    if (tab === 2) api.get(`/admin/all-users?q=${search}`).then(({ data }) => setData(data)).catch(() => { })
    if (tab === 3) {
      Promise.all([api.get('/admin/flagged-users'), api.get('/admin/flagged-posts'), api.get('/admin/flagged-messages')])
        .then(([u, p, m]) => setData({ users: u.data, posts: p.data, messages: m.data })).catch(() => { })
    }
    if (tab === 4) api.get('/admin/deletion-log').then(({ data }) => setData(data)).catch(() => { })
    if (tab === 5) api.get('/admin/pending-verifications').then(({ data }) => setData(data)).catch(() => { })
  }, [tab, search])

  const scanAll = async () => { setScanning(true); const { data } = await api.post('/admin/analyze-all'); toast.success(`Scanned ${data.analyzed} users!`); setScanning(false) }
  const approvePost = async (id) => { await api.post(`/admin/approve-post/${id}`); toast.success('Post approved'); setData(p => ({ ...p, posts: p.posts?.filter(x => x._id !== id) })) }
  const removePost = async (id) => { await api.delete(`/admin/remove-post/${id}`); toast.success('Post hidden + blockchain recorded'); setData(p => ({ ...p, posts: p.posts?.filter(x => x._id !== id) })) }
  const unflagUser = async (id) => { await api.post(`/admin/unflag-user/${id}`); toast.success('User unflagged'); setData(p => ({ ...p, users: p.users?.filter(x => x._id !== id) })) }
  const suspendUser = async (id) => { if (!window.confirm('Suspend this user?')) return; await api.post(`/admin/suspend-user/${id}`); toast.success('User suspended + blockchain recorded') }
  const removeUser = async (id) => { if (!window.confirm('Remove user?')) return; await api.delete(`/admin/remove-user/${id}`); toast.success('User removed') }
  const approveVerification = async (id) => {
    await api.post(`/admin/approve-verification/${id}`)
    toast.success('✅ Account Verified on Blockchain')
    setData(prev => ({ ...prev, pendingUsers: (prev.pendingUsers || []).filter(x => x._id !== id) }))
  }
  const resolveHash = async (logId, verdict, details) => {
    await api.post(`/admin/resolve-hash/${logId}`, { verdict, originalDetails: details })
    toast.success(`Hash marked as ${verdict}`)
    setData(prev => ({ ...prev, hashRequests: (prev.hashRequests || []).filter(x => x._id !== logId) }))
  }

  return (
    <div className="animate-fade-up" style={{ maxWidth: 960, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <HiShieldExclamation style={{ color: 'var(--danger)', fontSize: '1.5rem' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Moderator Hub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--tertiary-container)', background: 'rgba(0,98,66,0.10)', padding: '0.15rem 0.625rem', borderRadius: 9999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SYSTEM_ONLINE
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--text-muted)' }}>
              Last Sync: {new Date().toLocaleTimeString()} UTC
            </span>
          </div>
        </div>
        <button onClick={scanAll} disabled={scanning} className="btn-primary">
          <HiRefresh style={{ animation: scanning ? 'spin 0.7s linear infinite' : 'none' }} />
          {scanning ? 'Scanning…' : 'Scan All Users'}
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {/* ── Admin Credentials Hint ──────────────── */}
      <div style={{ background: 'var(--primary-fixed)', borderLeft: '4px solid var(--primary)', borderRadius: 8, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--primary)', fontWeight: 700 }}>ADMIN_CREDS:</span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--text-2)' }}>admin1@snapzy.io / admin@123 &nbsp;|&nbsp; admin2@snapzy.io / admin@456</span>
      </div>

      {/* ── Tab Bar ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-3)', borderRadius: 10, padding: 4, marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '0.5rem 0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.8125rem', fontWeight: tab === i ? 700 : 500, whiteSpace: 'nowrap',
            background: tab === i ? 'linear-gradient(135deg,var(--primary),var(--secondary))' : 'transparent',
            color: tab === i ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ─── Tab 0: Dashboard ─────────────────── */}
      {tab === 0 && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Bento Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '1rem' }}>
            {[
              ['Total Users', stats.users, 'var(--primary)', <HiUsers />],
              ['Flagged Users', stats.flaggedUsers, 'var(--danger)', <HiFlag />],
              ['Total Posts', stats.posts, 'var(--primary)', <HiDocumentText />],
              ['Flagged Posts', stats.flaggedPosts, 'var(--danger)', <HiFlag />],
              ['Messages', stats.messages, 'var(--secondary)', <HiChat />],
              ['Flagged DMs', stats.flaggedMsgs, 'var(--warning)', <HiExclamation />],
              ['Deleted Posts', stats.deletedPosts, 'var(--warning)', <HiTrash />],
            ].map(([label, value, color, icon]) => (
              <div key={label} className="card-lift" style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1.25rem', textAlign: 'center', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.75rem', fontWeight: 800, color }}>{value ?? '—'}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>{label}</div>
              </div>
            ))}
            {/* Node status */}
            <div style={{ background: stats.chainStats?.connected ? 'rgba(0,98,66,0.08)' : 'var(--danger-dim)', borderRadius: 10, padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}><HiLink /></div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.5rem', fontWeight: 800, color: stats.chainStats?.connected ? 'var(--tertiary-container)' : 'var(--danger)' }}>
                {stats.chainStats?.connected ? 'LIVE' : 'DOWN'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: stats.chainStats?.connected ? 'var(--tertiary-container)' : 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginTop: 2 }}>
                {stats.chainStats?.connected ? 'Node Online' : 'Node Offline'}
              </div>
            </div>
          </div>

          {/* On-Chain Stats Bar */}
          {stats.chainStats?.connected && (
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '1.25rem 1.5rem' }}>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.75rem' }}>
                ● ON_CHAIN_STATS
              </p>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {['accounts', 'posts', 'messages', 'verifications', 'flagged', 'deletions'].map(k => (
                  <div key={k}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{k}: </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--tertiary-container)', fontWeight: 700 }}>
                      {String(stats.chainStats?.[k] ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 1: Activity Feed ──────────────── */}
      {tab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.length === 0 && (
            <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', boxShadow: 'var(--shadow)' }}>No activity yet.</div>
          )}
          {data.map?.(log => (
            <div key={log._id} style={{
              background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
              borderLeft: `4px solid ${log.severity === 'critical' ? 'var(--danger)' : log.severity === 'warning' ? 'var(--warning)' : 'var(--tertiary-container)'}`,
              boxShadow: 'var(--shadow)',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{actionIcons[log.action] || '📋'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>{log.action?.replace(/_/g, ' ')}</span>
                  <span className={`tech-chip ${log.severity === 'critical' ? 'tech-chip-error' : log.severity === 'warning' ? 'tech-chip-warning' : 'tech-chip-verified'}`}>{log.severity}</span>
                </div>
                {log.actor && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>by @{log.actor.username}</p>}
                {log.details && <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 4 }}>{log.details}</p>}
                {log.blockchainTxHash && (
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.625rem', color: 'var(--tertiary-container)', marginTop: 4 }}>⛓️ {log.blockchainTxHash}</p>
                )}
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.625rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tab 2: All Users ──────────────────── */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <input className="input" placeholder="Search users by name, username, or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
            <button className="btn-primary" style={{ padding: '0 1.25rem' }}><HiSearch /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.map?.(u => (
              <div key={u._id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', boxShadow: 'var(--shadow)' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, background: u.isFlagged ? 'var(--danger-dim)' : 'var(--primary-fixed)', color: u.isFlagged ? 'var(--danger)' : 'var(--primary)' }}>
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/profile/${u.username}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none', fontSize: '0.9375rem' }}>{u.fullName}</Link>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    @{u.username} · {u.email} · <span style={{ color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }}>{u.role}</span>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 3 }}>
                    Posts: {u.postsCount} · Followers: {u.followersCount} · Fake Score: {u.fakeScore}%
                    {u.isFlagged && <span style={{ color: 'var(--danger)', fontWeight: 700 }}> 🚩 FLAGGED</span>}
                    {!u.isActive && <span style={{ color: 'var(--warning)', fontWeight: 700 }}> 🔒 SUSPENDED</span>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => suspendUser(u._id)} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', color: 'var(--warning)' }}><HiBan /></button>
                  <button onClick={() => removeUser(u._id)} className="btn-danger" style={{ padding: '0.4rem 0.75rem' }}><HiTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Tab 3: Flagged Content ────────────── */}
      {tab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Flagged Users */}
          <FlaggedSection title="Flagged Users" count={data.users?.length} borderColor="var(--danger)">
            {data.users?.map(u => (
              <div key={u._id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', borderLeft: '4px solid var(--danger)', boxShadow: 'var(--shadow)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontWeight: 700 }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <Link to={`/profile/${u.username}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>@{u.username}</Link>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Fake Score: <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{u.fakeScore}%</span></p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => unflagUser(u._id)} className="btn-ghost" style={{ color: 'var(--tertiary-container)', fontSize: '0.8125rem' }}><HiCheck /> Unflag</button>
                  <button onClick={() => removeUser(u._id)} className="btn-danger" style={{ fontSize: '0.8125rem' }}><HiTrash /></button>
                </div>
              </div>
            ))}
          </FlaggedSection>

          {/* Flagged Posts */}
          <FlaggedSection title="Flagged Posts" count={data.posts?.length} borderColor="var(--warning)">
            {data.posts?.map(p => (
              <div key={p._id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem', borderLeft: '4px solid var(--warning)', boxShadow: 'var(--shadow)' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>@{p.author?.username} · Moderation Score: <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.moderationScore}%</span></p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{p.content}</p>
                  {p.flagReason && <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--warning)', marginTop: 6 }}>Reason: {p.flagReason}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => approvePost(p._id)} className="btn-ghost" style={{ color: 'var(--tertiary-container)', fontSize: '0.8125rem' }}><HiCheck /></button>
                  <button onClick={() => removePost(p._id)} className="btn-danger" style={{ fontSize: '0.8125rem' }}><HiTrash /></button>
                </div>
              </div>
            ))}
          </FlaggedSection>

          {/* Flagged Messages */}
          <FlaggedSection title="Flagged Messages" count={data.messages?.length} borderColor="var(--secondary)">
            {data.messages?.map(m => (
              <div key={m._id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem', borderLeft: '4px solid var(--secondary)', boxShadow: 'var(--shadow)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>@{m.sender?.username} → @{m.receiver?.username} · Score: <span style={{ color: 'var(--danger)' }}>{m.moderationScore}%</span></p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{m.content}</p>
                {m.flagReason && <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: 'var(--warning)', marginTop: 6 }}>{m.flagReason}</p>}
              </div>
            ))}
          </FlaggedSection>
        </div>
      )}

      {/* ─── Tab 4: Deletion Log (SQLite Audit) ─── */}
      {tab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ● IMMUTABLE SQLite AUDIT LOG — {data.length || 0} RECORDS
            </span>
          </div>
          {data.length === 0 && (
            <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', boxShadow: 'var(--shadow)' }}>No deletions recorded yet.</div>
          )}
          {data.map?.((d) => (
            <div key={d.id} style={{
              background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
              borderLeft: `4px solid ${d.target_type === 'comment' ? 'var(--secondary)' : 'var(--danger)'}`,
              boxShadow: 'var(--shadow)',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                {d.target_type === 'comment' ? '💬' : '🗑️'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Type badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', fontWeight: 700,
                    padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: d.target_type === 'comment' ? 'var(--secondary-dim)' : 'var(--danger-dim)',
                    color: d.target_type === 'comment' ? 'var(--secondary)' : 'var(--danger)',
                  }}>{d.target_type} DELETED</span>
                  {d.had_violence === 1 && (
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: 'var(--warning-dim)', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      ⚠ VIOLENCE DETECTED
                    </span>
                  )}
                </div>
                {/* Content preview */}
                {d.content_preview && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text)', fontStyle: 'italic', marginBottom: 4 }}>
                    "{d.content_preview.slice(0, 120)}{d.content_preview.length > 120 ? '…' : ''}"
                  </p>
                )}
                {/* Actor / target info */}
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span>Deleted by: <span style={{ color: 'var(--text-2)', fontWeight: 700 }}>@{d.actor_name}</span></span>
                  <span>ID: <span style={{ color: 'var(--text-muted)' }}>{d.target_id?.slice(-10)}</span></span>
                  {d.reason && <span>Reason: {d.reason}</span>}
                </div>
                {/* Hash */}
                {d.content_hash && (
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--success)', marginTop: 2 }}>
                    ⛓ HASH: {d.content_hash}
                  </p>
                )}
                {/* Violence words */}
                {d.violence_words && (
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--danger)', marginTop: 2 }}>
                    Flagged words: {d.violence_words}
                  </p>
                )}
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5625rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' }}>
                {d.deleted_at ? (() => { try { return formatDistanceToNow(new Date(d.deleted_at), { addSuffix: true }) } catch { return d.deleted_at } })() : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tab 5: Pending Verifications ───────────────────── */}
      {tab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Account Verifications */}
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HiShieldCheck style={{ color: 'var(--primary)' }} /> Account Verification Requests ({(data.pendingUsers || []).length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(data.pendingUsers || []).length === 0 && (
                <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending account verifications</div>
              )}
              {(data.pendingUsers || []).map(u => (
                <div key={u._id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', boxShadow: 'var(--shadow)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
                    {u.username?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/profile/${u.username}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none', fontSize: '0.9375rem' }}>{u.fullName}</Link>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>@{u.username} · {u.email}</p>
                    <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--tertiary-container)', marginTop: 4, wordBreak: 'break-all' }}>Account Hash: {u.accountHash}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => approveVerification(u._id)} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', color: 'var(--tertiary-container)' }}><HiCheck /> Verify ✓</button>
                    <button onClick={() => suspendUser(u._id)} className="btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}><HiBan /> Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hash Verification Requests (posts, messages, comments) */}
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HiLink style={{ color: 'var(--secondary)' }} /> Hash Verification Submissions ({(data.hashRequests || []).length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(data.hashRequests || []).length === 0 && (
                <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hash submissions yet</div>
              )}
              {(data.hashRequests || []).map(log => (
                <div key={log._id} style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1rem 1.25rem', boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flexWrap: 'wrap' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, background: 'var(--secondary-dim)', color: 'var(--secondary)' }}>
                      {log.actor?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link to={`/profile/${log.actor?.username}`} style={{ fontWeight: 700, color: 'var(--text)', textDecoration: 'none', fontSize: '0.875rem' }}>@{log.actor?.username}</Link>
                        <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 999, background: 'var(--secondary-dim)', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{log.targetType || 'post'}</span>
                        {log.severity === 'warning' && <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 999, background: 'var(--warning-dim)', color: 'var(--warning)', fontWeight: 700, border: '1px solid var(--warning)' }}>⚠ Flagged Content</span>}
                      </div>
                      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>
                        HASH: {log.contentHash || log.target}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: 4 }}>{log.details}</p>
                      <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 2 }}>{log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => resolveHash(log._id, 'verified', log.details)} className="btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: 'var(--tertiary-container)' }}><HiCheck /> Verified</button>
                      <button onClick={() => resolveHash(log._id, 'rejected', log.details)} className="btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}><HiBan /> Rejected</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}


function FlaggedSection({ title, count, borderColor, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ width: 3, height: 18, background: borderColor, borderRadius: 2, flexShrink: 0 }} />
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-4)', padding: '0.1rem 0.5rem', borderRadius: 9999 }}>
          {count || 0}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {count === 0 && <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', boxShadow: 'var(--shadow)' }}>None flagged</div>}
        {children}
      </div>
    </div>
  )
}
