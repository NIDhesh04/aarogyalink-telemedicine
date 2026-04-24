import { useMemo } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const MOCK_DOCTORS = [
  { id: 'd1', name: 'Dr. Priya Sharma', specialty: 'General Medicine', slots: 8, booked: 6, status: 'active' },
  { id: 'd2', name: 'Dr. Arjun Mehta',  specialty: 'Pediatrics',       slots: 6, booked: 4, status: 'active' },
  { id: 'd3', name: 'Dr. Kavita Rao',   specialty: 'Gynecology',       slots: 5, booked: 2, status: 'active' },
  { id: 'd4', name: 'Dr. Ramesh Gupta', specialty: 'Orthopedics',      slots: 4, booked: 4, status: 'busy' },
]

const MOCK_ANALYTICS = [
  { day: 'Mon', bookings: 12 },
  { day: 'Tue', bookings: 18 },
  { day: 'Wed', bookings: 9 },
  { day: 'Thu', bookings: 22 },
  { day: 'Fri', bookings: 15 },
  { day: 'Sat', bookings: 7 },
  { day: 'Sun', bookings: 3 },
]

function MiniBarChart({ data }) {
  const max = useMemo(() => Math.max(...data.map(d => d.bookings)), [data])
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, padding: '0 4px' }}>
      {data.map(d => (
        <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', borderRadius: '4px 4px 0 0',
            background: `linear-gradient(to top, var(--teal), var(--sky))`,
            height: `${(d.bookings / max) * 70}px`,
            transition: 'height 0.3s ease',
            minHeight: 4,
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{d.day}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()

  const totalBookings = useMemo(() => MOCK_ANALYTICS.reduce((a, b) => a + b.bookings, 0), [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>District Hospital Jaipur — Overview</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: '👨‍⚕️', label: 'Total Doctors',   value: MOCK_DOCTORS.length, color: '#8b5cf6' },
            { icon: '📅', label: 'Bookings This Week', value: totalBookings,       color: '#0d9488' },
            { icon: '✅', label: 'Completed Today',    value: 8,                  color: '#10b981' },
            { icon: '🏥', label: 'Active Patients',    value: 47,                 color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 'var(--radius)', padding: '20px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          {/* Doctor table */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Doctors</h3>
              <button style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--teal)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + Add Doctor
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  {['Doctor', 'Specialty', 'Slots', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_DOCTORS.map((d, i) => (
                  <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👨‍⚕️</div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: 'var(--text-light)' }}>{d.specialty}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(d.booked / d.slots) * 100}%`, background: 'var(--teal)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{d.booked}/{d.slots}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: d.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: d.status === 'active' ? '#10b981' : '#ef4444',
                      }}>
                        {d.status === 'active' ? 'Available' : 'Fully Booked'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Analytics chart */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Bookings This Week</h3>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--teal)' }}>{totalBookings}</span>
            </div>
            <MiniBarChart data={MOCK_ANALYTICS} />
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Peak day', value: 'Thursday (22 bookings)', color: 'var(--teal)' },
                { label: 'Most booked', value: 'Dr. Priya Sharma', color: '#8b5cf6' },
                { label: 'Avg/day', value: `${Math.round(totalBookings / 7)} bookings`, color: '#f59e0b' },
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