import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { HiShieldCheck } from 'react-icons/hi'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) { toast.error(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  const quickAdmin = (num) => {
    setEmail(`admin${num}@Snapzy.io`)
    setPassword(num === 1 ? 'admin@123' : 'admin@456')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 border border-primary/30 rounded-2xl mb-4">
            <HiShieldCheck className="text-primary text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your blockchain-verified identity</p>
        </div>

        <div className="card p-8 animate-fade-up">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            New here? <Link to="/register" className="text-primary hover:underline font-medium">Create Account</Link>
          </div>
        </div>

        {/* Admin quick-login buttons */}
        <div className="card p-4 mt-4 bg-primary/5 border-primary/20">
          <p className="text-xs text-gray-500 text-center mb-3 uppercase tracking-wide font-bold">Admin Quick Login</p>
          <div className="flex gap-2">
            <button onClick={() => quickAdmin(1)} className="flex-1 btn-ghost border border-primary/20 text-primary text-xs py-2 rounded-lg hover:bg-primary/10 transition">
              Admin 1
            </button>
            <button onClick={() => quickAdmin(2)} className="flex-1 btn-ghost border border-primary/20 text-primary text-xs py-2 rounded-lg hover:bg-primary/10 transition">
              Admin 2
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">Both admins see the same blockchain data</p>
        </div>
      </div>
    </div>
  )
}
