import { useState, useEffect } from 'react'
import api from '../services/api'
import PostCard     from '../components/post/PostCard'
import PostComposer from '../components/post/PostComposer'
import SnapzyLoader from '../components/ui/SnapzyLoader'
import { useAuth }  from '../context/AuthContext'
import { FiGlobe, FiUsers, FiRefreshCw, FiStar } from 'react-icons/fi'

const MOCK_POSTS = [
  { _id: 'm1', content: 'Just deployed the new decentralized moderation nodes. #Architecture', author: { _id: 'sys', username: 'system_architect', fullName: 'Nexus Architect', avatar: '' }, likes: ['x','y'], comments: [], createdAt: new Date().toISOString(), isAI: true, aiScore: 0.92, aiReason: 'System update broadcast' },
  { _id: 'm2', content: 'Testing out the new Light Glass theme. It looks phenomenal on high-res displays!', author: { _id: 'u1', username: 'frontend_dev', fullName: 'UI Engineer', avatar: '' }, likes: ['a'], comments: ['c1','c2'], createdAt: new Date(Date.now() - 3600000).toISOString(), isAI: false },
]

export default function HomePage() {
  const { user }      = useAuth()
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [tab,     setTab]     = useState('forYou')

  const loadPosts = async (p = 1, append = false, currentTab = tab) => {
    if (!append) setLoading(true)
    let fetched = []
    try {
      const endpoint = currentTab === 'following'
        ? `/posts/feed?page=${p}`
        : `/posts/explore?page=${p}&limit=20`
      const { data } = await api.get(endpoint)
      fetched = data
    } catch { 
      // If the backend fails (MongoDB is down), inject mock posts
      if (p === 1 && !append) fetched = MOCK_POSTS
    } finally { 
      setPosts(prev => append ? [...prev, ...fetched] : fetched)
      setHasMore(fetched.length === 20)
      setLoading(false)
    }
  }

  useEffect(() => { setPage(1); loadPosts(1, false, tab) }, [tab])

  const handleNewPost = (post) => setPosts(prev => [post, ...prev])
  const handleDelete  = (id)   => setPosts(prev => prev.filter(p => p._id !== id))
  const loadMore      = () => { const next = page + 1; setPage(next); loadPosts(next, true) }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Welcome back, <span style={{ color:'var(--primary)' }}>{user?.fullName?.split(' ')[0]}</span>
          <FiStar color="#f59e0b" size={20} />
        </h1>
        <p style={{ fontSize:'0.8125rem', color:'var(--text-2)', marginTop:2 }}>Your sovereign digital reality is live. Cryptographically secured and completely immune to algorithmic manipulation.</p>
      </div>

      {/* Tab bar */}
      <div className="card" style={{ marginBottom:'1.25rem', padding:0 }}>
        <div className="tab-bar">
          <button className={`tab-item${tab === 'forYou' ? ' active' : ''}`} onClick={() => setTab('forYou')}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <FiGlobe size={15} /> For You
          </button>
          <button className={`tab-item${tab === 'following' ? ' active' : ''}`} onClick={() => setTab('following')}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <FiUsers size={15} /> Following
          </button>
        </div>

        {/* Composer inside the card */}
        <div style={{ padding:'1rem' }}>
          <PostComposer onPost={handleNewPost} />
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <SnapzyLoader />
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding:'3rem 2rem', textAlign:'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem', color: 'var(--primary)' }}>
            {tab === 'following' ? <FiUsers /> : <FiGlobe />}
          </div>
          <p style={{ fontWeight:600, color:'var(--text)', marginBottom:4 }}>
            {tab === 'following' ? 'Your following feed is empty' : 'No posts yet — be first!'}
          </p>
          <p style={{ fontSize:'0.8125rem', color:'var(--text-2)' }}>
            {tab === 'following' ? 'Follow people from Explore to see their posts.' : 'Create the first post on this blockchain-verified feed.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {posts.map(p => <PostCard key={p._id} post={p} onDelete={handleDelete} />)}
          </div>
          {hasMore && (
            <div style={{ textAlign:'center', marginTop:'1.25rem' }}>
              <button onClick={loadMore} className="btn-ghost" style={{ gap:6, fontSize:'0.8125rem' }}>
                <FiRefreshCw size={14} /> Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
