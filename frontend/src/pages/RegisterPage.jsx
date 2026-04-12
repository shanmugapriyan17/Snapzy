import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { HiShieldCheck } from 'react-icons/hi'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username:'', email:'', password:'', fullName:'', bio:'' })
  const [loading, setLoading] = useState(false)

  const up = (f) => (e) => setForm({ ...form, [f]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await register(form)
      toast.success('Identity minted on blockchain!')
      navigate('/')
    } catch (err) { toast.error(err.response?.data?.error || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/20 border border-primary/30 rounded-2xl mb-4">
            <HiShieldCheck className="text-primary text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Identity</h1>
          <p className="text-gray-500 text-sm mt-1">Your account will be anchored to the Ethereum blockchain</p>
        </div>

        <div className="card p-8 animate-fade-up">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full Name</label>
                <input className="input" type="text" placeholder="Jane Doe" value={form.fullName} onChange={up('fullName')} required />
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input" type="text" placeholder="janedoe" value={form.username} onChange={up('username')} required />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={up('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={up('password')} required />
            </div>
            <div>
              <label className="label">Bio <span className="normal-case font-normal text-gray-600">(optional)</span></label>
              <input className="input" type="text" placeholder="A short bio about yourself" value={form.bio} onChange={up('bio')} />
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Minting identity…' : 'Create Account →'}
            </button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            Already registered? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
