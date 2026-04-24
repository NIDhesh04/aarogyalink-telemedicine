import { useState } from 'react'

function useAuth() {
  const [user, setUser] = useState(null)

  const login = (role) => {
    // Mock login — Week 4 will replace this with real JWT call
    const mockUsers = {
      patient: { id: '1', name: 'Ravi Kumar', role: 'patient' },
      doctor:  { id: '2', name: 'Dr. Priya Sharma', role: 'doctor' },
      asha:    { id: '3', name: 'Sunita Devi', role: 'asha' },
      admin:   { id: '4', name: 'Admin User', role: 'admin' },
    }
    setUser(mockUsers[role])
    localStorage.setItem('mockUser', JSON.stringify(mockUsers[role]))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('mockUser')
  }

  const getStoredUser = () => {
    const stored = localStorage.getItem('mockUser')
    return stored ? JSON.parse(stored) : null
  }

  return { user, login, logout, getStoredUser }
}

export default useAuth