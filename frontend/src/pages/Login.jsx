import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const ROLES = [
  { key: 'patient', icon: '🧑‍⚕️', title: 'Patient',      desc: 'Book slots, describe symptoms, track queue',       color: '#0d9488', route: '/patient' },
  { key: 'doctor',  icon: '👨‍⚕️', title: 'Doctor',       desc: 'View schedule, symptom briefs, prescriptions',    color: '#8b5cf6', route: '/doctor' },
  { key: 'asha',    icon: '👩‍🦺', title: 'ASHA Worker',  desc: 'Manage patients, book on their behalf',           color: '#f59e0b', route: '/asha' },
  { key: 'admin',   icon: '⚙️',  title: 'Admin',         desc: 'Doctor management, analytics, reports',           color: '#ef4444', route: '/admin' },
]

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('select') // 'select' | 'form'
  const [selectedRole, setSelectedRole] = useState(null)
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setMode('form')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let user
      if (isRegister) {
        user = await register({ ...form, role: selectedRole.key })
      } else {
        user = await login(form.email, form.password)
      }
      const role = ROLES.find(r => r.key === user.role)
      navigate(role?.route || '/patient')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-blob login-bg-blob--top" />
      <div className="login-bg-blob login-bg-blob--bottom" />

      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">🏥</div>
          <h1 className="login-title">AarogyaLink</h1>
          <p className="login-subtitle">Rural Telemedicine Scheduler</p>
        </div>

        {mode === 'select' ? (
          <>
            <p className="login-prompt">Select your role to continue</p>
            <div className="login-roles-grid">
              {ROLES.map(role => (
                <button
                  key={role.key}
                  className="login-role-card"
                  onClick={() => handleRoleSelect(role)}
                  style={{ '--role-color': role.color }}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-title">{role.title}</span>
                  <span className="role-desc">{role.desc}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="login-form-wrapper">
            <button className="login-back" onClick={() => { setMode('select'); setError('') }}>
              ← Back
            </button>
            <div className="login-form-header">
              <span className="role-icon-sm">{selectedRole.icon}</span>
              <span>{selectedRole.title}</span>
            </div>

            <div className="login-tabs">
              <button className={`login-tab ${!isRegister ? 'active' : ''}`} onClick={() => { setIsRegister(false); setError('') }}>Login</button>
              <button className={`login-tab ${isRegister ? 'active' : ''}`} onClick={() => { setIsRegister(true); setError('') }}>Register</button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {isRegister && (
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Ravi Kumar" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              {isRegister && selectedRole.key === 'doctor' && (
                <div className="form-group">
                  <label>Specialty</label>
                  <input type="text" placeholder="General Medicine" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                </div>
              )}
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-submit" disabled={loading} style={{ '--role-color': selectedRole.color }}>
                {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}