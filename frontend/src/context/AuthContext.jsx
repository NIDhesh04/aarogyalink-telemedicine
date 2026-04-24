import { createContext, useContext, useState, useCallback } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('aarogya_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password })
    setUser(data.user)
    localStorage.setItem('aarogya_user', JSON.stringify(data.user))
    localStorage.setItem('aarogya_token', data.token)
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await axiosInstance.post('/auth/register', payload)
    setUser(data.user)
    localStorage.setItem('aarogya_user', JSON.stringify(data.user))
    localStorage.setItem('aarogya_token', data.token)
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data.user
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('aarogya_user')
    localStorage.removeItem('aarogya_token')
    delete axiosInstance.defaults.headers.common['Authorization']
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}