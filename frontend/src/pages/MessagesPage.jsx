import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getSocket } from '../services/socket'
import { formatDistanceToNow } from 'date-fns'
import { HiPaperAirplane, HiShieldCheck, HiSearch, HiX, HiChat, HiTrash, HiPhotograph, HiBan, HiShieldExclamation, HiEye } from 'react-icons/hi'
import toast from 'react-hot-toast'

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
  const endRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/messages/conversations').then(({ data }) => setConvos(data)).catch(() => { })
  }, [])

  useEffect(() => {
    if (!userId) {
      setActive(null)
      setMessages([])
      return
    }
    api.get(`/users/${userId}`).then(({ data }) => setActive(data)).catch(() => { })
    api.get(`/messages/${userId}`).then(({ data }) => setMessages(data)).catch(() => { })
  }, [userId])

  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Check block status when active user changes
  useEffect(() => {
    if (!active) return
    api.get(`/users/${me._id || me.id}`).then(({ data }) => {
      const isBlocked = data.blocked?.some(b => (b._id || b) === active._id)
      setBlocked(isBlocked)
    }).catch(() => { })
  }, [active])

  // Real-time socket events
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

  const deleteMsg = async (msgId) => {
    try {
      await api.delete(`/messages/${msgId}`)
      setMessages(p => p.filter(m => m._id !== msgId))
      toast.success('Message deleted')
    } catch { toast.error('Failed to delete') }
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

  const getImageSrc = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    return url
  }

  return (
    <div className="flex h-[calc(100vh-48px)] -mx-4 lg:mx-0 overflow-hidden relative">
      {/* Left Panel */}
      <div className={`${active ? 'hidden lg:flex' : 'flex'} w-full lg:w-72 border-r border-border flex-col bg-surface shrink-0 relative z-10`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-white">Messages</h2>
          <button onClick={() => setSearching(s => !s)} className="text-gray-500 hover:text-primary transition">
            {searching ? <HiX className="text-xl" /> : <HiSearch className="text-xl" />}
          </button>
        </div>

        {searching && (
          <div className="p-3 border-b border-border">
            <input autoFocus className="input text-sm py-2 w-full" placeholder="Search users…" value={searchQ} onChange={e => doSearch(e.target.value)} />
            {searchRes.map(u => (
              <button key={u._id} onClick={() => startConvo(u)} className="w-full text-left px-2 py-2.5 flex items-center gap-2 hover:bg-bg rounded-lg transition mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">{u.username?.[0]?.toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{u.fullName}</div>
                  <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 w-full">
          {convos.map(c => (
            <button key={c._id} onClick={() => navigate(`/messages/${c._id}`)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-bg transition flex items-center gap-3 ${userId === c._id ? 'bg-bg border-l-2 border-l-primary' : ''}`}>
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{c.user?.username?.[0]?.toUpperCase()}</div>
                {c.user?.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-surface" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white truncate">{c.user?.fullName}</div>
                <div className={`text-xs truncate ${c.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>{c.lastMessage?.content || 'Start chatting…'}</div>
              </div>
              {c.unreadCount > 0 && <span className="ml-auto bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">{c.unreadCount}</span>}
            </button>
          ))}
          {convos.length === 0 && !searching && (
            <div className="p-6 text-center text-gray-600">
              <HiChat className="text-3xl mx-auto mb-2" />
              <p className="text-xs mt-1">Click 🔍 to find someone!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Chat */}
      <div className={`${!active ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-bg w-full relative z-0`}>
        {active ? (
          <>
            {/* Header */}
            <div className="px-3 pl-14 lg:pl-5 lg:px-5 py-3 border-b border-border bg-surface flex items-center gap-2 lg:gap-3">
              <button className="lg:hidden p-2 text-gray-400 shrink-0 hover:text-white z-50 relative" onClick={() => navigate('/messages')}>
                <HiX className="text-xl" />
              </button>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{active.username?.[0]?.toUpperCase()}</div>
                {active.isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-surface" />}
              </div>
              <div className="flex-1 min-w-0" style={{ maxWidth: 'calc(100vw - 120px)' }}>
                <Link to={`/profile/${active.username}`} className="font-semibold text-white hover:text-primary transition truncate block">{active.fullName}</Link>
                <div className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
                  @{active.username} {active.isOnline ? <span className="text-green-400">● Online</span> : <span>● Offline</span>}
                </div>
              </div>
              <button onClick={toggleBlock} title={blocked ? 'Unblock user' : 'Block user'}
                className={`hidden md:flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition shrink-0 ${blocked ? 'border-primary text-primary bg-primary/10' : 'border-red/50 text-red hover:bg-red/10'}`}>
                <HiBan /> {blocked ? 'Unblock' : 'Block'}
              </button>
              <span className="badge-verified text-xs hidden sm:flex shrink-0"><HiShieldCheck /> On-Chain</span>
            </div>

            {/* Blocked banner */}
            {blocked && (
              <div className="bg-red/10 border-b border-red/20 text-red text-sm text-center py-2 font-medium">
                🚫 You have blocked this user. Unblock to send messages.
              </div>
            )}

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-gray-600 text-sm py-8">
                  <span className="inline-block text-3xl mb-2 text-primary" style={{ transform: 'rotate(15deg)' }}><HiEye /></span>
                  <p>Say hello to <span className="text-white font-medium">@{active.username}</span>!</p>
                </div>
              )}
              {messages.map(m => {
                const isMe = (m.sender?._id || m.sender) === me?._id
                // Show violence warning for flagged messages
                const isViolent = m.isFlagged && m.violenceWords?.length > 0
                return (
                  <div key={m._id}
                    className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    onMouseEnter={() => setHoveredMsg(m._id)}
                    onMouseLeave={() => setHoveredMsg(null)}>

                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-1">
                      {isMe ? me?.username?.[0]?.toUpperCase() : active?.username?.[0]?.toUpperCase()}
                    </div>

                    <div className={`flex flex-col max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Violence warning banner */}
                      {isViolent && (
                        <div className={`flex items-center gap-1 text-xs mb-1 text-orange ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          <HiShieldExclamation />
                          <span>⚠️ Violent word detected: <b>{m.violenceWords?.join(', ')}</b> — Reported to admins</span>
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        {/* Delete button (hover to show) */}
                        {hoveredMsg === m._id && (
                          <button onClick={() => deleteMsg(m._id)} title="Delete message"
                            className={`text-gray-600 hover:text-red transition p-1 rounded ${isMe ? 'order-first' : 'order-last'}`}>
                            <HiTrash className="text-sm" />
                          </button>
                        )}

                        {/* Bubble */}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isViolent
                          ? 'bg-orange/10 border border-orange/40 text-orange'
                          : isMe
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-surface border border-border text-gray-200 rounded-bl-sm'
                          }`}>
                          {/* Image in message */}
                          {m.mediaUrl && (
                            <div className="mb-2 rounded-xl overflow-hidden max-w-[200px]">
                              <img src={getImageSrc(m.mediaUrl)} alt="shared" className="w-full h-auto block" onError={e => e.target.style.display = 'none'} />
                            </div>
                          )}
                          {m.content && <span>{m.content}</span>}
                        </div>
                      </div>

                      {/* Timestamp + read receipt */}
                      <div className={`text-xs text-gray-600 mt-1 flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span>{m.createdAt ? formatDistanceToNow(new Date(m.createdAt), { addSuffix: true }) : ''}</span>
                        {isMe && (m.isRead
                          ? <span className="text-primary font-bold">✓✓</span>
                          : <span className="text-gray-500">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">{active?.username?.[0]?.toUpperCase()}</div>
                  <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '.15s' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '.3s' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Image preview */}
            {preview && (
              <div className="px-4 pb-0 pt-2 bg-surface border-t border-border flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setImage(null); setPreview(null) }}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 text-xs"><HiX /></button>
                </div>
                <span className="text-xs text-gray-500">Image ready to send</span>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={sendMsg} className="p-4 border-t border-border bg-surface flex gap-2 items-center">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={blocked}
                className="text-gray-500 hover:text-primary transition p-2 disabled:opacity-40" title="Send image">
                <HiPhotograph className="text-xl" />
              </button>
              <input
                className="input flex-1 py-2.5 rounded-full"
                placeholder={blocked ? 'Blocked — unblock to send' : 'Type a message…'}
                value={text}
                onChange={handleTyping}
                disabled={blocked}
              />
              <button type="submit" className="btn-primary px-4 py-2.5 rounded-full" disabled={blocked || (!text.trim() && !image)}>
                <HiPaperAirplane className="rotate-90" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-600">
            <div className="text-6xl">💬</div>
            <p className="font-semibold text-white text-lg">Your Messages</p>
            <p className="text-sm text-center max-w-xs">Private, AI-moderated, blockchain-anchored messaging.</p>
            <button onClick={() => setSearching(true)} className="btn-primary px-6 py-2.5 mt-2">
              <HiSearch className="inline mr-2" /> Start a conversation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
