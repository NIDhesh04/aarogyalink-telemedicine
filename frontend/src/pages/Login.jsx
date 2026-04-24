import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  {
    key: 'patient',
    icon: '🧑‍⚕️',
    title: 'Patient',
    desc: 'Book slots, describe symptoms, track queue',
    color: '#0d9488',
    bg: 'rgba(13,148,136,0.08)',
    border: 'rgba(13,148,136,0.2)',
    route: '/patient',
  },
  {
    key: 'doctor',
    icon: '👨‍⚕️',
    title: 'Doctor',
    desc: 'View schedule, symptom briefs, prescriptions',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    route: '/doctor',
  },
  {
    key: 'asha',
    icon: '👩‍🦺',
    title: 'ASHA Worker',
    desc: 'Manage patients, book on their behalf',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    route: '/asha',
  },
  {
    key: 'admin',
    icon: '⚙️',
    title: 'Admin',
    desc: 'Doctor management, analytics, reports',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.2)',
    route: '/admin',
  },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [hovering, setHovering] = useState(null)

  const handleLogin = (role) => {
    const r = ROLES.find(r => r.key === role)
    login(role)
    navigate(r.route)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, var(--teal), var(--sky))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, margin: '0 auto 20px', boxShadow: 'var(--shadow-teal)',
          }}>🏥</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', color: 'white',
            fontSize: 36, fontWeight: 600, margin: '0 0 8px',
            letterSpacing: '-0.5px',
          }}>AarogyaLink</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
            Rural Telemedicine Scheduler
          </p>
        </div>

        {/* Role cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {ROLES.map(role => (
            <button
              key={role.key}
              onClick={() => handleLogin(role.key)}
              onMouseEnter={() => setHovering(role.key)}
              onMouseLeave={() => setHovering(null)}
              style={{
                background: hovering === role.key ? role.bg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${hovering === role.key ? role.border : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 'var(--radius)',
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hovering === role.key ? 'translateY(-2px)' : 'none',
                boxShadow: hovering === role.key ? `0 8px 24px ${role.border}` : 'none',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{role.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'white', marginBottom: 4 }}>
                {role.title}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                {role.desc}
              </div>
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 28 }}>
          Demo mode — click any role to enter
        </p>
      </div>
    </div>
  )
}