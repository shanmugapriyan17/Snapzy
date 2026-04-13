import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../../context/AuthContext'
import BlockchainBadge from '../blockchain/BlockchainBadge'
import DeleteConfirmModal from '../ui/DeleteConfirmModal'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { FiHeart, FiMessageSquare, FiTrash2, FiFlag, FiAlertTriangle, FiShare2, FiEye, FiShield } from 'react-icons/fi'

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.likes?.some(l => (l._id || l) === user?._id))
  const [likeCount, setCount] = useState(post.likes?.length || 0)
  const [reporting, setReporting] = useState(false)
  const [commentCount] = useState(post.comments?.length || 0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleLike = async () => {
    setLiked(prev => !prev)
    setCount(prev => liked ? prev - 1 : prev + 1)
    try {
      const { data } = await api.post(`/posts/${post._id}/like`)
      setLiked(data.liked)
      setCount(data.likesCount)
    } catch {
      setLiked(prev => !prev)
      setCount(prev => liked ? prev + 1 : prev - 1)
      toast.error('Failed to like')
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await api.delete(`/posts/${post._id}`)
      setShowDeleteModal(false)
      // Rich blockchain-style toast notification
      toast.custom((t) => (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'var(--bg-2)',
          border: '1px solid rgba(220,38,38,0.25)',
          borderLeft: '4px solid var(--danger)',
          borderRadius: 12,
          padding: '0.875rem 1rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          maxWidth: 360,
          fontFamily: "'Poppins', sans-serif",
          opacity: t.visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(220,38,38,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FiTrash2 size={18} color="var(--danger)" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 3 }}>
              Post Deleted
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 6 }}>
              Removal permanently recorded on the blockchain.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-4)',
              borderRadius: 6, padding: '3px 8px',
              width: 'fit-content',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.5625rem', fontWeight: 700,
                color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                ⛓ DEL_HASH WRITTEN · IMMUTABLE
              </span>
            </div>
          </div>
        </div>
      ), { duration: 5000 })
      onDelete?.(post._id)
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setDeleting(false)
    }
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

  const isOwner = user?._id === (post.author?._id || post.author)
  const canDelete = isOwner || user?.role === 'admin'
  const canReport = !isOwner && user?.role !== 'admin'

  return (
    <>
      {/* ── Blockchain Delete Confirm Modal ─────────────────── */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

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
            style={{ background: '#fff7ed', borderColor: '#fed7aa' }}>
            <FiAlertTriangle style={{ color: 'var(--warning)', fontSize: '1.25rem', flexShrink: 0 }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--warning)' }}>
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
                  style={{ background: 'linear-gradient(135deg,#3c557e,#546e98)' }}>
                  {post.author?.avatar
                    ? <img src={post.author.avatar} className="w-full h-full object-cover" alt="" />
                    : post.author?.username?.[0]?.toUpperCase()}
                </div>
              </Link>
              <div className="min-w-0 flex flex-col justify-center">
                <Link to={`/profile/${post.author?.username}`}
                  className="text-sm font-semibold transition-colors truncate block"
                  style={{ color: 'var(--text)' }}
                  onMouseOver={e => e.target.style.color = '#3c557e'}
                  onMouseOut={e => e.target.style.color = 'var(--text)'}>
                  {post.author?.fullName}
                </Link>
                <div className="flex items-center gap-1 mt-0.5 truncate">
                  <span className="text-xs truncate shrink" style={{ color: 'var(--text-2)' }}>@{post.author?.username}</span>
                  <span className="text-[10px] shrink-0 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    · {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Delete / Report Buttons ─────────────────────────────── */}
            <div className="flex gap-1.5 shrink-0 items-start">
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete post — will be recorded on blockchain"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: 'rgba(220,38,38,0.08)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.6875rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    transition: 'all 0.18s ease',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--danger)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.3)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.08)'
                    e.currentTarget.style.color = 'var(--danger)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <FiTrash2 size={13} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
              {canReport && (
                <button onClick={reportPost} disabled={reporting}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseOver={e => e.currentTarget.style.color = '#c2410c'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Report post">
                  <FiFlag style={{ fontSize: '1rem' }} />
                </button>
              )}
            </div>
          </div>

          {/* Post Content */}
          <Link to={`/post/${post._id}`}>
            <p className="text-[14px] sm:text-[15px] leading-relaxed mb-3 sm:mb-4 whitespace-pre-wrap hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-2)' }}>
              {post.content}
            </p>
          </Link>

          {/* Post Image */}
          {post.media?.length > 0 && (
            <Link to={`/post/${post._id}`}>
              <div className="rounded-xl overflow-hidden mb-4 aspect-video"
                style={{ background: '#ebeef0' }}>
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

          {/* Blockchain Badge */}
          <div className="mb-3">
            <BlockchainBadge hash={post.postHash} txHash={post.blockchainTxHash} status={post.blockchainStatus} type="post" isFlagged={post.isFlagged} />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t pt-3 mt-1"
            style={{ borderColor: 'rgba(196,197,217,0.15)' }}>
            <div className="flex gap-4 sm:gap-6" style={{ color: 'var(--text-2)' }}>
              {/* Like */}
              <button
                onClick={toggleLike}
                className="flex items-center gap-1.5 transition-colors text-sm"
                style={{ color: liked ? 'var(--danger)' : 'var(--text-2)' }}
                onMouseOver={e => { if (!liked) e.currentTarget.style.color = '#ba1a1a' }}
                onMouseOut={e => { if (!liked) e.currentTarget.style.color = 'var(--text-2)' }}
              >
                <FiHeart style={{ fontSize: '1.2rem', fill: liked ? 'currentColor' : 'none', stroke: 'currentColor' }} />
                <span className="text-xs font-medium">{likeCount}</span>
              </button>

              {/* Comment */}
              <Link to={`/post/${post._id}`}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: 'var(--text-2)' }}
                onMouseOver={e => e.currentTarget.style.color = '#3c557e'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-2)'}>
                <FiMessageSquare style={{ fontSize: '1.2rem' }} />
                <span className="text-xs font-medium">{commentCount}</span>
              </Link>

              {/* Share */}
              <button
                onClick={sharePost}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: 'var(--text-2)' }}
                onMouseOver={e => e.currentTarget.style.color = '#3c557e'}
                onMouseOut={e => e.currentTarget.style.color = 'var(--text-2)'}
                title="Copy link">
                <FiShare2 style={{ fontSize: '1.2rem' }} />
              </button>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <FiEye style={{ fontSize: '1rem' }} />
              <span>{post.views || 0}</span>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
