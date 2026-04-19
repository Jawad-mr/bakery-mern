import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme]     = useState(() => localStorage.getItem('sc_theme') || 'light')
  const [bakeryName, setBakeryName] = useState('Sweet Crumb')
  const [bakeryLogo, setBakeryLogo] = useState('')

  const refreshMe = async () => {
    const r = await api.get('/auth/me')
    setUser(r.data.user)
    return r.data.user
  }

  const refreshSettings = async () => {
    const r = await api.get('/auth/settings')
    setBakeryName(r.data?.data?.bakeryName || 'Sweet Crumb')
    setBakeryLogo(r.data?.data?.bakeryLogo || '')
    return r.data?.data
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sc_theme', theme)
  }, [theme])

  useEffect(() => {
    const token = localStorage.getItem('sc_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      Promise.all([api.get('/auth/me'), api.get('/auth/settings')])
        .then(([me, settings]) => {
          setUser(me.data.user)
          setBakeryName(settings.data?.data?.bakeryName || 'Sweet Crumb')
          setBakeryLogo(settings.data?.data?.bakeryLogo || '')
        })
        .catch(() => { localStorage.removeItem('sc_token'); delete api.defaults.headers.common['Authorization'] })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    const { token, user } = r.data
    localStorage.setItem('sc_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    try { await refreshSettings() } catch {}
    return user
  }

  const register = async (name, email, password, role) => {
    const r = await api.post('/auth/register', { name, email, password, role })
    const { token, user } = r.data
    localStorage.setItem('sc_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    try { await refreshSettings() } catch {}
    return user
  }

  const logout = () => {
    localStorage.removeItem('sc_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const can = (role) => {
    const levels = { Admin: 3, Cashier: 2, Staff: 1 }
    return (levels[user?.role] || 0) >= (levels[role] || 0)
  }

  const initials = user ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, theme, toggleTheme, can, initials, bakeryName, bakeryLogo, refreshMe, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
