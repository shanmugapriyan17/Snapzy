import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import PostCard from '../components/post/PostCard'
import SnapzyLoader from '../components/ui/SnapzyLoader'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { FiArrowLeft, FiShield, FiAlertTriangle, FiClipboard, FiTrash2 } from 'react-icons/fi'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)

  useEffect(() => {
    api.get(`/posts/${id}`).then(({ data }) => setPost(data)).finally(() => setLoading(false))
  }, [id])

  const submitComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setIsPosting(true)
    try {
      const { data } = await api.post(`/posts/${id}/comment`, { content: comment })
      setPost(p => ({ ...p, comments: data }))
      setComment('')
      toast.success('Comment securely anchored!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post comment')
    } finally {
      setIsPosting(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDelete) return
    try {
      await api.delete(`/posts/${id}/comments/${commentToDelete}`)
      setPost(p => ({ ...p, comments: p.comments.filter(c => c._id !== commentToDelete) }))
      toast.success('Comment deleted from platform (audit retained on-chain).')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete comment')
    } finally {
      setCommentToDelete(null)
    }
  }

  if (loading) return <SnapzyLoader />
  if (!post) return (
    <div className="rounded-xl p-10 text-center" style={{ background: 'var(--bg-2)', color: 'var(--text-muted)' }}>Post not found in ledger.</div>
  )

  return (
    <div className="animate-fade-up space-y-4 relative" style={{ fontFamily: 'Poppins, sans-serif' }}>

      {/* Delete Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-in" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--danger-dim, #ffe5e5)' }}>
                <FiAlertTriangle size={24} style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Delete Comment?</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>This action removes it from the feed. Hash audits persist for integrity.</p>
              </div>
              <div className="flex w-full gap-3 mt-2">
                <button
                  onClick={() => setCommentToDelete(null)}
                  className="flex-1 py-2 rounded-full font-semibold transition-colors"
                  style={{ background: 'var(--bg-3)', color: 'var(--text)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="flex-1 py-2 rounded-full font-semibold transition-colors text-white"
                  style={{ background: 'var(--danger)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Navigation Bar */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors"
          style={{ color: 'var(--text)', background: 'var(--bg-3)' }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-4)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--bg-3)'}
        >
          <FiArrowLeft size={16} /> Return
        </button>
      </div>

      <PostCard post={post} />

      {/* Enhanced Comments Section */}
      <div className="rounded-xl p-6 md:p-8" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Protocol Discussion
          </h2>
          <span className="font-mono text-xs px-3 py-1 rounded-full font-bold" style={{ background: 'var(--bg-4)', color: 'var(--text-muted)' }}>
            {post.comments?.length || 0} REPLIES
          </span>
        </div>

        {/* Compose Comment */}
        <form onSubmit={submitComment} className="flex gap-4 mb-8 items-start relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden"
            style={{ background: 'linear-gradient(135deg,var(--primary),var(--secondary))' }}>
            {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all text-sm mb-2"
              style={{ background: 'var(--bg-2)', color: 'var(--text)', borderColor: 'var(--border)' }}
              placeholder="Inject your thoughts into the ledger…"
              value={comment}
              rows="2"
              disabled={isPosting}
              onChange={e => setComment(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!comment.trim() || isPosting}
                className="px-6 py-2 text-sm rounded-full font-bold transition-all text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', opacity: (!comment.trim() || isPosting) ? 0.5 : 1 }}
              >
                {isPosting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {isPosting ? 'Signing...' : 'Sign & Reply'}
              </button>
            </div>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-6">
          {(post.comments?.length === 0) && (
            <div className="text-center py-8 rounded-xl" style={{ background: 'var(--bg-2)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No consensus data recorded yet. Initialize the discussion.</p>
            </div>
          )}
          {post.comments?.map(c => {
            const isAuthor = user && (c.author?._id === user._id || c.author === user._id || user.role === 'admin')
            return (
              <div key={c._id} className="flex gap-4 animate-fade-in group relative">
                <Link to={`/profile/${c.author?.username}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm transition-transform hover:scale-105 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,var(--primary),var(--secondary))' }}>
                  {c.author?.avatar ? <img src={c.author.avatar} className="w-full h-full object-cover" /> : c.author?.username?.[0]?.toUpperCase()}
                </Link>
                <div className="flex-1 p-4 rounded-2xl rounded-tl-none border transition-colors" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${c.author?.username}`}
                        className="text-sm font-bold transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseOver={e => e.target.style.color = 'var(--primary)'}
                        onMouseOut={e => e.target.style.color = 'var(--text)'}>
                        {c.author?.fullName} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem' }}>@{c.author?.username}</span>
                      </Link>
                      <span className="text-[10px] font-mono font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                        • {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    {/* Delete Button */}
                    {isAuthor && !c.isDeleted && (
                      <button
                        onClick={() => setCommentToDelete(c._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-500/10 text-red-400"
                        title="Delete comment">
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {c.isDeleted ? <span className="italic opacity-50">Comment was deleted</span> : c.content}
                  </p>

                  {/* Blockchain Hash + Warnings */}
                  <div className="flex flex-col gap-1.5 mt-3">
                    {!c.isDeleted && c.commentHash && (
                      <button
                        onClick={() => navigator.clipboard.writeText(c.commentHash).then(() => toast.success('Hash copied!'))}
                        className="flex items-center gap-1.5 group/hash w-fit rounded py-1 px-2 transition-colors"
                        style={{ background: 'var(--bg-1)' }}
                        title="Click to copy full hash">
                        <FiShield size={10} style={{ color: 'var(--success)' }} className="shrink-0" />
                        <span style={{ fontSize: '0.65rem', fontFamily: "'Space Mono', monospace", color: 'var(--success)' }} className="opacity-80">
                          {c.commentHash === 'pending' ? 'TX: Pending…' : `TX: ${c.commentHash.slice(0, 10)}...${c.commentHash.slice(-6)}`}
                        </span>
                        <FiClipboard size={9} className="opacity-0 group-hover/hash:opacity-60 transition" style={{ color: 'var(--text)' }} />
                      </button>
                    )}
                    {c.isFlagged && !c.isDeleted && (
                      <div className="flex items-center gap-2 p-2 mt-1 rounded border shadow-sm" style={{ background: 'var(--danger-dim, rgba(239, 68, 68, 0.1))', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        <FiAlertTriangle size={12} className="shrink-0" />
                        <p className="text-[10px] font-bold tracking-wide uppercase">
                          Admin Alert: Moderation Violation ({c.flagReason || 'Violent Content'})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
