import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import PostCard from '../components/post/PostCard'
import SnapzyLoader from '../components/ui/SnapzyLoader'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { FiArrowLeft, FiShield, FiAlertTriangle, FiClipboard } from 'react-icons/fi'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post,    setPost]    = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/posts/${id}`).then(({ data }) => setPost(data)).finally(() => setLoading(false))
  }, [id])

  const submitComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    const { data } = await api.post(`/posts/${id}/comment`, { content: comment })
    setPost(p => ({ ...p, comments: data }))
    setComment('')
    toast.success('Comment securely anchored!')
  }

  if (loading) return <SnapzyLoader />
  if (!post) return (
    <div className="rounded-xl p-10 text-center" style={{background:'var(--bg-2)', color:'var(--text-muted)'}}>Post not found in ledger.</div>
  )

  return (
    <div className="animate-fade-up space-y-4" style={{fontFamily:'Poppins, sans-serif'}}>
      
      {/* Back Navigation Bar */}
      <div className="flex items-center mb-4">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors"
          style={{color: 'var(--text)', background: 'var(--bg-3)'}}
          onMouseOver={e=>e.currentTarget.style.background='var(--bg-4)'}
          onMouseOut={e=>e.currentTarget.style.background='var(--bg-3)'}
        >
          <FiArrowLeft size={16} /> Return 
        </button>
      </div>

      <PostCard post={post} />

      {/* Enhanced Comments Section */}
      <div className="rounded-xl p-8" style={{background:'var(--bg-3)', border:'1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)'}}>
        <div className="flex items-center justify-between border-b pb-4 mb-6" style={{borderColor: 'var(--border)'}}>
           <h2 className="text-xl font-bold" style={{color:'var(--text)'}}>
             Protocol Discussion
           </h2>
           <span className="font-mono text-xs px-3 py-1 rounded-full font-bold" style={{background: 'var(--bg-3)', color: 'var(--text-muted)'}}>
             {post.comments?.length || 0} REPLIES
           </span>
        </div>

        {/* Compose Comment */}
        <form onSubmit={submitComment} className="flex gap-4 mb-8 items-start">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
               style={{background:'linear-gradient(135deg,#3c557e,#546e98)'}}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all text-sm mb-2"
              style={{background:'var(--bg-2)', color:'var(--text)', borderColor: 'var(--border)'}}
              placeholder="Inject your thoughts into the ledger…"
              value={comment}
              rows="2"
              onChange={e => setComment(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-6 py-2 text-sm rounded-full font-bold transition-all text-white"
                style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))', opacity: !comment.trim() ? 0.5 : 1}}
              >
                Sign & Reply
              </button>
            </div>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-6">
          {(post.comments?.length === 0) && (
            <div className="text-center py-8 rounded-xl" style={{background: 'var(--bg-2)'}}>
               <p className="text-sm font-medium" style={{color:'var(--text-muted)'}}>No consensus data recorded yet. Initialize the discussion.</p>
            </div>
          )}
          {post.comments?.map(c => (
            <div key={c._id} className="flex gap-4 animate-fade-in group">
              <Link to={`/profile/${c.author?.username}`}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm transition-transform hover:scale-105"
                    style={{background:'linear-gradient(135deg,#3c557e,#546e98)'}}>
                {c.author?.username?.[0]?.toUpperCase()}
              </Link>
              <div className="flex-1 bg-gray-50/50 p-4 rounded-2xl rounded-tl-none border transition-colors" style={{borderColor: 'transparent'}} onMouseOver={e=>e.currentTarget.style.borderColor='var(--border)'} onMouseOut={e=>e.currentTarget.style.borderColor='transparent'}>
                <div className="flex items-center justify-between mb-1">
                  <Link to={`/profile/${c.author?.username}`}
                        className="text-sm font-bold transition-colors"
                        style={{color:'var(--text)'}}
                        onMouseOver={e=>e.target.style.color='var(--primary)'}
                        onMouseOut={e=>e.target.style.color='var(--text)'}>
                    {c.author?.fullName} <span style={{color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.75rem'}}>@{c.author?.username}</span>
                  </Link>
                  <span className="text-[10px] font-mono font-medium tracking-wide uppercase" style={{color:'var(--text-muted)'}}>
                    {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), {addSuffix:true}) : ''}
                  </span>
                </div>
                <p className="text-sm mt-1 leading-relaxed" style={{color:'var(--text-2)'}}>{c.content}</p>
                {/* Blockchain Hash + Warnings */}
                <div className="flex flex-col gap-1.5 mt-2">
                  {c.commentHash && (
                    <button
                      onClick={() => navigator.clipboard.writeText(c.commentHash).then(() => toast.success('Hash copied!'))}
                      className="flex items-center gap-1.5 group w-fit"
                      title="Click to copy full hash">
                      <FiShield size={10} style={{color: 'var(--success)'}} className="shrink-0" />
                      <span style={{fontSize: '0.6rem', fontFamily: "'Space Mono', monospace", color: 'var(--text-muted)'}}>
                        {c.commentHash === 'pending' ? 'TX: Pending…' : `TX: ${c.commentHash.slice(0, 10)}...${c.commentHash.slice(-6)}`}
                      </span>
                      <FiClipboard size={9} className="opacity-0 group-hover:opacity-60 transition" />
                    </button>
                  )}
                  {c.isFlagged && (
                     <div className="flex items-center gap-2 p-2 mt-1 rounded border" style={{background: 'var(--danger-dim, #fff0f0)', borderColor: 'var(--danger)', color: 'var(--danger)'}}>
                       <FiAlertTriangle size={12} className="shrink-0" />
                       <p className="text-[10px] font-bold tracking-wide uppercase">
                         Admin Alert: Moderation Violation ({c.flagReason || 'Irrelevant/Violence'})
                       </p>
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
