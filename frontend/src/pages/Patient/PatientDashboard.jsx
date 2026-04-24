import { useState, useMemo } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const MOCK_SLOTS = [
  { id: 's1', doctor: 'Dr. Priya Sharma', specialty: 'General Medicine', date: '2026-04-25', time: '10:00 AM', available: true },
  { id: 's2', doctor: 'Dr. Arjun Mehta',  specialty: 'Pediatrics',       date: '2026-04-25', time: '11:30 AM', available: true },
  { id: 's3', doctor: 'Dr. Priya Sharma', specialty: 'General Medicine', date: '2026-04-25', time: '02:00 PM', available: false },
  { id: 's4', doctor: 'Dr. Kavita Rao',   specialty: 'Gynecology',       date: '2026-04-26', time: '09:00 AM', available: true },
  { id: 's5', doctor: 'Dr. Arjun Mehta',  specialty: 'Pediatrics',       date: '2026-04-26', time: '03:00 PM', available: true },
]

const MOCK_BOOKINGS = [
  { id: 'b1', doctor: 'Dr. Priya Sharma', date: '2026-04-20', time: '10:00 AM', status: 'completed', queuePos: null },
  { id: 'b2', doctor: 'Dr. Arjun Mehta',  date: '2026-04-25', time: '11:30 AM', status: 'booked',    queuePos: 3 },
]

const STATUS_STYLES = {
  booked:    { bg: 'rgba(13,148,136,0.1)',  color: '#0d9488', label: 'Booked' },
  completed: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', label: 'Cancelled' },
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius)', padding: '20px 24px',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}15`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState('2026-04-25')
  const [symptom, setSymptom] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booked, setBooked] = useState(false)
  const [tab, setTab] = useState('book') // 'book' | 'history'

  const filteredSlots = useMemo(() =>
    MOCK_SLOTS.filter(s => s.date === selectedDate && s.available),
    [selectedDate]
  )

  const handleBook = () => {
    if (!selectedSlot || !symptom.trim()) return
    setBooked(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            Namaste, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>
            Book a consultation or track your upcoming appointments
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatCard icon="📅" label="Upcoming Appointments" value="1"  color="#0d9488" />
          <StatCard icon="✅" label="Consultations Done"    value="1"  color="#10b981" />
          <StatCard icon="🔢" label="Queue Position"        value="#3" color="#f59e0b" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface-2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[['book', 'Book a Slot'], ['history', 'My Bookings']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: tab === key ? 'white' : 'transparent',
              color: tab === key ? 'var(--text-dark)' : 'var(--text-light)',
              border: 'none', cursor: 'pointer',
              boxShadow: tab === key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'book' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Slot picker */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Choose a Date & Slot</h3>

              <label style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>Select Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                style={{
                  display: 'block', width: '100%', marginTop: 6, marginBottom: 20,
                  padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text-dark)', fontSize: 14,
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredSlots.length === 0 && (
                  <p style={{ color: 'var(--text-light)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                    No slots available on this date
                  </p>
                )}
                {filteredSlots.map(slot => (
                  <div key={slot.id} onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${selectedSlot?.id === slot.id ? 'var(--teal)' : 'var(--border)'}`,
                      background: selectedSlot?.id === slot.id ? 'var(--teal-bg)' : 'var(--surface)',
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-dark)' }}>{slot.doctor}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{slot.specialty}</div>
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--teal)',
                        background: 'var(--teal-bg)', padding: '4px 10px', borderRadius: 6,
                      }}>{slot.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Symptom form */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Describe Your Symptoms</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 20 }}>
                Our AI will convert this into a structured medical brief for the doctor
              </p>

              {booked ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  background: 'rgba(16,185,129,0.05)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Booking Confirmed!</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-light)' }}>
                    {selectedSlot?.doctor} · {selectedSlot?.time}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>
                    You are <strong style={{ color: '#f59e0b' }}>#3</strong> in queue
                  </p>
                  <button onClick={() => { setBooked(false); setSymptom(''); setSelectedSlot(null) }}
                    style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, background: 'var(--teal)', color: 'white', fontSize: 14, fontWeight: 500 }}>
                    Book Another
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    value={symptom}
                    onChange={e => setSymptom(e.target.value)}
                    placeholder="e.g. I have had a fever of 101°F for 3 days along with a sore throat and mild body aches..."
                    rows={6}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1px solid var(--border)', resize: 'vertical',
                      fontSize: 14, lineHeight: 1.6, color: 'var(--text-dark)',
                      background: 'var(--surface)', marginBottom: 16,
                    }}
                  />
                  {selectedSlot && (
                    <div style={{
                      padding: '12px 14px', borderRadius: 8, background: 'var(--teal-bg)',
                      border: '1px solid var(--teal-border)', marginBottom: 16, fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--text-light)' }}>Selected: </span>
                      <strong style={{ color: 'var(--teal)' }}>{selectedSlot.doctor}</strong>
                      <span style={{ color: 'var(--text-light)' }}> at {selectedSlot.time}</span>
                    </div>
                  )}
                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || !symptom.trim()}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 8,
                      background: selectedSlot && symptom.trim() ? 'var(--teal)' : 'var(--border)',
                      color: selectedSlot && symptom.trim() ? 'white' : 'var(--text-light)',
                      fontSize: 14, fontWeight: 600, cursor: selectedSlot && symptom.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}>
                    Confirm Booking →
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Booking History</h3>
            </div>
            {MOCK_BOOKINGS.map((b, i) => {
              const s = STATUS_STYLES[b.status]
              return (
                <div key={b.id} style={{
                  padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: i < MOCK_BOOKINGS.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👨‍⚕️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{b.doctor}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{b.date} · {b.time}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {b.queuePos && (
                      <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>#{b.queuePos} in queue</span>
                    )}
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
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