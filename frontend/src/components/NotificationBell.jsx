import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useSocket } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import './NotificationBell.css'

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useSocket()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setOpen(prev => !prev)
  }

  const handleNotifClick = (notif) => {
    if (notif.link) navigate(notif.link)
    setOpen(false)
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="notif-bell-wrapper" ref={dropdownRef}>
      <button className="notif-bell-btn" onClick={handleToggle} aria-label="Notifications" id="notification-bell">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" id="notification-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-read" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <p className="notif-empty">No notifications yet</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'notif-unread' : ''}`}
                  onClick={() => handleNotifClick(n)}
                >
                  <p className="notif-item-msg">{n.message}</p>
                  <span className="notif-item-time">{timeAgo(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
