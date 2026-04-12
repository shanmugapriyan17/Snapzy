import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import { FiSend, FiCpu } from 'react-icons/fi'

export default function SzyChatPage() {
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('szy_chat_main_history');
    return saved ? JSON.parse(saved) : [{ role: 'szy', text: "Hello! I am Szy. I am the intelligence layer powering Snapzy's moderation and oracle services. How can I help you regarding our protocol?" }];
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    sessionStorage.setItem('szy_chat_main_history', JSON.stringify(messages))
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
      const { data } = await api.post('/chat', { message: userMsg, history: newMessages.slice(0,-1) })
      setMessages(prev => [...prev, { role: 'szy', text: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'szy', text: 'Sorry, my connection to the Snapzy network was interrupted.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', paddingBottom: '1rem', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Header */}
      <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ca8a04,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <FiCpu size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Szy AI</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--success)', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} className="animate-pulse" />
            Online - Network Oracle
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%', padding: '0.875rem 1.25rem', borderRadius: 18,
              background: m.role === 'user' ? 'var(--primary)' : 'var(--bg-3)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              borderBottomRightRadius: m.role === 'user' ? 4 : 18,
              borderBottomLeftRadius: m.role === 'szy' ? 4 : 18,
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              lineHeight: 1.6, fontSize: '0.9375rem'
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderRadius: 18, background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <span className="dot-bounce" style={{ width: 6, height: 6, background: 'var(--text-3)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
              <span className="dot-bounce" style={{ width: 6, height: 6, background: 'var(--text-3)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }} />
              <span className="dot-bounce" style={{ width: 6, height: 6, background: 'var(--text-3)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }} />
            </div>
            <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}`}</style>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input 
          className="input" 
          placeholder="Ask Szy about Snapzy..." 
          value={input} onChange={e => setInput(e.target.value)}
          style={{ flex: 1, borderRadius: 99, paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
        />
        <button type="submit" disabled={!input.trim() || loading} style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', opacity: input.trim() && !loading ? 1 : 0.6
        }}>
          <FiSend size={18} />
        </button>
      </form>
    </div>
  )
}
