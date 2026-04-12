import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { HiPhotograph, HiX } from 'react-icons/hi'

export default function PostComposer({ onPost }) {
  const { user } = useAuth()
  const [text,    setText]    = useState('')
  const [image,   setImage]   = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImage(null); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    if (!text.trim() && !image) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('content', text)
      if (image) formData.append('image', image)
      const { data } = await api.post('/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setText(''); removeImage()
      toast.success('Posted! Anchoring to blockchain…')
      onPost?.(data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post')
    }
    setLoading(false)
  }

  const initials = user?.username?.[0]?.toUpperCase()

  return (
    <section
      className="rounded-xl p-6 shadow-sm mb-8"
      style={{background:'var(--bg-2)', border:'1px solid var(--border)'}}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
             style={{background:'linear-gradient(135deg,var(--primary),var(--secondary))'}}>
          {user?.avatar
            ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
            : initials}
        </div>

        <div className="flex-1">
          <textarea
            className="w-full border-none focus:outline-none focus:ring-0 resize-none h-20 text-lg"
            style={{background:'transparent', color:'var(--text)', fontFamily:'Poppins, sans-serif', placeholder:'var(--text-muted)'}}
            placeholder="Curate your thoughts..."
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={2000}
          />

          {/* Image Preview */}
          {preview && (
            <div className="relative mt-2 rounded-xl overflow-hidden"
                 style={{background:'var(--bg-3)'}}>
              <img src={preview} alt="preview" className="w-full max-h-64 object-cover" />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 rounded-full p-1.5 text-sm transition-colors"
                style={{background:'var(--glass-bg)', color:'var(--text)'}}
                onMouseOver={e=>{e.currentTarget.style.background='var(--danger)'; e.currentTarget.style.color='#fff'}}
                onMouseOut={e=>{e.currentTarget.style.background='var(--glass-bg)'; e.currentTarget.style.color='var(--text)'}}>
                <HiX />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t"
               style={{borderColor:'var(--border)'}}>
            <div className="flex gap-2" style={{color:'var(--primary)'}}>
              <button
                onClick={() => fileRef.current?.click()}
                className="p-2 rounded-lg transition-colors"
                style={{color:'var(--primary)'}}
                onMouseOver={e=>e.currentTarget.style.background='var(--primary-bg)'}
                onMouseOut={e=>e.currentTarget.style.background='transparent'}
                title="Attach image">
                <HiPhotograph style={{fontSize:'1.5rem'}} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <span className="self-center text-xs font-medium" style={{color:'var(--text-muted)'}}>{text.length}/2000</span>
            </div>

            <button
              onClick={submit}
              disabled={loading || (!text.trim() && !image)}
              className="px-6 py-2 rounded-full font-semibold text-sm text-white transition-all"
              style={{background:'linear-gradient(135deg,var(--primary),var(--secondary))', opacity: (loading || (!text.trim() && !image)) ? 0.5 : 1}}>
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
