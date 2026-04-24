import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = {
  patient: [
    { label: 'Dashboard', path: '/patient' },
  ],
  doctor: [
    { label: 'Dashboard', path: '/doctor' },
  ],
  asha: [
    { label: 'Dashboard', path: '/asha' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin' },
  ],
}

const ROLE_COLORS = {
  patient: '#0d9488',
  doctor:  '#8b5cf6',
  asha:    '#f59e0b',
  admin:   '#ef4444',
}

const ROLE_ICONS = {
  patient: '🧑‍⚕️',
  doctor:  '👨‍⚕️',
  asha:    '👩‍🦺',
  admin:   '⚙️',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const color = ROLE_COLORS[user.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      background: 'var(--navy)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, var(--teal), var(--sky))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🏥</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>
          AarogyaLink
        </span>
      </div>

      {/* User info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(255,255,255,0.06)',
          padding: '6px 14px', borderRadius: 40,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 18 }}>{ROLE_ICONS[user.role]}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: color, textTransform: 'capitalize', fontWeight: 500 }}>{user.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '7px 16px',
          fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.08)'}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}