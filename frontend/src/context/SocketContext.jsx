import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import axiosInstance from '../api/axiosInstance'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ||
                   import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
                   'http://localhost:5005'

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Fetch persisted notifications on mount ──
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await axiosInstance.get('/notifications?limit=30')
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [user])

  // ── Connect socket when user logs in, disconnect on logout ──
  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setNotifications([])
      setUnreadCount(0)
      return
    }

    // Fetch history from DB (covers offline period)
    fetchNotifications()

    const token = localStorage.getItem('aarogya_token')
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id)
    })

    socket.on('notification', (notif) => {
      // Prepend to list + bump badge
      setNotifications(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)

      // 🔥 Live toast popup
      toast(notif.message, {
        icon: '🔔',
        duration: 5000,
        style: {
          borderRadius: '12px',
          background: '#1e293b',
          color: '#f1f5f9',
          fontSize: '14px',
        },
      })
    })

    socket.on('connect_error', (err) => {
      console.error('Socket auth error:', err.message)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [user, fetchNotifications])

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    try {
      await axiosInstance.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ notifications, unreadCount, markAllRead, fetchNotifications }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
