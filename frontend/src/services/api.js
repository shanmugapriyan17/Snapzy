import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('nexus_token')
      if (token !== 'mock_token') {
        localStorage.removeItem('nexus_token')
        localStorage.removeItem('nexus_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
