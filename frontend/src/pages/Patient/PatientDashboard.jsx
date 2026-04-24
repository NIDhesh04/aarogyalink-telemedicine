import { useState, useMemo, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import '../dashboard.css'

const STATUS_STYLES = {
  booked:    { bg: 'rgba(13,148,136,0.1)',  color: '#0d9488', label: 'Booked' },
  completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Cancelled' },
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [symptom, setSymptom] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booked, setBooked] = useState(false)
  const [bookedData, setBookedData] = useState(null)
  const [tab, setTab] = useState('book')

  // Real data state
  const [slots, setSlots] = useState([])
  const [bookings, setBookings] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingBook, setLoadingBook] = useState(false)
  const [error, setError] = useState('')

  // Fetch available slots when date changes
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setError('')
    setSelectedSlot(null)
    axiosInstance.get(`/slots?date=${selectedDate}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate])

  // Fetch booking history
  useEffect(() => {
    if (tab !== 'history') return
    axiosInstance.get(`/bookings`)
      .then(r => setBookings(r.data))
      .catch(() => setBookings([]))
  }, [tab])

  const handleBook = async () => {
    if (!selectedSlot || !symptom.trim()) return
    setLoadingBook(true)
    setError('')
    try {
      const { data } = await axiosInstance.post('/bookings', {
        slotId: selectedSlot._id,
        patientId: user.id,
        symptomBrief: symptom,
      })
      setBookedData(data)
      setBooked(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.')
    } finally {
      setLoadingBook(false)
    }
  }

  const upcomingCount = bookings.filter(b => b.status === 'booked').length
  const doneCount = bookings.filter(b => b.status === 'completed').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700, marginBottom: 4 }}>
            Namaste, {user?.name?.split(' ')[0] ?? 'Patient'} 👋
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>
            Book a consultation or track your upcoming appointments
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(13,148,136,0.12)' }}>📅</div>
            <div><div className="stat-value">{upcomingCount}</div><div className="stat-label">Upcoming</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>✅</div>
            <div><div className="stat-value">{doneCount}</div><div className="stat-label">Consultations Done</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>🔢</div>
            <div><div className="stat-value">{bookedData?.queuePos ?? '—'}</div><div className="stat-label">Queue Position</div></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {[['book', 'Book a Slot'], ['history', 'My Bookings']].map(([key, label]) => (
            <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'book' && (
          <div className="booking-grid">
            {/* Slot picker */}
            <div className="card">
              <h3>Choose a Date &amp; Slot</h3>
              <label className="field-label">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setSelectedDate(e.target.value)}
                className="field-input"
              />

              {loadingSlots ? (
                <p className="loading-msg">Loading slots...</p>
              ) : (
                <div className="slots-list">
                  {slots.length === 0 ? (
                    <p className="slot-empty">No slots available on this date</p>
                  ) : (
                    slots.map(slot => (
                      <div
                        key={slot._id}
                        className={`slot-item ${selectedSlot?._id === slot._id ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <div>
                          <div className="slot-doctor">{slot.doctorId?.name ?? 'Doctor'}</div>
                          <div className="slot-specialty">{slot.doctorId?.specialty ?? slot.specialty ?? ''}</div>
                        </div>
                        <div className="slot-time">{slot.time}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Symptom form */}
            <div className="card">
              <h3>Describe Your Symptoms</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20, marginTop: -12 }}>
                Our AI will convert this into a structured medical brief for the doctor
              </p>

              {booked ? (
                <div className="success-box">
                  <div className="success-icon">✅</div>
                  <h3 className="success-title">Booking Confirmed!</h3>
                  <p className="success-sub">{selectedSlot?.doctorId?.name ?? 'Doctor'} · {selectedSlot?.time}</p>
                  {bookedData?.booking && (
                    <p className="success-queue">
                      You are <strong style={{ color: '#f59e0b' }}>#{bookedData.queuePos ?? '?'}</strong> in queue
                    </p>
                  )}
                  <button className="btn-secondary" onClick={() => { setBooked(false); setSymptom(''); setSelectedSlot(null); setBookedData(null) }}>
                    Book Another
                  </button>
                </div>
              ) : (
                <>
                  {error && <p className="error-msg">{error}</p>}
                  <textarea
                    value={symptom}
                    onChange={e => setSymptom(e.target.value)}
                    placeholder="e.g. I have had a fever of 101°F for 3 days along with a sore throat and mild body aches..."
                    rows={6}
                    className="field-input"
                  />
                  {selectedSlot && (
                    <div className="selected-banner">
                      <span style={{ color: 'var(--text-light)' }}>Selected: </span>
                      <strong style={{ color: 'var(--teal)' }}>{selectedSlot.doctorId?.name ?? 'Doctor'}</strong>
                      <span style={{ color: 'var(--text-light)' }}> at {selectedSlot.time}</span>
                    </div>
                  )}
                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || !symptom.trim() || loadingBook}
                    className="btn-book"
                  >
                    {loadingBook ? 'Booking...' : 'Confirm Booking →'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="history-card">
            <div className="history-header">
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Booking History</h3>
            </div>
            {bookings.length === 0 ? (
              <p className="loading-msg">No bookings found.</p>
            ) : bookings.map((b, i) => {
              const s = STATUS_STYLES[b.status] ?? STATUS_STYLES.booked
              return (
                <div key={b._id ?? i} className="history-row">
                  <div className="history-info">
                    <div className="history-avatar">👨‍⚕️</div>
                    <div>
                      <div className="history-doctor">{b.doctorId?.name ?? 'Doctor'}</div>
                      <div className="history-date">{b.slotId?.date ?? '—'} · {b.slotId?.time ?? '—'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {b.queuePos && (
                      <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>#{b.queuePos} in queue</span>
                    )}
                    <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}