import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import {
  Calendar, CheckCircle2, Clock, User as UserIcon, AlertCircle,
  PlusCircle, Activity, FileText, Sparkles, CheckSquare, Wand2
} from 'lucide-react'

const STATUS_MAP = {
  pending:   { bg: 'bg-amber-100',   color: 'text-amber-600',   label: 'Open' },
  completed: { bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Done' },
  cancelled: { bg: 'bg-red-100',     color: 'text-red-600',     label: 'Cancelled' },
  booked:    { bg: 'bg-teal-100',    color: 'text-teal-600',    label: 'Booked' },
}

const TIME_OPTIONS = [
  '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM',
  '11:00 AM','11:30 AM','12:00 PM','12:30 PM','01:00 PM','01:30 PM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM',
]

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('schedule')
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState([])
  const [selected, setSelected] = useState(null)
  const [prescription, setPrescription] = useState('')
  const [saved, setSaved] = useState({})
  const [loading, setLoading] = useState(true)

  const [newSlot, setNewSlot] = useState({ date: '', time: '', startTime: '', endTime: '' })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // ── Fetch doctor's slots for a given date ─────────────────────────────
  // useCallback: stabilises the function reference so it can be used as a
  // useEffect dependency and passed as a prop without triggering extra renders.
  const fetchSlots = useCallback((date) => {
    if (!user?.id) return
    setLoading(true)
    axiosInstance.get(`/slots/doctor/${user.id}?date=${date}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => { fetchSlots(viewDate) }, [user?.id, viewDate, fetchSlots])

  // ── useMemo: derive stats — only recomputed when `slots` changes ──────
  // Without useMemo this object is recreated on EVERY render (including
  // state changes for prescription text, selected slot, etc.), causing
  // all three StatCard children to unnecessarily re-render.
  const stats = useMemo(() => ({
    total:   slots.length,
    pending: slots.filter(s => !s.isBooked).length,
    done:    slots.filter(s => s.isBooked).length,
  }), [slots])

  // ── useMemo: sorted slot list for the schedule panel ─────────────────
  // Sorting is O(n log n) — memoising means we only sort when the fetched
  // slot array actually changes, not on every keystroke in the prescription
  // textarea.
  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const t1 = a.time || a.startTime || ''
      const t2 = b.time || b.startTime || ''
      return t1.localeCompare(t2)
    })
  }, [slots])

  // ── Handle new slot creation ──────────────────────────────────────────
  // useCallback: form submit handler — stabilised so the <form> element
  // doesn't see a new onSubmit reference on every render.
  const handleAddSlot = useCallback(async (e) => {
    e.preventDefault()
    if (!newSlot.date || !newSlot.time) return
    setAdding(true); setAddError(''); setAddSuccess('')
    try {
      await axiosInstance.post('/slots', {
        doctorId: user.id,
        date: newSlot.date,
        time: newSlot.time,
        startTime: newSlot.time.replace(' AM', '').replace(' PM', ''),
        endTime:   newSlot.time.replace(' AM', '').replace(' PM', ''),
      })
      setAddSuccess(`✅ Slot added for ${newSlot.date} at ${newSlot.time}`)
      setNewSlot({ date: '', time: '' })
      if (viewDate === newSlot.date) fetchSlots(viewDate)
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add slot')
    } finally {
      setAdding(false)
    }
  }, [newSlot, user?.id, viewDate, fetchSlots])

  // ── AI prescription suggestion ────────────────────────────────────────
  // useCallback: async handler for the "AI Assist" button — deps are
  // selected.symptomBrief so it only changes when the selected slot changes.
  const handleAIAssist = useCallback(async () => {
    if (!selected?.symptomBrief) return
    setAiLoading(true)
    try {
      const { data } = await axiosInstance.post('/bookings/ai-suggest', {
        symptomBrief: selected.symptomBrief,
      })
      if (data.suggestion) setPrescription(data.suggestion)
    } catch (_) {
      // fail silently — doctor can still write manually
    } finally {
      setAiLoading(false)
    }
  }, [selected?.symptomBrief])

  // ── Complete consultation + queue PDF job ─────────────────────────────
  // useCallback: deps are prescription, saved map, selected slot, viewDate.
  const handleComplete = useCallback(async () => {
    const currentPrescription = saved[selected?._id] || prescription
    if (!currentPrescription.trim()) return
    try {
      const bookingId = selected?.bookingId
      if (!bookingId) {
        alert('Error: This slot is missing its booking reference. Try refreshing the schedule.')
        return
      }
      await axiosInstance.post(`/bookings/complete/${bookingId}`, {
        prescription: currentPrescription,
      })
      setSaved(p => ({ ...p, [selected._id]: currentPrescription }))
      fetchSlots(viewDate)
    } catch {
      alert('Failed to complete consultation. Please try again.')
    }
  }, [prescription, saved, selected, viewDate, fetchSlots])

  // ── Stat card component (defined outside render to avoid re-creation) ─
  const StatCard = useCallback(({ icon: Icon, value, label, colorClass, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow"
    >
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon size={28} />
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-800">{value}</div>
        <div className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">{label}</div>
      </div>
    </motion.div>
  ), [])

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name ?? 'Doctor'} 👋`}
      subtitle={`${user?.specialty ?? 'Specialist'} · Manage your schedule and patient consultations`}
    >
      {/* Stats Grid — values come from useMemo(stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={Calendar}     value={stats.total}   label={`Slots on ${viewDate === today ? 'Today' : viewDate}`} colorClass="bg-primary/10 text-[#0284c7]" delay={0.1} />
        <StatCard icon={Clock}        value={stats.pending} label="Open Slots"     colorClass="bg-amber-100 text-amber-600"     delay={0.2} />
        <StatCard icon={CheckCircle2} value={stats.done}    label="Booked / Done"  colorClass="bg-emerald-100 text-emerald-600" delay={0.3} />
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-xl mb-8 w-fit">
        {[['schedule', 'My Schedule'], ['add', 'Add Slots']].map(([key, label]) => (
          <button
            key={key}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab(key)}
          >
            {key === 'add'      && <PlusCircle size={16} />}
            {key === 'schedule' && <Calendar size={16} />}
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Add Slot Tab ── */}
        {tab === 'add' && (
          <motion.div
            key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-lg"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <PlusCircle className="text-[#0284c7]" size={24} /> Add Availability Slot
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-8">Patients will be able to book these slots once you add them.</p>

            <form onSubmit={handleAddSlot} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Date</label>
                <input
                  type="date" required min={today}
                  value={newSlot.date} onChange={e => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/50 transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Time Slot</label>
                <select
                  required value={newSlot.time} onChange={e => setNewSlot({ ...newSlot, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/50 transition-all font-medium text-slate-700"
                >
                  <option value="">Select a time...</option>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {addError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                  <AlertCircle size={16} /> <p>{addError}</p>
                </div>
              )}
              {addSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-600 text-sm font-medium rounded-lg border border-emerald-100">
                  <CheckCircle2 size={16} /> <p>{addSuccess}</p>
                </div>
              )}

              <button
                type="submit" disabled={adding}
                className={`w-full mt-2 py-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center transition-all ${adding ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-[#075985] hover:bg-[#0369a1]'}`}
              >
                {adding ? 'Adding...' : 'Add Slot'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Schedule Tab ── */}
        {tab === 'schedule' && (
          <motion.div
            key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left Panel: Slot List — uses sortedSlots from useMemo */}
            <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Schedule</h3>
                <input
                  type="date" value={viewDate}
                  onChange={e => { setViewDate(e.target.value); setSelected(null) }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/50"
                />
              </div>

              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {loading ? (
                  <div className="flex flex-col justify-center items-center h-48 space-y-3">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading schedule...</p>
                  </div>
                ) : sortedSlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                    <Calendar size={32} className="text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-500 mb-4">No slots scheduled on this date.</p>
                    <button
                      className="px-4 py-2 bg-primary/10 text-[#0284c7] font-bold rounded-lg text-sm hover:bg-primary/20 transition-colors"
                      onClick={() => setTab('add')}
                    >
                      + Add a Slot
                    </button>
                  </div>
                ) : (
                  // sortedSlots is memoised — re-sorts only when slots array changes
                  sortedSlots.map((slot) => {
                    const statusKey = slot.bookingStatus || (slot.isBooked ? 'booked' : 'pending')
                    const s = STATUS_MAP[statusKey] || STATUS_MAP.pending
                    const isSelected = selected?._id === slot._id

                    return (
                      <button
                        key={slot._id}
                        onClick={() => { setSelected(slot); setPrescription('') }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${isSelected ? 'border-[#0284c7] bg-sky-50 shadow-sm ring-1 ring-[#0284c7]' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {slot.isBooked ? <UserIcon size={18} /> : <Clock size={18} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm mb-0.5">
                              {slot.bookedBy?.name ?? (slot.isBooked ? 'Patient' : 'Open Slot')}
                            </div>
                            <div className="text-xs font-medium text-slate-500">
                              {slot.time ?? slot.startTime}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Consultation Detail */}
            <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/30">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <Activity size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">No Consultation Selected</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm">Select a slot from your schedule on the left to view patient details and write prescriptions.</p>
                </div>
              ) : (
                <div className="p-8 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-1">
                        {selected.bookedBy?.name ?? 'Open Slot'}
                      </h2>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                        <Clock size={14} /> {selected.time ?? selected.startTime}
                      </p>
                    </div>
                    {(() => {
                      const sKey = selected.bookingStatus || (selected.isBooked ? 'booked' : 'pending')
                      const s = STATUS_MAP[sKey] || STATUS_MAP.pending
                      return (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      )
                    })()}
                  </div>

                  {/* AI Symptom Brief */}
                  {selected.symptomBrief && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={18} className="text-[#0284c7]" />
                        <span className="text-sm font-bold text-[#0284c7] tracking-wide uppercase">AI Symptom Brief</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed font-medium">
                        {selected.symptomBrief}
                      </p>
                    </div>
                  )}

                  {/* Prescription Section */}
                  {selected.isBooked && (
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" /> Write Prescription
                        </h3>
                        {selected.symptomBrief && !saved[selected._id] && (
                          <button
                            onClick={handleAIAssist}
                            disabled={aiLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-[#0284c7] hover:bg-primary/20 font-bold text-xs rounded-lg transition-colors"
                          >
                            {aiLoading ? (
                              <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Generating...</>
                            ) : (
                              <><Wand2 size={14} /> AI Assist</>
                            )}
                          </button>
                        )}
                      </div>

                      {saved[selected._id] ? (
                        <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-emerald-900 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                          {saved[selected._id]}
                        </div>
                      ) : (
                        <textarea
                          value={prescription}
                          onChange={e => setPrescription(e.target.value)}
                          placeholder={`e.g. Tab Paracetamol 500mg - twice daily for 3 days\nPlenty of fluids and rest...`}
                          className="flex-1 w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-slate-700 resize-none mb-6 min-h-[150px]"
                        />
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-slate-100">
                        {!saved[selected._id] && (
                          <button
                            onClick={() => { if (prescription.trim()) setSaved(p => ({ ...p, [selected._id]: prescription })) }}
                            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckSquare size={18} /> Save Draft
                          </button>
                        )}

                        <button
                          onClick={handleComplete}
                          disabled={!prescription.trim() && !saved[selected._id]}
                          className={`flex-[2] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${(!prescription.trim() && !saved[selected._id]) ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-[#075985] text-white shadow-sm'}`}
                        >
                          <FileText size={18} /> Complete &amp; Generate PDF
                        </button>
                      </div>
                    </div>
                  )}

                  {!selected.isBooked && (
                    <div className="flex flex-col items-center justify-center flex-1 text-center opacity-60">
                      <p className="text-sm font-medium text-slate-500">This slot is still open. Patients can book it from their dashboard.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}