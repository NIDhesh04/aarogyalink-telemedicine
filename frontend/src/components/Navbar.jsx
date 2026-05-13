import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const ROLE_COLORS = { patient: '#0d9488', doctor: '#8b5cf6', asha: '#f59e0b', admin: '#ef4444' }
const ROLE_ICONS  = { patient: '🧑‍⚕️', doctor: '👨‍⚕️', asha: '👩‍🦺', admin: '⚙️' }

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const color = ROLE_COLORS[user.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <div className="navbar-logo-icon">🏥</div>
        <span className="navbar-logo-text">AarogyaLink</span>
      </div>

      {/* Desktop: User info + Logout */}
      <div className="navbar-right">
        <div className="navbar-user" style={{ '--role-color': color }}>
          <span className="navbar-user-icon">{ROLE_ICONS[user.role]}</span>
          <div>
            <div className="navbar-user-name">{user.name}</div>
            <div className="navbar-user-role">{user.role}</div>
          </div>
        </div>
        <button className="navbar-logout" onClick={() => navigate('/profile')} style={{ marginRight: '10px', background: 'transparent', border: '1px solid currentColor', color: 'inherit' }}>Settings</button>
        <button className="navbar-logout" onClick={handleLogout}>Logout</button>
      </div>

      {/* Mobile: hamburger */}
      <button className="navbar-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-user" style={{ '--role-color': color, padding: '8px 0' }}>
            <span>{ROLE_ICONS[user.role]}</span>
            <div>
              <div className="navbar-user-name">{user.name}</div>
              <div className="navbar-user-role">{user.role}</div>
            </div>
          </div>
          <button className="navbar-logout" onClick={() => { setMenuOpen(false); navigate('/profile'); }} style={{ width: '100%', textAlign: 'center', marginBottom: '10px', background: 'transparent', border: '1px solid currentColor', color: 'inherit' }}>
            Settings
          </button>
          <button className="navbar-logout" onClick={handleLogout} style={{ width: '100%', textAlign: 'center' }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}