import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { Link } from 'react-router-dom'
import { FiTrendingUp, FiUserPlus, FiActivity, FiCpu, FiSearch, FiShield, FiList } from 'react-icons/fi'

const S = {
  section: { background:'transparent', padding:'1rem 0', marginBottom:'0.875rem' },
  secHead: { display:'flex', alignItems:'center', gap:6, fontSize:'0.6875rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.875rem' },
}

function SzyChatWidget() {
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('szy_chat_sidebar_history');
    return saved ? JSON.parse(saved) : [{ role: 'szy', text: 'How can I assist you today?' }];
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
    sessionStorage.setItem('szy_chat_sidebar_history', JSON.stringify(messages))
  }, [messages, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const { data } = await api.post('/chat', { message: userMsg, history: newMessages.slice(0,-1), isSidebar: true })
      setMessages(prev => [...prev, { role: 'szy', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'szy', text: 'Error connecting.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'0.5rem', fontFamily: "'Poppins', sans-serif" }}>
      <div ref={containerRef} style={{ maxHeight: 150, overflowY: 'auto', display:'flex', flexDirection:'column', gap:'0.5rem', scrollbarWidth:'thin' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role==='user'?'flex-end':'flex-start', background: m.role==='user'?'var(--primary)':'var(--bg)', color: m.role==='user'?'#fff':'var(--text)', padding:'0.5rem 0.75rem', borderRadius:8, fontSize:'0.75rem', maxWidth:'85%' }}>
            {m.text}
          </div>
        ))}
        {loading && <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Szy is typing...</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={{ display:'flex', gap:'0.25rem' }}>
        <input className="input" placeholder="Ask something..." value={input} onChange={e=>setInput(e.target.value)} style={{ flex:1, padding:'0.4rem 0.75rem', fontSize:'0.75rem', borderRadius:999 }} />
        <button type="submit" disabled={!input.trim()||loading} style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:input.trim()&&!loading?'pointer':'not-allowed' }}>
          <FiCpu size={12} />
        </button>
      </form>
    </div>
  )
}

