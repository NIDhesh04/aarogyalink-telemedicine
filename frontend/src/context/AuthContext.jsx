import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const MOCK_USERS = {
  patient: { id: 'p1', name: 'Ravi Kumar',      role: 'patient', phone: '9876543210', village: 'Rampur' },
  doctor:  { id: 'd1', name: 'Dr. Priya Sharma', role: 'doctor',  specialty: 'General Medicine', hospital: 'District Hospital Jaipur' },
  asha:    { id: 'a1', name: 'Sunita Devi',       role: 'asha',    zone: 'Block 4, Sikar' },
  admin:   { id: 'ad1', name: 'Admin User',       role: 'admin' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('aarogya_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((role) => {
    const u = MOCK_USERS[role]
    setUser(u)
    localStorage.setItem('aarogya_user', JSON.stringify(u))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('aarogya_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}