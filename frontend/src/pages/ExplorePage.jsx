import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import PostCard from '../components/post/PostCard'
import { HiSearch, HiSparkles } from 'react-icons/hi'

const MOCK_EXPLORE = [
  { _id: 'e1', content: 'Understanding the importance of SHA-256 for immutable state. #Crypto', author: { _id: 'a1', username: 'crypto_analyst', fullName: 'Alice Tech', avatar: '' }, likes: ['x','y','z'], comments: ['c1'], createdAt: new Date().toISOString(), isAI: false },
]

export default function ExplorePage() {
  const [posts,     setPosts]     = useState([])
  const [users,     setUsers]     = useState([])
  const [trends,    setTrends]    = useState([])
  const [query,     setQuery]     = useState('')
  const [loading,   setLoading]   = useState(true)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const [feedRes, trendRes] = await Promise.all([
        api.get(`/posts/explore${q ? `?q=${encodeURIComponent(q)}` : ''}`),
        !q ? api.get('/posts/trending') : Promise.resolve({ data: [] })
      ])
      
      setPosts(feedRes.data.length > 0 ? feedRes.data : MOCK_EXPLORE)
      if (!q) setTrends(trendRes.data)

      if (q.length > 1) {
        const { data: userData } = await api.get(`/users/search?q=${encodeURIComponent(q)}`)
        setUsers(userData)
      } else { 
        setUsers([]) 
      }
    } catch {
      setPosts(MOCK_EXPLORE)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const onSearch = (e) => {
    const q = e.target.value; setQuery(q)
    if (q.length === 0 || q.length > 1) load(q)
  }

  const handleDelete = (id) => setPosts(prev => prev.filter(p => p._id !== id))

  return (
    <div className="animate-fade-up" style={{fontFamily:'Poppins, sans-serif'}}>

      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Explore</h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Synthesizing network activity & peer insights.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono" style={{ background: 'var(--bg-4)', color: 'var(--text)' }}>LIVE_UPDATES</span>
          <span className="px-3 py-1 text-white rounded-full text-[10px] font-bold font-mono flex items-center gap-1" style={{ background: 'var(--secondary-container)' }}>
            <HiSparkles /> AI_OPTIMIZED
          </span>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:'var(--text-muted)', fontSize:'1.125rem'}} />
        <input
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border outline-none text-sm shadow-sm transition-all"
          style={{ background:'var(--bg-2)', color:'var(--text)', borderColor: 'var(--border)' }}
          placeholder="Search posts & users…"
          value={query}
          onChange={onSearch}
          onFocus={e=>{e.target.style.borderColor='var(--primary)'}}
          onBlur={e=>{e.target.style.borderColor='var(--border)'}}
        />
      </div>

      {!query && (
        <>
          {/* Dynamic AI Trending Slider */}
          <div className="relative overflow-hidden rounded-xl h-56 mb-6 group cursor-pointer border" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
             <div className="absolute inset-0 flex transition-transform duration-1000 ease-in-out" style={{ width: '300%', animation: 'slide-infinite 15s infinite' }}>
               {/* Slide 1 */}
               <div className="w-1/3 h-full relative" style={{background: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800) center/cover'}}>
                 <div className="absolute inset-0 bg-black/60 z-0"></div>
                 <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                   <span className="text-[10px] font-mono text-white mb-2 px-2 py-1 inline-block self-start rounded uppercase" style={{ background: 'var(--primary)' }}>#CYBER_RESILIENCE</span>
                   <h3 className="text-white text-2xl font-black mb-1">Global Node Matrix Update</h3>
                   <p className="text-white text-sm opacity-90 relative z-10">Thousands of validators synced successfully. Network integrity maxed.</p>
                 </div>
               </div>
               {/* Slide 2 */}
               <div className="w-1/3 h-full relative" style={{background: 'url(https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800) center/cover'}}>
                 <div className="absolute inset-0 bg-black/60 z-0"></div>
                 <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                   <span className="text-[10px] font-mono text-white mb-2 px-2 py-1 inline-block self-start rounded uppercase" style={{ background: 'var(--secondary)' }}>#AI_GOVERNANCE</span>
                   <h3 className="text-white text-2xl font-black mb-1">Decentralized Oracles Upgrade</h3>
                   <p className="text-white text-sm opacity-90 relative z-10">Szy Oracle v3 launched, enforcing strict consensus on flag policies.</p>
                 </div>
               </div>
               {/* Slide 3 */}
               <div className="w-1/3 h-full relative" style={{background: 'url(https://images.unsplash.com/photo-1639322537231-2f206e06af84?auto=format&fit=crop&q=80&w=800) center/cover'}}>
                 <div className="absolute inset-0 bg-black/60 z-0"></div>
                 <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                   <span className="text-[10px] font-mono text-white mb-2 px-2 py-1 inline-block self-start rounded uppercase" style={{ background: 'var(--success)' }}>#CONSENSUS_REACHED</span>
                   <h3 className="text-white text-2xl font-black mb-1">Proof of Staked Reasoning</h3>
                   <p className="text-white text-sm opacity-90 relative z-10">Validator nodes confirm zero downtime protocol logic execution.</p>
                 </div>
               </div>
             </div>
             <style>{`
               @keyframes slide-infinite {
                 0%, 25% { transform: translateX(0); }
                 33%, 58% { transform: translateX(-33.333%); }
                 66%, 91% { transform: translateX(-66.666%); }
                 100% { transform: translateX(0); }
               }
             `}</style>
          </div>
          
          {/* Dynamic Trending Tags */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {trends.length > 0 ? trends.slice(0, 2).map((trend, i) => (
              <div key={trend._id} className="card p-5 rounded-xl border-t-4 hover:-translate-y-1 transition-transform cursor-pointer" style={{ borderTopColor: i === 0 ? 'var(--primary)' : 'var(--secondary)' }} onClick={() => { setQuery(trend._id); load(trend._id); }}>
                <p className="text-[10px] font-mono mb-1 font-bold tracking-wider" style={{ color: i === 0 ? 'var(--primary)' : 'var(--secondary)' }}>HOT TOPIC</p>
                <h4 className="font-bold text-sm mb-2 truncate" style={{ color: 'var(--text)' }}>#{trend._id}</h4>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{trend.count} interaction{trend.count !== 1 ? 's' : ''}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--success)', background: 'var(--success-bg, rgba(34,197,94,0.1))' }}>Active</span>
                </div>
              </div>
            )) : (
              <div className="col-span-2 card p-6 text-center text-sm font-medium rounded-xl" style={{color: 'var(--text-muted)'}}>
                Not enough network activity to generate real-time trending topics yet. Add a hashtag to a post!
              </div>
            )}
          </div>

          {/* Analytics Panels from Explore were moved to RightPanel */}
        </>
      )}

      {/* People Results */}
      {query.length > 1 && users.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--text-muted)'}}>People</h2>
          <div className="space-y-2">
            {users.map(u => (
              <Link to={`/profile/${u.username}`} key={u._id}
                    className="card flex items-center gap-3 px-4 py-3 transition-colors"
                    onMouseOver={e=>e.currentTarget.style.background='var(--bg-3)'}
                    onMouseOut={e=>e.currentTarget.style.background='var(--glass-bg)'}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
                     style={{background:'var(--primary)'}}>
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-full" alt="" /> : u.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{color:'var(--text)'}}>{u.fullName}</div>
                  <div className="text-xs" style={{color:'var(--text-muted)'}}>@{u.username}</div>
                </div>
                {u.isFlagged && <span className="text-xs font-semibold" style={{color:'var(--danger)'}}>⚠ Flagged</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-4" style={{color:'var(--text-muted)'}}>
        <HiSearch /> {query ? 'Search Results' : 'Latest Feed Insights'}
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse" style={{ height:'120px' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-sm" style={{color:'var(--text-muted)'}}>
          No insights found.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p._id} post={p} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}
