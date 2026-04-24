import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import '../dashboard.css'

const STATUS_MAP = {
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', label: 'Pending' },
  completed: { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', label: 'Done' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', label: 'Cancelled' },
  booked:    { bg: 'rgba(13,148,136,0.1)',  color: '#0d9488', label: 'Booked' },
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [prescription, setPrescription] = useState('')
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user?.id) return
    axiosInstance.get(`/slots/doctor/${user.id}?date=${today}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [user?.id, today])

  const stats = {
    total:   slots.length,
    pending: slots.filter(s => !s.isBooked).length,
    done:    slots.filter(s => s.isBooked).length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, marginBottom: 4 }}>
            {user?.name ?? 'Doctor'}
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>
            {user?.specialty ?? 'Specialist'} · Today's Schedule
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '📋', label: "Today's Appointments", value: stats.total,   color: '#8b5cf6' },
            { icon: '⏳', label: 'Available Slots',      value: stats.pending, color: '#f59e0b' },
            { icon: '✅', label: 'Booked',               value: stats.done,    color: '#10b981' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}18` }}>{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Schedule + Detail */}
        <div className="booking-grid">
          {/* Schedule list */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Today's Schedule</h3>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{today}</span>
            </div>

            {loading ? (
              <p className="loading-msg">Loading schedule...</p>
            ) : slots.length === 0 ? (
              <p className="loading-msg">No slots for today.</p>
            ) : (
              slots.map((slot, i) => {
                const status = slot.isBooked ? 'booked' : 'pending'
                const s = STATUS_MAP[status]
                return (
                  <div
                    key={slot._id}
                    onClick={() => { setSelected(slot); setPrescription('') }}
                    style={{
                      padding: '16px 24px', cursor: 'pointer',
                      borderBottom: i < slots.length - 1 ? '1px solid var(--border)' : 'none',
                      background: selected?._id === slot._id ? 'rgba(139,92,246,0.04)' : 'white',
                      borderLeft: selected?._id === slot._id ? '3px solid #8b5cf6' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍⚕️</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            {slot.bookedBy?.name ?? (slot.isBooked ? 'Patient' : 'Open Slot')}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                            {slot.time ?? slot.startTime} {slot.endTime ? `– ${slot.endTime}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Detail / Prescription panel */}
          <div className="card">
            {!selected ? (
              <div style={{ height: '100%', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: 12 }}>
                <div style={{ fontSize: 48 }}>👈</div>
                <p style={{ fontSize: 14 }}>Select a slot to view details</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                      {selected.bookedBy?.name ?? 'Open Slot'}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
                      {selected.time ?? selected.startTime}
                    </p>
                  </div>
                  <span className="status-badge" style={{
                    background: STATUS_MAP[selected.isBooked ? 'booked' : 'pending'].bg,
                    color: STATUS_MAP[selected.isBooked ? 'booked' : 'pending'].color,
                  }}>
                    {STATUS_MAP[selected.isBooked ? 'booked' : 'pending'].label}
                  </span>
                </div>

                {/* AI Symptom Brief */}
                {selected.symptomBrief && (
                  <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span>✨</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>AI Symptom Brief</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6 }}>{selected.symptomBrief}</p>
                  </div>
                )}

                {/* Prescription */}
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 8 }}>
                  Write Prescription
                </label>
                {saved[selected._id] ? (
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '12px 14px', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                    {saved[selected._id]}
                  </div>
                ) : (
                  <textarea
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    placeholder={'Tab Paracetamol 500mg - twice daily for 3 days\nTab Cetirizine 10mg - once daily at night\nPlenty of fluids and rest...'}
                    rows={5}
                    className="field-input"
                    style={{ marginBottom: 12 }}
                  />
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {!saved[selected._id] && (
                    <button
                      onClick={() => { if (prescription.trim()) setSaved(p => ({ ...p, [selected._id]: prescription })) }}
                      className="btn-book"
                      style={{ flex: 1, background: '#8b5cf6' }}
                    >
                      Save Prescription
                    </button>
                  )}
                  <button className="btn-book" style={{ flex: 1 }}>
                    Generate PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}