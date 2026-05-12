import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { Users, AlertTriangle, ClipboardCheck, Calendar, Clock, User, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_CONFIG = {
  stable:   { label: 'Stable',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'text-emerald-500' },
  followup: { label: 'Follow-up', class: 'bg-amber-50 text-amber-700 border-amber-200',   iconColor: 'text-amber-500' },
  critical: { label: 'Critical',  class: 'bg-red-50 text-red-700 border-red-200',       iconColor: 'text-red-500' },
}

export default function ASHADashboard() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [booked, setBooked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slots, setSlots] = useState([])
  
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    axiosInstance.get(`/slots?date=${today}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
  }, [today])

  // Mock caseload for the ASHA worker
  const MOCK_PATIENTS = [
    { id: '6a030967e3774b8a563f1382', name: 'Ravi Kumar',   age: 34, village: 'Rampur',    status: 'stable' },
    { id: '6a030967e3774b8a563f1383', name: 'Meena Devi',   age: 52, village: 'Sikar',     status: 'followup' },
    { id: '6a030967e3774b8a563f1384', name: 'Gopal Sharma', age: 67, village: 'Chomu',     status: 'critical' },
    { id: '6a030967e3774b8a563f1385', name: 'Sunita Bai',   age: 28, village: 'Jhunjhunu', status: 'stable' },
  ]

  const handleBook = async () => {
    if (!selectedSlot || !selectedPatient) return
    setLoading(true)
    setError('')
    try {
      await axiosInstance.post('/bookings', {
        slotId: selectedSlot._id,
        patientId: selectedPatient.id,
        symptomBrief: `Booked by ASHA Worker (${user?.name}) on behalf of ${selectedPatient.name}. Village: ${selectedPatient.village}.`,
      })
      setBooked(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please check slot availability.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout 
      title="ASHA Dashboard" 
      subtitle={`Community Health Worker: ${user?.name} · Rural Outreach & Scheduling`}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: 'Patients in Caseload', value: MOCK_PATIENTS.length, color: 'text-amber-700 bg-amber-50 border-amber-100' },
          { icon: AlertTriangle, label: 'Critical Cases', value: MOCK_PATIENTS.filter(p => p.status === 'critical').length, color: 'text-red-700 bg-red-50 border-red-100' },
          { icon: ClipboardCheck, label: 'Follow-ups Needed', value: MOCK_PATIENTS.filter(p => p.status === 'followup').length, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center border shrink-0 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">Assigned Patients</h2>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {MOCK_PATIENTS.map((p) => {
              const cfg = STATUS_CONFIG[p.status]
              const isSelected = selectedPatient?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPatient(p); setSelectedSlot(null); setBooked(false); setError('') }}
                  className={`w-full text-left p-4 transition-all border-l-4 ${isSelected ? 'bg-sky-50 border-[#0284c7]' : 'bg-white border-transparent hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <User size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.class}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-11">{p.village} &bull; Age {p.age}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Booking Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
          <AnimatePresence mode="wait">
            {!selectedPatient ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-[500px] text-slate-400 p-8">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <User size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Select a patient from the list to book an appointment</p>
              </motion.div>
            ) : booked ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[500px] p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Booking Confirmed</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-8">
                  Successfully booked a consultation for <strong>{selectedPatient.name}</strong> with <strong>{selectedSlot?.doctorId?.name}</strong> at <strong>{selectedSlot?.time}</strong>.
                </p>
                <button
                  onClick={() => { setBooked(false); setSelectedSlot(null); setSelectedPatient(null) }}
                  className="px-6 py-2.5 bg-[#075985] text-white font-semibold rounded-lg hover:bg-[#0369a1] transition-colors shadow-sm"
                >
                  Book Another Patient
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">Book for {selectedPatient.name}</h2>
                    <p className="text-xs text-slate-400 font-medium">Village: {selectedPatient.village} &bull; Status: {selectedPatient.status}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-500">
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
                      <div className="col-span-full flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50">
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
                            className={`p-4 rounded-xl border text-left transition-all ${isSelected ? 'border-[#0284c7] bg-sky-50 ring-1 ring-[#0284c7]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{slot.doctorId?.name}</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{slot.doctorId?.specialty}</p>
                              </div>
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#075985] bg-sky-100/50 px-2 py-1 rounded">
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
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${(!selectedSlot || loading) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#075985] text-white hover:bg-[#0369a1] shadow-md hover:shadow-lg'}`}
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