export default function RightPanel() {
  const [online,   setOnline]   = useState([])
  const [trending, setTrending] = useState([])

  useEffect(() => {
    api.get('/users/online').then(({ data }) => setOnline(data)).catch(() => {})
    api.get('/posts/trending').then(({ data }) => setTrending(data)).catch(() => {})
  }, [])

  return (
    <div style={{ paddingTop:'0.5rem' }}>
      {/* Search */}
      <div style={{ position:'relative', marginBottom:'1rem' }}>
        <FiSearch size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
        <input type="text" placeholder="Search Snapzy…" className="input" style={{ paddingLeft:'2rem', borderRadius:999, fontSize:'0.8125rem' }} />
      </div>

      {/* SZY AI CHAT WIDGET */}
      <section style={S.section}>
        <div style={{ background:'var(--bg-3)', padding:'0.75rem', borderRadius:12, border:'1px solid var(--primary)', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiCpu size={16} style={{ color:'var(--primary)' }} />
            <span style={{ fontSize:'0.8125rem', fontWeight:800, color:'var(--primary)' }}>Szy AI Assistant</span>
          </div>
          <p style={{ fontSize:'0.75rem', color:'var(--text-2)', lineHeight:1.4 }}>Ask Szy questions about the network, security, or blockchain logic.</p>
          <SzyChatWidget />
        </div>
      </section>

      {/* Analytics Panels from Explore */}
      <div className="grid grid-cols-1 gap-4 mb-4 mt-4">
        {/* Global AI Sentiment */}
        <div className="card p-5 rounded-2xl border" style={{borderColor: 'var(--border)'}}>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>Global AI Sentiment</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>OVERALL INDEX</span>
            <span className="font-black font-mono text-lg" style={{ color: 'var(--success)' }}>7.8</span>
          </div>
          <div className="h-1.5 w-full rounded-full mb-3 overflow-hidden" style={{ background: 'var(--bg-5)' }}>
            <div className="h-full" style={{ background: 'linear-gradient(90deg, var(--primary), var(--success))', width: '78%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            <span>SKEPTICISM</span>
            <span>OPTIMISM</span>
          </div>
        </div>

        {/* Network Integrity */}
        <div className="card p-5 rounded-2xl border" style={{borderColor: 'var(--border)'}}>
           <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text)' }}>Network Integrity</h3>
           <div className="space-y-3">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>ACTIVE NODES</span>
               <span className="text-xs font-bold font-mono" style={{ color: 'var(--text)' }}>1,249,031</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>TPS AVERAGE</span>
               <span className="text-xs font-bold font-mono" style={{ color: 'var(--secondary)' }}>4.5K</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>SYNC STATUS</span>
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full font-mono text-white" style={{ background: 'var(--success)' }}>OPTIMAL</span>
             </div>
           </div>
        </div>
      </div>

      {/* Suggested Users */}
      <section style={S.section}>
        <div style={S.secHead}><FiUserPlus size={12} style={{ color:'var(--primary)' }} /> Who to Follow</div>
        <SuggestedUsers />
      </section>

      {/* Online Now */}
      {online.length > 0 && (
        <section style={S.section}>
          <div style={S.secHead}><FiActivity size={12} style={{ color:'var(--success)' }} /> Online Now</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {online.map(u => (
              <Link key={u._id} to={`/profile/${u.username}`}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'0.3125rem 0.375rem', borderRadius:6, color:'var(--text)', textDecoration:'none', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--success)', flexShrink:0, animation:'pulseSlow 2s infinite' }} />
                <span style={{ fontSize:'0.8125rem' }}>@{u.username}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <div style={{ padding:'0.25rem 0.25rem', fontSize:'0.6875rem', color:'var(--text-muted)', lineHeight:1.8 }}>
        <p>© 2026 Snapzy Protocol</p>
      </div>
    </div>
  )
}

function NetworkPulse() {
  const [blockHeight, setBlockHeight] = useState(14290000)
  const [tps, setTps] = useState(4521)
  
  // Simulate live block incrementing
  useEffect(() => {
    const iv = setInterval(() => {
      setBlockHeight(b => b + Math.floor(Math.random() * 3))
      setTps(Math.floor(4000 + Math.random() * 1000))
    }, 4000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.6875rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>Block Height</span>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.875rem', fontWeight:700, color:'var(--text)' }}>#{blockHeight.toLocaleString()}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.6875rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>Network TPS</span>
        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.8125rem', fontWeight:600, color:'var(--secondary)' }}>{tps} Tx/s</span>
      </div>
      
      {/* AI Toxicity Index Widget */}
      <div style={{ background:'var(--bg-3)', padding:'0.75rem', borderRadius:10, marginTop:4, border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={{ fontSize:'0.625rem', color:'var(--text-muted)', fontWeight:700, letterSpacing:'0.05em' }}>AI TOXICITY RISK</span>
          <span style={{ fontSize:'0.625rem', color:'var(--success)', fontWeight:700 }}>LOW — 2%</span>
        </div>
        <div style={{ height:4, width:'100%', background:'var(--bg-5)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:'2%', background:'var(--success)' }} />
        </div>
      </div>
    </div>
  )
}

function RecentLedger() {
  const [txs, setTxs] = useState([
    { id: 1, hash: '0x8f...e112', type: 'TX_POST', amt: '2.4 ETH' },
    { id: 2, hash: '0x4a...d981', type: 'TX_VOTE', amt: '0.1 ETH' },
    { id: 3, hash: '0xc2...b445', type: 'TX_MINT', amt: '12.0 ETH' },
  ])

  useEffect(() => {
    const iv = setInterval(() => {
      setTxs(prev => {
        const types = ['TX_POST', 'TX_VOTE', 'TX_MINT']
        const next = [...prev]
        next.unshift({
          id: Date.now(),
          hash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
          type: types[Math.floor(Math.random() * types.length)],
          amt: (Math.random() * 5).toFixed(1) + ' ETH'
        })
        return next.slice(0, 4)
      })
    }, 6000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {txs.map(tx => (
        <div key={tx.id} className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-3)', padding:'0.5rem 0.75rem', borderRadius:8, border:'1px solid var(--border)' }}>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.6875rem', color:'var(--hash-color)' }}>{tx.hash}</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.625rem', color:'var(--text-muted)' }}>{tx.type}</span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.6875rem', fontWeight:700, color:'var(--text)' }}>{tx.amt}</span>
        </div>
      ))}
    </div>
  )
}

function SuggestedUsers() {
  const [users, setUsers] = useState([])
  const [followed, setFollowed] = useState(new Set())
  useEffect(() => {
    api.get('/users/suggested').then(({ data }) => setUsers(data.slice(0, 5))).catch(() => {})
  }, [])

  const follow = async (id) => {
    try { await api.put(`/users/${id}/follow`); setFollowed(prev => new Set([...prev, id])) } catch {}
  }

  if (users.length === 0) return <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>No suggestions yet</p>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      {users.map(u => (
        <div key={u._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link to={`/profile/${u.username}`} style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', minWidth:0 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--primary-container)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--inverse-text)', fontSize:13, fontWeight:700, flexShrink:0 }}>
              {u.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <p style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.fullName}</p>
              <p style={{ fontSize:'0.6875rem', color:'var(--text-muted)' }}>@{u.username}</p>
            </div>
          </Link>
          <button className="btn-ghost" style={{ padding:'0.25rem 0.75rem', fontSize:'0.6875rem', border:'1px solid var(--border)' }} onClick={() => follow(u._id)} disabled={followed.has(u._id)}>
            {followed.has(u._id) ? 'Followed' : 'Follow'}
          </button>
        </div>
      ))}
    </div>
  )
}
