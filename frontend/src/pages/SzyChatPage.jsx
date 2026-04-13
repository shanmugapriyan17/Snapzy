import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import { FiSend, FiCpu, FiWifi, FiWifiOff, FiRefreshCw, FiZap } from 'react-icons/fi'
import { HiOutlineCube } from 'react-icons/hi'

const GREETING = "Hello! I am **Szy** — the intelligence layer powering Snapzy's AI moderation, blockchain oracle, and content verification. Ask me anything about the protocol, blockchain hashing, or Snapzy features!"

export default function SzyChatPage() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('szy_chat_main_history')
      return saved ? JSON.parse(saved) : [{ role: 'szy', text: GREETING, isOffline: false }]
    } catch { return [{ role: 'szy', text: GREETING, isOffline: false }] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)
  const [retryIn, setRetryIn] = useState(0)
  const bottomRef = useRef(null)
  const retryTimer = useRef(null)

  // Persist history
  useEffect(() => {
    sessionStorage.setItem('szy_chat_main_history', JSON.stringify(messages))
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages, loading])

  // Retry countdown
  useEffect(() => {
    if (retryIn > 0) {
      retryTimer.current = setTimeout(() => setRetryIn(r => r - 1), 1000)
    } else {
      if (offline && retryIn === 0 && messages.length > 1) setOffline(false)
    }
    return () => clearTimeout(retryTimer.current)
  }, [retryIn])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    const newMessages = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const { data } = await api.post('/chat', {
        message: userMsg,
        history: newMessages.slice(0, -1).slice(-10), // keep last 10 for context
        isSidebar: false,
      })
      setMessages(prev => [...prev, { role: 'szy', text: data.reply, isOffline: data.isOffline }])
      if (data.isOffline) {
        setOffline(true)
        setRetryIn(60)
      } else {
        setOffline(false)
        setRetryIn(0)
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Connection interrupted.'
      setMessages(prev => [...prev, {
        role: 'szy',
        text: `⚡ Szy is temporarily offline: ${errMsg}. Please try again shortly.`,
        isOffline: true,
      }])
      setOffline(true)
      setRetryIn(60)
    }
    setLoading(false)
  }

  const clearChat = () => {
    setMessages([{ role: 'szy', text: GREETING, isOffline: false }])
    sessionStorage.removeItem('szy_chat_main_history')
    setOffline(false)
    setRetryIn(0)
  }

  // Render markdown-style bold text
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 62px)', fontFamily: "'Poppins', sans-serif", gap: '0.875rem' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: 'linear-gradient(135deg,#ca8a04,#ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          flexShrink: 0, boxShadow: '0 4px 16px rgba(202,138,4,0.3)',
        }}>
          <FiCpu size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Szy AI</h1>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: offline ? 'rgba(220,38,38,0.1)' : 'rgba(5,150,105,0.1)',
              border: `1px solid ${offline ? 'rgba(220,38,38,0.25)' : 'rgba(5,150,105,0.25)'}`,
              borderRadius: 5, padding: '1px 7px',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: offline ? 'var(--danger)' : 'var(--success)', display: 'inline-block' }}
                className={offline ? '' : 'animate-pulse'} />
              {offline
                ? <FiWifiOff size={10} color="var(--danger)" />
                : <FiWifi size={10} color="var(--success)" />}
              <span style={{ fontSize: '0.5rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: offline ? 'var(--danger)' : 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {offline ? (retryIn > 0 ? `Rate limited · ${retryIn}s` : 'Offline') : 'Online · Oracle'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0, marginTop: 1, fontFamily: "'Space Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Snapzy Protocol Intelligence · Powered by Gemini
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-4)', borderRadius: 6, padding: '3px 8px' }}>
            <HiOutlineCube size={11} color="var(--warning)" />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.5rem', color: 'var(--warning)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>On-Chain</span>
          </div>
          <button onClick={clearChat} title="Clear conversation"
            style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)' }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
            <FiRefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Offline banner */}
      {offline && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 1rem',
          background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: 10, flexShrink: 0,
        }}>
          <FiWifiOff size={15} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--danger)', margin: 0 }}>Gemini API rate-limited</p>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              The free-tier daily quota for both API keys is exhausted. Szy will respond in offline mode.
              {retryIn > 0 && <> Auto-retry available in <strong style={{ color: 'var(--warning)' }}>{retryIn}s</strong>.</>}
            </p>
          </div>
          {retryIn === 0 && (
            <button onClick={() => setOffline(false)} style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 7, padding: '4px 10px', color: 'var(--danger)', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: "'Poppins', sans-serif" }}>
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Chat Area ────────────────────────────────────────── */}
      <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role !== 'user' && (
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, marginRight: 8, marginTop: 4,
                background: 'linear-gradient(135deg,#ca8a04,#ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              }}>
                <FiCpu size={15} />
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '0.75rem 1.125rem', borderRadius: 18,
              background: m.role === 'user'
                ? 'var(--primary)'
                : m.isOffline
                  ? 'rgba(220,38,38,0.07)'
                  : 'var(--bg-3)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              borderBottomRightRadius: m.role === 'user' ? 4 : 18,
              borderBottomLeftRadius: m.role !== 'user' ? 4 : 18,
              border: m.role === 'user' ? 'none'
                : m.isOffline
                  ? '1px solid rgba(220,38,38,0.2)'
                  : '1px solid var(--border)',
              lineHeight: 1.65, fontSize: '0.9rem',
              boxShadow: m.role === 'user' ? '0 2px 8px rgba(60,85,126,0.25)' : 'none',
            }}>
              {m.isOffline && m.role !== 'user' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid rgba(220,38,38,0.15)' }}>
                  <FiWifiOff size={10} color="var(--danger)" />
                  <span style={{ fontSize: '0.5rem', fontFamily: "'Space Mono', monospace", color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>OFFLINE MODE</span>
                </div>
              )}
              <span>{renderText(m.text)}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,#ca8a04,#ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}>
              <FiCpu size={15} />
            </div>
            <div style={{ padding: '0.75rem 1.125rem', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 0.18, 0.36].map((delay, i) => (
                <span key={i} style={{ width: 7, height: 7, background: '#ca8a04', borderRadius: '50%', display: 'inline-block', animation: `szydot 1.2s ${delay}s ease-in-out infinite` }} />
              ))}
            </div>
            <style>{`@keyframes szydot{0%,100%{opacity:0.3;transform:scale(0.7)}50%{opacity:1;transform:scale(1.2)}}`}</style>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Suggested prompts ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        {["What is Snapzy's blockchain?", "How does AI moderation work?", "Explain SHA-256 hashing", "What data is on-chain?"].map(q => (
          <button key={q} onClick={() => { setInput(q) }}
            style={{
              padding: '5px 12px', borderRadius: 99,
              background: 'var(--bg-3)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: '0.75rem', cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <FiZap size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{q}
          </button>
        ))}
      </div>

      {/* ── Input Bar ─────────────────────────────────────────── */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          className="input"
          placeholder={offline ? 'Szy is rate-limited — try again soon…' : 'Ask Szy about Snapzy, blockchain, or AI moderation…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, borderRadius: 99, paddingLeft: '1.25rem', paddingRight: '1.25rem' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: !input.trim() || loading ? 'var(--bg-4)' : 'linear-gradient(135deg,#ca8a04,#ea580c)',
            color: !input.trim() || loading ? 'var(--text-muted)' : '#fff',
            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            flexShrink: 0, transition: 'all 0.2s',
            boxShadow: input.trim() && !loading ? '0 4px 16px rgba(202,138,4,0.35)' : 'none',
          }}
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  )
}
