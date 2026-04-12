import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PostCard from '../components/post/PostCard'
import SnapzyLoader from '../components/ui/SnapzyLoader'
import toast from 'react-hot-toast'
import { HiUserAdd, HiUserRemove, HiPencil, HiX, HiBadgeCheck, HiLocationMarker, HiCalendar, HiLink, HiShieldCheck, HiExclamationCircle, HiClipboardCopy } from 'react-icons/hi'

export default function ProfilePage() {
  const { username } = useParams()
  const { user: me } = useAuth()
  const [profile,   setProfile]   = useState(null)
  const [posts,     setPosts]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [following, setFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [showEdit,  setShowEdit]  = useState(false)
  const [editForm,  setEditForm]  = useState({ fullName: '', bio: '', location: '', website: '', dob: '' })
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    setLoading(true)
    const targetUsername = username === 'me' ? (me?.username || 'mock_user') : username
    Promise.all([api.get(`/users/${targetUsername}`), api.get(`/users/${targetUsername}/posts`)])
      .then(([u, p]) => {
        setProfile(u.data); setPosts(p.data)
        setFollowing(u.data.followers?.some(f => (f._id || f) === me?._id))
        setEditForm({ fullName: u.data.fullName || '', bio: u.data.bio || '', location: u.data.location || '', website: u.data.website || '', dob: u.data.dob ? new Date(u.data.dob).toISOString().split('T')[0] : '' })
      }).catch(() => {
        const mockProfile = { _id: 'm1', username: targetUsername, fullName: 'Offline User', role: 'user', accountHash: '0xabc123...offline', isFlagged: false, followers: [], following: [], verificationHistory: [] }
        setProfile(mockProfile)
        setPosts([])
        setEditForm({ fullName: 'Offline User', bio: 'Offline mode active.' })
      })
      .finally(() => setLoading(false))
  }, [username, me])

  const toggleFollow = async () => {
    try {
      const { data } = await api.post(`/users/${profile._id}/follow`)
      setFollowing(data.following)
      setProfile(prev => ({
        ...prev,
        followers: data.following
          ? [...(prev.followers || []), { _id: me._id, username: me.username, fullName: me.fullName }]
          : (prev.followers || []).filter(f => (f._id || f) !== me._id)
      }))
      toast.success(data.following ? 'Following!' : 'Unfollowed')
    } catch { toast.error('Failed') }
  }

  const saveProfile = async () => {
    try {
      const { data } = await api.put('/users/profile', editForm)
      setProfile(prev => ({ ...prev, ...data }))
      setShowEdit(false)
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
  }

  const handleDeletePost = (id) => setPosts(prev => prev.filter(p => p._id !== id))

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash).then(() => { setCopyMsg('Copied!'); setTimeout(() => setCopyMsg(''), 2000) })
  }

  if (loading) return <SnapzyLoader />
  
  if (!profile) return (
    <div className="card rounded-2xl p-10 text-center" style={{color:'var(--text-muted)'}}>User not found</div>
  )

  const isMe = me?._id === profile._id
  const tabs = [
    { id:'posts',      label:'Posts' },
    { id:'replies',    label:'Replies' },
    { id:'media',      label:'Media' },
    { id:'likes',      label:'Likes' },
  ]

  const joinDateText = `Joined ${new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`

  return (
    <div className="animate-fade-up max-w-[1000px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6" style={{fontFamily:'Poppins, sans-serif'}}>
      
      {/* ── MAIN COLUMN (Left / Feed) ─────────────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        
        {/* Profile Header Block */}
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          {/* Banner */}
          <div className="h-48 w-full relative" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-container) 100%)' }}>
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-bl from-primary to-transparent"></div>
            </div>
            {/* Avatar overlapping */}
            <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full overflow-hidden border-4" style={{ borderColor: 'var(--bg)', background:'var(--primary)' }}>
              {profile.avatar
                ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">{profile.username[0]?.toUpperCase()}</div>}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end p-4">
            {isMe ? (
              <button onClick={() => setShowEdit(true)} style={{ padding: '0.4rem 1rem', fontSize: '0.9375rem', fontWeight: 700, borderRadius: 999, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}>
                Edit profile
              </button>
            ) : (
              <button onClick={toggleFollow} style={{ padding: '0.4rem 1.25rem', fontSize: '0.9375rem', fontWeight: 700, borderRadius: 999, background: following ? 'transparent' : 'var(--text)', color: following ? 'var(--text)' : 'var(--bg)', border: following ? '1px solid var(--border)' : 'none' }}>
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="px-6 pb-4">
            <h1 className="text-xl font-black flex items-center gap-1" style={{ color: 'var(--text)', lineHeight: 1.2 }}>
              {profile.fullName}
              {!profile.isFlagged && <HiBadgeCheck style={{ color: 'var(--success)', fontSize: '1.25rem' }} />}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', mb: '1rem' }}>@{profile.username}</p>
            
            {(profile.bio || profile.isFlagged) && (
              <p className="mt-3 text-[0.9375rem]" style={{ color: 'var(--text)', lineHeight: 1.4 }}>
                {profile.bio || "Architecting the technical ledger."}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              {(profile.location || profile.dob || profile.createdAt) && (
                <>
                  {profile.location && <span className="flex items-center gap-1"><HiLocationMarker /> {profile.location}</span>}
                  {profile.website && <span className="flex items-center gap-1"><HiLink /> <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" style={{color: 'var(--primary)', textDecoration:'none'}}>{profile.website.replace(/^https?:\/\//, '')}</a></span>}
                  {profile.dob && <span className="flex items-center gap-1"><HiCalendar /> Born {new Date(profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                  <span className="flex items-center gap-1"><HiCalendar /> {joinDateText}</span>
                </>
              )}
            </div>

            <div className="flex gap-4 mt-3 text-[0.9375rem]">
              <span><b style={{ color: 'var(--text)' }}>{profile.following?.length || 0}</b> <span style={{ color: 'var(--text-muted)' }}>Following</span></span>
              <span><b style={{ color: 'var(--text)' }}>{profile.followers?.length || 0}</b> <span style={{ color: 'var(--text-muted)' }}>Followers</span></span>
            </div>
          </div>

          {/* Verification Banner */}
          {!profile.isVerified && isMe && (
            <div className="m-4 p-4 rounded-xl flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, var(--success), #0f3a2c)', color: '#fff' }}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg flex items-center gap-2">You aren't verified yet <HiBadgeCheck /></h3>
              </div>
              <p className="text-sm opacity-90">Get verified for boosted replies, immutable analytics, ad-free browsing, and platform governance options. Upgrade your profile now.</p>
              <button style={{ background: '#fff', color: '#0f3a2c', fontWeight: 800, padding: '0.5rem 1rem', borderRadius: 999, alignSelf: 'flex-start', border: 'none', cursor: 'pointer' }}>
                Get verified
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex w-full" style={{ borderBottom: '1px solid var(--border)' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-4 text-[0.9375rem] font-bold transition-all relative hover:bg-[var(--bg-3)]"
                style={{ color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full" style={{ background: 'var(--primary)' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content (Feed) */}
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <>
              {posts.map(p => <PostCard key={p._id} post={p} onDelete={handleDeletePost} />)}
              {posts.length === 0 && (
                <div className="card rounded-xl p-10 text-center text-sm" style={{ color:'var(--text-muted)' }}>
                  No posts to show.
                </div>
              )}
            </>
          )}

          {activeTab !== 'posts' && (
             <div className="card rounded-xl p-10 text-center text-sm" style={{ color:'var(--text-muted)' }}>
               {tabs.find(t=>t.id===activeTab)?.label} synchronization in progress... Check back later.
             </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col gap-4">

        {/* Blockchain Identity Card */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: "'Poppins', sans-serif" }}>
          <div className="flex items-center gap-2">
            {profile.blockchainStatus === 'confirmed'
              ? <HiShieldCheck style={{ color: 'var(--success)', fontSize: '1.25rem' }} />
              : <HiExclamationCircle style={{ color: 'var(--warning)', fontSize: '1.25rem' }} />}
            <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Blockchain Identity</h2>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: profile.blockchainStatus === 'confirmed' ? 'var(--success-dim)' : 'var(--warning-dim)',
                color:      profile.blockchainStatus === 'confirmed' ? 'var(--success)' : 'var(--warning)',
                border:     `1px solid ${profile.blockchainStatus === 'confirmed' ? 'var(--success)' : 'var(--warning)'}`
              }}>
              {profile.blockchainStatus === 'confirmed' ? '✓ On-Chain Verified' : '⏳ Pending Chain'}
            </span>
          </div>

          {/* Account Hash */}
          {profile.accountHash && (
            <div>
              <p className="text-[9px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em' }}>Account Hash</p>
              <button
                onClick={() => copyHash(profile.accountHash)}
                className="w-full text-left flex items-start gap-1 group"
                title="Click to copy full hash">
                <span className="font-mono text-[10px] break-all" style={{ color: 'var(--text-muted)' }}>
                  {profile.accountHash.slice(0, 20)}…{profile.accountHash.slice(-8)}
                </span>
                <HiClipboardCopy className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition text-primary" style={{ fontSize: '0.875rem' }} />
              </button>
              {copyMsg && <p className="text-[10px] text-green-600 mt-0.5 font-medium">{copyMsg}</p>}
            </div>
          )}

          {/* TX Hash */}
          {profile.blockchainTxHash && (
            <div>
              <p className="text-[9px] uppercase font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.08em' }}>TX Hash</p>
              <span className="font-mono text-[10px] break-all" style={{ color: 'var(--secondary)' }}>
                {profile.blockchainTxHash.slice(0, 20)}…{profile.blockchainTxHash.slice(-6)}
              </span>
            </div>
          )}

          {/* Verify link */}
          <Link
            to={`/blockchain?hash=${encodeURIComponent(profile.accountHash || '')}`}
            className="text-xs font-semibold hover:underline flex items-center gap-1"
            style={{ color: 'var(--primary)', marginTop: '0.25rem' }}>
            <HiShieldCheck /> Verify on Blockchain →
          </Link>
        </div>

        {/* What's Happening */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>What's happening</h2>
          <div className="flex flex-col cursor-pointer">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Technology - Trending</span>
            <span className="font-bold text-[0.9375rem]" style={{ color: 'var(--text)' }}>Snapzy Genesis Upgrade</span>
          </div>
          <div className="flex flex-col cursor-pointer">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Blockchain Oracle</span>
            <span className="font-bold text-[0.9375rem]" style={{ color: 'var(--text)' }}>Network Verification 100%</span>
          </div>
        </div>
      </div>

      {/* Edit Form Modal Overlay */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 rounded-2xl relative shadow-2xl">
            <button onClick={() => setShowEdit(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100">
              <HiX />
            </button>
            <h2 className="text-xl font-bold mb-4" style={{ color:'var(--text)' }}>Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={editForm.fullName} onChange={e => setEditForm(f => ({...f, fullName:e.target.value}))} />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea className="input min-h-[80px] py-3" value={editForm.bio} onChange={e => setEditForm(f => ({...f, bio:e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="City, Country" value={editForm.location} onChange={e => setEditForm(f => ({...f, location:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Website</label>
                  <input className="input" placeholder="https://yoursite.com" value={editForm.website} onChange={e => setEditForm(f => ({...f, website:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input className="input" type="date" value={editForm.dob} onChange={e => setEditForm(f => ({...f, dob:e.target.value}))} />
              </div>
              <button disabled={loading} onClick={saveProfile} className="btn-primary w-full py-3">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
