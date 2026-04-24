import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import '../dashboard.css'

const STATUS_MAP = {
  stable:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Stable' },
  followup: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Follow-up' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Critical' },
}

export default function ASHADashboard() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booked, setBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Slots fetched from API
  const [slots, setSlots] = useState([])
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    axiosInstance.get(`/slots?date=${today}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
  }, [today])

  // In a real app, patients would be fetched from an API too
  // For now we show connected slots as the "patients" the ASHA manages
  const MOCK_PATIENTS = [
    { id: 'p1', name: 'Ravi Kumar',   age: 34, village: 'Rampur',    status: 'stable' },
    { id: 'p2', name: 'Meena Devi',   age: 52, village: 'Sikar',     status: 'followup' },
    { id: 'p3', name: 'Gopal Sharma', age: 67, village: 'Chomu',     status: 'critical' },
    { id: 'p4', name: 'Sunita Bai',   age: 28, village: 'Jhunjhunu', status: 'stable' },
  ]

  const handleBook = async () => {
    if (!selectedSlot || !selected) return
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post('/bookings', {
        slotId: selectedSlot._id,
        patientId: selected.id,
        symptomBrief: `Booked by ASHA ${user?.name} on behalf of ${selected.name}`,
      })
      setBooked(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, marginBottom: 4 }}>
            ASHA Dashboard
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>
            {user?.name} · Book appointments on behalf of patients
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { icon: '👥', label: 'Patients in Caseload', value: MOCK_PATIENTS.length,                                         color: '#f59e0b' },
            { icon: '🚨', label: 'Critical Cases',        value: MOCK_PATIENTS.filter(p => p.status === 'critical').length,   color: '#ef4444' },
            { icon: '📅', label: 'Follow-ups Needed',     value: MOCK_PATIENTS.filter(p => p.status === 'followup').length,   color: '#0d9488' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}18` }}>{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>

        {/* Patients + Booking panel */}
        <div className="booking-grid">
          {/* Patient list */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>My Patients</h3>
            </div>
            {MOCK_PATIENTS.map((p, i) => {
              const s = STATUS_MAP[p.status]
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelected(p); setSelectedSlot(null); setBooked(false); setError('') }}
                  style={{
                    padding: '14px 24px', cursor: 'pointer',
                    borderBottom: i < MOCK_PATIENTS.length - 1 ? '1px solid var(--border)' : 'none',
                    background: selected?.id === p.id ? 'rgba(245,158,11,0.04)' : 'white',
                    borderLeft: selected?.id === p.id ? '3px solid #f59e0b' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍⚕️</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{p.village} · Age {p.age}</div>
                      </div>
                    </div>
                    <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Book on behalf panel */}
          <div className="card">
            {!selected ? (
              <div style={{ minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: 12 }}>
                <div style={{ fontSize: 48 }}>👈</div>
                <p style={{ fontSize: 14 }}>Select a patient to book a slot</p>
              </div>
            ) : booked ? (
              <div className="success-box">
                <div className="success-icon">✅</div>
                <h3 className="success-title">Booking Confirmed!</h3>
                <p className="success-sub">
                  {selected.name} → {selectedSlot?.doctorId?.name ?? 'Doctor'} at {selectedSlot?.time ?? selectedSlot?.startTime}
                </p>
                <button className="btn-secondary" onClick={() => { setBooked(false); setSelectedSlot(null) }}>
                  Book Another
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Book for {selected.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{selected.village} · Age {selected.age}</p>
                </div>

                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Available Slots ({today})</p>
                {error && <p className="error-msg">{error}</p>}

                <div className="slots-list" style={{ marginBottom: 20 }}>
                  {slots.length === 0 ? (
                    <p className="slot-empty">No slots available today</p>
                  ) : slots.map(slot => (
                    <div
                      key={slot._id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`slot-item ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                      style={{ borderColor: selectedSlot?._id === slot._id ? '#f59e0b' : undefined, background: selectedSlot?._id === slot._id ? 'rgba(245,158,11,0.06)' : undefined }}
                    >
                      <div>
                        <div className="slot-doctor">{slot.doctorId?.name ?? 'Doctor'}</div>
                        <div className="slot-specialty">{slot.doctorId?.specialty ?? ''}</div>
                      </div>
                      <div className="slot-time" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
                        {slot.time ?? slot.startTime}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot || loading}
                  className="btn-book"
                  style={{ background: selectedSlot ? '#f59e0b' : undefined }}
                >
                  {loading ? 'Booking...' : 'Confirm Booking →'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}