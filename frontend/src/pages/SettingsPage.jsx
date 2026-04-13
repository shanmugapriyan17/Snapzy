import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiBell, FiShield } from 'react-icons/fi'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [location, setLocation] = useState(user?.location || '')
  const [website, setWebsite] = useState(user?.website || '')
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '')
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')
  const fileInputRef = useRef(null)

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('fullName', fullName)
      formData.append('bio', bio)
      formData.append('location', location)
      formData.append('website', website)
      formData.append('dob', dob)
      if (fileInputRef.current?.files?.[0]) {
        formData.append('avatar', fileInputRef.current.files[0])
      }

      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // Merge updated fields into auth context (real-time sync — no reload needed)
      const updatedUser = {
        ...user,
        fullName: data.fullName || fullName,
        bio: data.bio || bio,
        location: data.location || location,
        website: data.website || website,
        dob: data.dob || dob,
        avatar: data.avatar || user?.avatar,
      }
      updateUser(updatedUser)
      toast.success('Profile updated! Changes reflected across the platform.')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>Settings</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Manage your account preferences and profile details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="w-full md:w-64 shrink-0">
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<FiUser size={20} />} label="Edit Profile" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<FiLock size={20} />} label="Security" />
          <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={<FiBell size={20} />} label="Notifications" />
          <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} icon={<FiShield size={20} />} label="Web3 Wallet" />
        </div>

        {/* Settings Content Area */}
        <div className="card flex-1" style={{ padding: '2rem', borderRadius: 12, background: 'var(--bg-lowest)' }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Public Profile</h2>

              {/* Avatar Uploader UI */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-3)', overflow: 'hidden', border: '2px solid var(--border)' }} className="shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#004ac6,#6b38d4)', color: '#fff', fontSize: 28, fontWeight: 700 }}>
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) setAvatarPreview(URL.createObjectURL(e.target.files[0]))
                    }}
                  />
                  <button type="button" className="btn-ghost" onClick={() => fileInputRef.current?.click()} style={{ marginBottom: '0.25rem' }}>
                    Change Avatar
                  </button>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" className="input w-full" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input type="text" className="input w-full" value={`@${user?.username}`} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Your username is a unique blockchain identifier and cannot be changed.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <div className="flex-1">
                    <label className="label">Location</label>
                    <input type="text" className="input w-full" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bangalore" />
                  </div>
                  <div className="flex-1">
                    <label className="label">Date of Birth</label>
                    <input type="date" className="input w-full" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Personal Website</label>
                  <input type="text" className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea className="input" rows="4" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>Password & Security</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" placeholder="••••••••" />
                </div>
                <button type="button" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }} onClick={() => toast.success('Password update simulated successfully.')}>
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>Email Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ToggleRow label="Security Alerts" desc="Get notified about unrecognized logins or account changes." defaultChecked={true} />
                <ToggleRow label="New Followers" desc="Notification when someone starts following you." defaultChecked={true} />
                <ToggleRow label="Blockchain Verification" desc="Emails when your posts are permanently mined on-chain." defaultChecked={false} />
                <ToggleRow label="Marketing & News" desc="Receive occasional news about Snapzy updates." defaultChecked={false} />
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>Web3 Integration</h2>
              <div style={{ background: 'var(--bg-3)', padding: '1.5rem', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, background: '#f6851b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiShield size={24} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text)' }}>MetaMask Wallet</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Not connected</p>
                  </div>
                </div>
                <button type="button" className="btn-ghost" onClick={() => toast.error('MetaMask extension not found.')}>
                  Connect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem', borderRadius: '0.5rem',
        background: active ? 'var(--bg-3)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text-2)',
        fontWeight: active ? 600 : 500,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.2s', width: '100%',
        fontFamily: "'Poppins', sans-serif", fontSize: '0.875rem'
      }}
      onMouseOver={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; } }}
    >
      {icon}
      {label}
    </button>
  )
}

function ToggleRow({ label, desc, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <div style={{ paddingRight: '2rem' }}>
        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>{label}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        style={{ width: 44, height: 24, borderRadius: 12, background: checked ? 'var(--primary)' : 'var(--bg-3)', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}
      >
        <span style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}
