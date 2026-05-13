import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { Users, AlertTriangle, ClipboardCheck, Calendar, Clock, User, ChevronRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

// useCallback: patient status is derived from their last booking —
// this helper is memoised so it isn't recreated on every render
const deriveStatus = (patient) => {
  if (!patient) return 'stable'
  return patient.status || 'stable'
}

const STATUS_CONFIG = {
  stable:   { label: 'Stable',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50', iconColor: 'text-emerald-500' },
  followup: { label: 'Follow-up', class: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50',       iconColor: 'text-amber-500' },
  critical: { label: 'Critical',  class: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50',             iconColor: 'text-red-500' },
}

export default function ASHADashboard() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])        // ← real data from API
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booked, setBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slots, setSlots] = useState([])

  const today = new Date().toISOString().split('T')[0]

  // ── Fetch real patient list from the backend ────────────────────────────
  // useCallback: fetchPatients is passed as a dependency to useEffect.
  // Without useCallback it would be recreated every render, causing an
  // infinite fetch loop.
  const fetchPatients = useCallback(() => {
    setLoadingPatients(true)
    axiosInstance.get('/users/patients')
      .then(r => setPatients(r.data))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false))
  }, [])

  // useCallback: slot fetch is triggered by date changes — stabilise the
  // reference so it can be reused without causing extra re-renders.
  const fetchSlots = useCallback((date) => {
    axiosInstance.get(`/slots?date=${date}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
  }, [])

  useEffect(() => { fetchPatients() }, [fetchPatients])
  useEffect(() => { fetchSlots(today) }, [today, fetchSlots])

  // ── Book on behalf of a patient ────────────────────────────────────────
  // useCallback: event handler — stabilised so it is not recreated unless
  // selectedSlot or selectedPatient changes.
  const handleBook = useCallback(async () => {
    if (!selectedSlot || !selectedPatient) return
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post('/bookings', {
        slotId: selectedSlot._id,
        patientId: selectedPatient._id,   // ← uses real MongoDB _id
        symptomBrief: `Booked by ASHA Worker (${user?.name}) on behalf of ${selectedPatient.name}. Village: ${selectedPatient.village || 'N/A'}.`,
      })
      setBooked(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please check slot availability.')
    } finally {
      setLoading(false)
    }
  }, [selectedSlot, selectedPatient, user?.name])

  // ── Reset booking state ────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setBooked(false)
    setSelectedSlot(null)
    setSelectedPatient(null)
    setError('')
  }, [])

  // ── Derived stats ──────────────────────────────────────────────────────
  const criticalCount = patients.filter(p => deriveStatus(p) === 'critical').length
  const followupCount = patients.filter(p => deriveStatus(p) === 'followup').length

  return (
    <DashboardLayout
      title="ASHA Dashboard"
      subtitle={`Community Health Worker: ${user?.name} · Rural Outreach & Scheduling`}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users,         label: 'Patients in Caseload', value: patients.length,  color: 'text-amber-700 bg-amber-50 border-amber-100' },
          { icon: AlertTriangle, label: 'Critical Cases',        value: criticalCount,    color: 'text-red-700 bg-red-50 border-red-100' },
          { icon: ClipboardCheck,label: 'Follow-ups Needed',     value: followupCount,    color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm transition-colors">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center border shrink-0 ${s.color} dark:bg-slate-800 dark:border-slate-700`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm transition-colors">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Assigned Patients</h2>
            <button
              onClick={fetchPatients}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh patient list"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {loadingPatients ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <Users size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400 font-medium">No patients assigned yet.</p>
              <p className="text-xs text-slate-400 mt-1">Patients registered in the system will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[500px]">
              {patients.map((p) => {
                const status = deriveStatus(p)
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.stable
                const isSelected = selectedPatient?._id === p._id
                return (
                  <button
                    key={p._id}
                    onClick={() => { setSelectedPatient(p); setSelectedSlot(null); setBooked(false); setError('') }}
                    className={`w-full text-left p-4 transition-all border-l-4 ${isSelected ? 'bg-sky-50 dark:bg-[#075985]/10 border-[#0284c7]' : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#0284c7] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                          <User size={14} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.class}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 ml-11">{p.email}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Booking Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm transition-colors">
          <AnimatePresence mode="wait">
            {!selectedPatient ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[500px] text-slate-400 p-8">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                  <User size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Select a patient from the list to book an appointment</p>
              </motion.div>

            ) : booked ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[500px] p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Booking Confirmed</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                  Successfully booked a consultation for <strong className="dark:text-slate-300">{selectedPatient.name}</strong> with{' '}
                  <strong className="dark:text-slate-300">{selectedSlot?.doctorId?.name || 'Doctor'}</strong> at{' '}
                  <strong className="dark:text-slate-300">{selectedSlot?.time}</strong>.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-[#075985] text-white font-semibold rounded-lg hover:bg-[#0369a1] transition-colors shadow-sm"
                >
                  Book Another Patient
                </button>
              </motion.div>

            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Book for {selectedPatient.name}</h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {selectedPatient.email} · Role: {selectedPatient.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Calendar size={12} /> {today}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Available District Hospital Slots</h3>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 mb-4">
                      <AlertCircle size={16} /> <span>{error}</span>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 pr-1">
                    {slots.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <Calendar size={24} className="text-slate-300 mb-2" />
                        <p className="text-sm text-slate-400">No availability from doctors today</p>
                      </div>
                    ) : (
                      slots.map(slot => {
                        const isSelected = selectedSlot?._id === slot._id
                        return (
                          <button
                            key={slot._id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-[#0284c7] bg-sky-50 dark:bg-[#075985]/20 ring-1 ring-[#0284c7]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{slot.doctorId?.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{slot.doctorId?.specialty}</p>
                              </div>
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#075985] dark:text-[#38bdf8] bg-sky-100/50 dark:bg-[#075985]/30 px-2 py-1 rounded">
                                <Clock size={11} /> {slot.time}
                              </span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={!selectedSlot || loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${(!selectedSlot || loading) ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-[#075985] text-white hover:bg-[#0369a1] shadow-md hover:shadow-lg'}`}
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Confirming...</>
                    ) : (
                      <>Confirm Appointment for {selectedPatient.name} <ChevronRight size={18} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  )
}