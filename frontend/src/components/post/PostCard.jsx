import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import BlockchainBadge from '../blockchain/BlockchainBadge'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiHeart, FiMessageSquare, FiTrash2, FiFlag, FiAlertTriangle, FiShare2, FiEye, FiShield } from 'react-icons/fi'

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked]     = useState(post.likes?.some(l => (l._id || l) === user?._id))
  const [likeCount, setCount] = useState(post.likes?.length || 0)
  const [reporting, setReporting] = useState(false)
  const [commentCount] = useState(post.comments?.length || 0)

  const toggleLike = async () => {
    // Optimistic update
    setLiked(prev => !prev)
    setCount(prev => liked ? prev - 1 : prev + 1)
    try {
      const { data } = await api.post(`/posts/${post._id}/like`)
      setLiked(data.liked)
      setCount(data.likesCount)
    } catch {
      // Revert on error
      setLiked(prev => !prev)
      setCount(prev => liked ? prev + 1 : prev - 1)
      toast.error('Failed to like')
    }
  }

  const deletePost = async () => {
    if (!window.confirm('Delete this post? The deletion will be permanently recorded on the blockchain.')) return
    try {
      await api.delete(`/posts/${post._id}`)
      toast.success('Post deleted (recorded on blockchain)')
      onDelete?.(post._id)
    } catch { toast.error('Failed to delete') }
  }

  const reportPost = async () => {
    setReporting(true)
    const reason = window.prompt('Why are you reporting this post?')
    if (!reason) { setReporting(false); return }
    try {
      await api.post(`/posts/${post._id}/report`, { reason })
      toast.success('Post reported to admins')
    } catch { toast.error('Report failed') }
    setReporting(false)
  }

  const sharePost = () => {
    const url = `${window.location.origin}/post/${post._id}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed'))
  }

  const isOwner  = user?._id === (post.author?._id || post.author)
  const canDelete = isOwner || user?.role === 'admin'
  const canReport = !isOwner && user?.role !== 'admin'

  return (
    <article
      className={`card glass-hover animate-fade-up overflow-hidden group transition-shadow hover:shadow-md ${post.isAI ? 'border-primary shadow-lg bg-primary-bg' : ''}`}
      style={post.isAI ? { borderLeft: '4px solid var(--secondary)' } : {}}
    >
      {post.isAI && (
        <div className="flex items-center gap-2 px-6 py-3 border-b" style={{ background: 'var(--secondary-dim)', borderColor: 'var(--border)' }}>
          <FiShield style={{ color: 'var(--secondary)', fontSize: '1rem' }} />
          <span style={{ fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            AI Synthesis Result
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)' }}>RELEVANCE: 98.4%</span>
        </div>
      )}

      {/* AI Flagged Warning Banner */}
      {post.isFlagged && (
        <div className="flex items-center gap-3 px-6 py-2.5 border-b"
             style={{background:'#fff7ed', borderColor:'#fed7aa'}}>
          <FiAlertTriangle style={{color:'var(--warning)', fontSize:'1.25rem', flexShrink:0}} />
          <p className="text-xs font-semibold uppercase tracking-wide" style={{color:'var(--warning)'}}>
            AI Moderation Warning{post.flagReason ? `: ${post.flagReason}` : ''}
          </p>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Header: Author + Actions */}
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex gap-3 min-w-0 flex-1">
            <Link to={`/profile/${post.author?.username}`} className="shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
                   style={{background:'linear-gradient(135deg,#3c557e,#546e98)'}}>
                {post.author?.avatar
                  ? <img src={post.author.avatar} className="w-full h-full object-cover" alt="" />
                  : post.author?.username?.[0]?.toUpperCase()}
              </div>
            </Link>
            <div className="min-w-0 flex flex-col justify-center">
              <Link to={`/profile/${post.author?.username}`}
                    className="text-sm font-semibold transition-colors truncate block"
                    style={{color:'var(--text)'}}
                    onMouseOver={e=>e.target.style.color='#3c557e'}
                    onMouseOut={e=>e.target.style.color='#181c1e'}>
                {post.author?.fullName}
              </Link>
              <div className="flex items-center gap-1 mt-0.5 truncate">
                <span className="text-xs truncate shrink" style={{color:'var(--text-2)'}}>@{post.author?.username}</span>
                <span className="text-[10px] shrink-0 whitespace-nowrap" style={{color:'var(--text-muted)'}}>
                  · {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Delete / Report */}
          <div className="flex gap-1 shrink-0">
            {canDelete && (
              <button onClick={deletePost}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{color:'var(--text-muted)'}}
                      onMouseOver={e=>e.currentTarget.style.color='#ba1a1a'}
                      onMouseOut={e=>e.currentTarget.style.color='#747688'}
                      title="Delete post">
                <FiTrash2 style={{fontSize:'1rem'}} />
              </button>
            )}
            {canReport && (
              <button onClick={reportPost} disabled={reporting}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{color:'var(--text-muted)'}}
                      onMouseOver={e=>e.currentTarget.style.color='#c2410c'}
                      onMouseOut={e=>e.currentTarget.style.color='#747688'}
                      title="Report post">
                <FiFlag style={{fontSize:'1rem'}} />
              </button>
            )}
          </div>
        </div>

        {/* Post Content — clicking opens PostDetail */}
        <Link to={`/post/${post._id}`}>
          <p className="text-[14px] sm:text-[15px] leading-relaxed mb-3 sm:mb-4 whitespace-pre-wrap hover:opacity-80 transition-opacity"
             style={{color:'var(--text-2)'}}>
            {post.content}
          </p>
        </Link>

        {/* Post Image */}
        {post.media?.length > 0 && (
          <Link to={`/post/${post._id}`}>
            <div className="rounded-xl overflow-hidden mb-4 aspect-video"
                 style={{background:'#ebeef0'}}>
              <img
                src={post.media[0].url}
                alt="Post media"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          </Link>
        )}

        {/* Blockchain Badge — prominent row */}
        <div className="mb-3">
          <BlockchainBadge hash={post.postHash} txHash={post.blockchainTxHash} status={post.blockchainStatus} type="post" />
        </div>

        {/* Footer: Actions */}
        <div className="flex items-center justify-between border-t pt-3 mt-1"
             style={{borderColor:'rgba(196,197,217,0.15)'}}>
          <div className="flex gap-4 sm:gap-6" style={{color:'var(--text-2)'}}>
            {/* Like */}
            <button
              onClick={toggleLike}
              className="flex items-center gap-1.5 transition-colors text-sm"
              style={{color: liked ? 'var(--danger)' : 'var(--text-2)'}}
              onMouseOver={e=>{ if(!liked) e.currentTarget.style.color='#ba1a1a' }}
              onMouseOut={e=>{ if(!liked) e.currentTarget.style.color='#434656' }}
            >
              <FiHeart style={{fontSize:'1.2rem', fill: liked ? 'currentColor' : 'none', stroke:'currentColor'}} />
              <span className="text-xs font-medium">{likeCount}</span>
            </button>

            {/* Comment — navigates to PostDetailPage */}
            <Link to={`/post/${post._id}`}
                  className="flex items-center gap-1.5 text-sm transition-colors"
                  style={{color:'var(--text-2)'}}
                  onMouseOver={e=>e.currentTarget.style.color='#3c557e'}
                  onMouseOut={e=>e.currentTarget.style.color='#434656'}>
              <FiMessageSquare style={{fontSize:'1.2rem'}} />
              <span className="text-xs font-medium">{commentCount}</span>
            </Link>

            {/* Share */}
            <button
              onClick={sharePost}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{color:'var(--text-2)'}}
              onMouseOver={e=>e.currentTarget.style.color='#3c557e'}
              onMouseOut={e=>e.currentTarget.style.color='#434656'}
              title="Copy link">
              <FiShare2 style={{fontSize:'1.2rem'}} />
            </button>
          </div>

          {/* Views */}
          <div className="flex items-center gap-1.5 text-xs" style={{color:'var(--text-muted)'}}>
            <FiEye style={{fontSize:'1rem'}} />
            <span>{post.views || 0}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
