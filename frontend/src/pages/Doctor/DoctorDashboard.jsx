import { useState, useMemo } from 'react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const MOCK_SCHEDULE = [
  { id: 'b1', patient: 'Ravi Kumar',   time: '10:00 AM', status: 'pending',   symptomBrief: 'Fever 101°F for 3 days, sore throat, mild body aches. Possible viral infection.', village: 'Rampur' },
  { id: 'b2', patient: 'Meena Devi',   time: '11:30 AM', status: 'pending',   symptomBrief: 'Recurring headaches for 1 week, blurred vision occasionally. No prior history.', village: 'Sikar' },
  { id: 'b3', patient: 'Suresh Yadav', time: '02:00 PM', status: 'completed', symptomBrief: 'Stomach pain after meals, mild nausea. Possible gastritis.', village: 'Chomu' },
  { id: 'b4', patient: 'Anita Singh',  time: '03:30 PM', status: 'pending',   symptomBrief: 'Persistent cough for 2 weeks, no fever. Smoker for 10 years.', village: 'Jhunjhunu' },
]

function StatusBadge({ status }) {
  const map = {
    pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', label: 'Pending' },
    completed: { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', label: 'Done' },
    cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444', label: 'Cancelled' },
  }
  const s = map[status]
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [prescription, setPrescription] = useState('')
  const [saved, setSaved] = useState({})

  const stats = useMemo(() => ({
    total: MOCK_SCHEDULE.length,
    pending: MOCK_SCHEDULE.filter(s => s.status === 'pending').length,
    done: MOCK_SCHEDULE.filter(s => s.status === 'completed').length,
  }), [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <Navbar />
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{user?.name}</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 15 }}>{user?.specialty} · {user?.hospital}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { icon: '📋', label: "Today's Appointments", value: stats.total, color: '#8b5cf6' },
            { icon: '⏳', label: 'Pending',              value: stats.pending, color: '#f59e0b' },
            { icon: '✅', label: 'Completed',            value: stats.done,   color: '#10b981' },
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
          {/* Schedule list */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Today's Schedule</h3>
              <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Apr 25, 2026</span>
            </div>
            {MOCK_SCHEDULE.map((appt, i) => (
              <div key={appt.id}
                onClick={() => { setSelected(appt); setPrescription('') }}
                style={{
                  padding: '16px 24px', cursor: 'pointer',
                  borderBottom: i < MOCK_SCHEDULE.length - 1 ? '1px solid var(--border)' : 'none',
                  background: selected?.id === appt.id ? 'rgba(139,92,246,0.04)' : 'white',
                  borderLeft: selected?.id === appt.id ? '3px solid #8b5cf6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍⚕️</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{appt.patient}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{appt.village} · {appt.time}</div>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Detail / Prescription panel */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            {!selected ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', gap: 12 }}>
                <div style={{ fontSize: 48 }}>👈</div>
                <p style={{ fontSize: 14 }}>Select a patient to view details</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>{selected.patient}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-light)' }}>{selected.village} · {selected.time}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* AI Symptom Brief */}
                <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 16 }}>✨</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>AI Symptom Brief</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6 }}>{selected.symptomBrief}</p>
                </div>

                {/* Prescription */}
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 8 }}>
                  Write Prescription
                </label>
                {saved[selected.id] ? (
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6, marginBottom: 12 }}>
                    {saved[selected.id]}
                  </div>
                ) : (
                  <textarea
                    value={prescription}
                    onChange={e => setPrescription(e.target.value)}
                    placeholder="Tab Paracetamol 500mg - twice daily for 3 days&#10;Tab Cetirizine 10mg - once daily at night&#10;Plenty of fluids and rest..."
                    rows={5}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', resize: 'vertical', fontSize: 13, lineHeight: 1.6, color: 'var(--text-dark)', background: 'var(--surface)', marginBottom: 12 }}
                  />
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  {!saved[selected.id] && (
                    <button
                      onClick={() => { if (prescription.trim()) setSaved(p => ({ ...p, [selected.id]: prescription })) }}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#8b5cf6', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Save Prescription
                    </button>
                  )}
                  <button style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--teal)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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