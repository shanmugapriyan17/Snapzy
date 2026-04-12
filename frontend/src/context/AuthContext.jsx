import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('nexus_token')
    const saved = localStorage.getItem('nexus_user')
    if (token && saved) {
      const parsedUser = JSON.parse(saved)
      setUser(parsedUser)

      api.get('/auth/me')
        .then(({ data }) => { setUser(data); localStorage.setItem('nexus_user', JSON.stringify(data)); connectSocket(data._id || data.id) })
        .catch(() => { localStorage.removeItem('nexus_token'); localStorage.removeItem('nexus_user'); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('nexus_token', data.token)
    localStorage.setItem('nexus_user', JSON.stringify(data.user))
    setUser(data.user)
    connectSocket(data.user.id || data.user._id)
    return data
  }, [])

  const register = useCallback(async (form) => {
    const { data } = await api.post('/auth/register', form)
    localStorage.setItem('nexus_token', data.token)
    localStorage.setItem('nexus_user', JSON.stringify(data.user))
    setUser(data.user)
    connectSocket(data.user.id || data.user._id)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nexus_token')
    localStorage.removeItem('nexus_user')
    disconnectSocket()
    setUser(null)
  }, [])

  const updateUser = useCallback((u) => {
    setUser(u)
    localStorage.setItem('nexus_user', JSON.stringify(u))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
