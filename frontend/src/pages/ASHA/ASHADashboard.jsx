import { useState } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const MOCK_PATIENTS = [
  { id: 'p1', name: 'Ravi Kumar',   age: 34, village: 'Rampur',    lastVisit: '2026-04-20', status: 'stable' },
  { id: 'p2', name: 'Meena Devi',   age: 52, village: 'Sikar',     lastVisit: '2026-04-15', status: 'followup' },
  { id: 'p3', name: 'Gopal Sharma', age: 67, village: 'Chomu',     lastVisit: '2026-04-10', status: 'critical' },
  { id: 'p4', name: 'Sunita Bai',   age: 28, village: 'Jhunjhunu', lastVisit: '2026-04-22', status: 'stable' },
]

const MOCK_SLOTS = [
  { id: 's1', doctor: 'Dr. Priya Sharma', specialty: 'General Medicine', time: '10:00 AM', date: '2026-04-25' },
  { id: 's2', doctor: 'Dr. Arjun Mehta',  specialty: 'Pediatrics',       time: '11:30 AM', date: '2026-04-25' },
  { id: 's3', doctor: 'Dr. Kavita Rao',   specialty: 'Gynecology',       time: '09:00 AM', date: '2026-04-26' },
]

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>ASHA Dashboard</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>{user?.name} · {user?.zone}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: '👥', label: 'Patients in Caseload', value: MOCK_PATIENTS.length, color: '#f59e0b' },
            { icon: '🚨', label: 'Critical Cases', value: 1, color: '#ef4444' },
            { icon: '📅', label: 'Pending Follow-ups', value: 1, color: '#0d9488' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 'var(--radius)', padding: '20px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Patient list */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>My Patients</h3>
            </div>
            {MOCK_PATIENTS.map((p, i) => {
              const s = STATUS_MAP[p.status]
              return (
                <div key={p.id}
                  onClick={() => { setSelected(p); setSelectedSlot(null); setBooked(false) }}
                  style={{
                    padding: '14px 24px', cursor: 'pointer',
                    borderBottom: i < MOCK_PATIENTS.length - 1 ? '1px solid var(--border)' : 'none',
                    background: selected?.id === p.id ? 'rgba(245,158,11,0.04)' : 'white',
                    borderLeft: selected?.id === p.id ? '3px solid #f59e0b' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍⚕️</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{p.village} · Age {p.age}</div>
                      </div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Book on behalf */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            {!selected ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: 12 }}>
                <div style={{ fontSize: 48 }}>👈</div>
                <p style={{ fontSize: 14 }}>Select a patient to book a slot</p>
              </div>
            ) : booked ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>Booking Confirmed!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-light)' }}>
                  {selected.name} → {selectedSlot?.doctor} at {selectedSlot?.time}
                </p>
                <button onClick={() => { setBooked(false); setSelectedSlot(null) }}
                  style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, background: '#f59e0b', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Book Another
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Book for {selected.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{selected.village} · Age {selected.age}</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Available Slots</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {MOCK_SLOTS.map(slot => (
                    <div key={slot.id} onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${selectedSlot?.id === slot.id ? '#f59e0b' : 'var(--border)'}`,
                        background: selectedSlot?.id === slot.id ? 'rgba(245,158,11,0.06)' : 'var(--surface)',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{slot.doctor}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{slot.specialty} · {slot.date} {slot.time}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { if (selectedSlot) setBooked(true) }}
                  disabled={!selectedSlot}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 8,
                    background: selectedSlot ? '#f59e0b' : 'var(--border)',
                    color: selectedSlot ? 'white' : 'var(--text-light)',
                    fontSize: 14, fontWeight: 600,
                    cursor: selectedSlot ? 'pointer' : 'not-allowed',
                  }}>
                  Confirm Booking →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}