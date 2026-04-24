import { useState, useEffect, useMemo } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import '../dashboard.css'

const MOCK_ANALYTICS = [
  { day: 'Mon', bookings: 12 }, { day: 'Tue', bookings: 18 },
  { day: 'Wed', bookings: 9 },  { day: 'Thu', bookings: 22 },
  { day: 'Fri', bookings: 15 }, { day: 'Sat', bookings: 7 },
  { day: 'Sun', bookings: 3 },
]

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.bookings))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, padding: '0 4px' }}>
      {data.map(d => (
        <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            background: 'linear-gradient(to top, var(--teal), var(--sky))',
            height: `${(d.bookings / max) * 70}px`,
            transition: 'height 0.3s ease', minHeight: 4,
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{d.day}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get('/users/doctors')
      .then(r => setDoctors(r.data))
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }, [])

  const totalBookings = useMemo(() => MOCK_ANALYTICS.reduce((a, b) => a + b.bookings, 0), [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>District Hospital — Overview</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            { icon: '👨‍⚕️', label: 'Total Doctors',    value: doctors.length, color: '#8b5cf6' },
            { icon: '📅', label: 'Bookings This Week', value: totalBookings,   color: '#0d9488' },
            { icon: '✅', label: 'Completed Today',    value: 8,               color: '#10b981' },
            { icon: '🏥', label: 'Active Patients',    value: 47,              color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}18` }}>{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Doctor table + Chart */}
        <div className="booking-grid">
          {/* Doctors table */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Doctors</h3>
              <button className="btn-book" style={{ width: 'auto', padding: '7px 16px', fontSize: 13 }}>
                + Add Doctor
              </button>
            </div>
            {loading ? (
              <p className="loading-msg">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="loading-msg">No doctors registered yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      {['Doctor', 'Specialty', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(d => (
                      <tr key={d._id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👨‍⚕️</div>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-light)' }}>{d.specialty ?? '—'}</td>
                        <td style={{ padding: '14px 24px' }}>
                          <span className="status-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Bookings This Week</h3>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{totalBookings}</span>
            </div>
            <MiniBarChart data={MOCK_ANALYTICS} />
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Peak day',    value: 'Thursday (22)',    color: 'var(--teal)' },
                { label: 'Most booked',value: 'Dr. Priya Sharma', color: '#8b5cf6' },
                { label: 'Avg/day',    value: `${Math.round(totalBookings / 7)} bookings`, color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-light)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}