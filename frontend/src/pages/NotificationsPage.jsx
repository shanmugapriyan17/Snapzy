import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { HiHeart, HiChat, HiUserAdd, HiAtSymbol, HiBell } from 'react-icons/hi'
import toast from 'react-hot-toast'

const iconMap = { like: HiHeart, comment: HiChat, follow: HiUserAdd, mention: HiAtSymbol }

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setNotifs(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markAll = async () => {
    await api.put('/notifications/read-all')
    setNotifs(p => p.map(n => ({ ...n, isRead: true })))
    toast.success('All marked as read')
  }

  if (loading) return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl animate-pulse" style={{background:'var(--bg-3)', height:'64px'}} />
      ))}
    </div>
  )

  return (
    <div style={{fontFamily:'Poppins, sans-serif'}}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{color:'var(--text)'}}>Notifications</h1>
        {notifs.some(n => !n.isRead) && (
          <button
            onClick={markAll}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{color:'var(--primary)', background:'var(--primary-dim)'}}
          >
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{background:'var(--bg-3)', border:'1px solid var(--border)'}}>
          <HiBell style={{fontSize:'2.5rem', color:'var(--text-muted)', margin:'0 auto 0.75rem'}} />
          <p className="font-semibold" style={{color:'var(--text)'}}>You're all caught up</p>
          <p className="text-sm mt-1" style={{color:'var(--text-2)'}}>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const Icon = iconMap[n.type] || HiBell
            const iconColorMap = {
              like:    { icon: '#f87171' },
              comment: { icon: 'var(--primary)' },
              follow:  { icon: '#34d399' },
              mention: { icon: '#b48aff' },
            }
            const theme = iconColorMap[n.type] || { icon: 'var(--primary)' }
            return (
              <div key={n._id}
                   className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
                   style={{
                     background: !n.isRead ? 'var(--primary-bg)' : 'var(--bg-3)',
                     border: `1px solid ${!n.isRead ? 'var(--border-strong)' : 'var(--border)'}`,
                   }}>
                {/* Icon bubble */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                     style={{background:'var(--primary-dim)'}}>
                  <Icon style={{fontSize:'1.125rem', color: theme.icon}} />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight" style={{color:'var(--text)'}}>
                    {n.message || `${n.sender?.username || 'Someone'} ${n.type === 'like' ? 'liked' : n.type === 'comment' ? 'commented on' : n.type === 'follow' ? 'followed' : 'mentioned you in'} your post`}
                  </p>
                  <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>
                    {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                    {!n.isRead && <span style={{color:'var(--primary)', marginLeft:6, fontWeight:700}}>● New</span>}
                  </p>
                </div>
                {/* Link */}
                {n.postId && (
                  <Link to={`/post/${n.postId}`} className="text-xs font-semibold transition" style={{color:'var(--primary)'}}>View</Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
