import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { useQueuePosition } from '../../hooks/useQueuePosition'
import { Calendar, CheckCircle2, Hash, Clock, User as UserIcon, AlertCircle, Activity } from 'lucide-react'

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

  const queueInfo = useQueuePosition(
    booked ? bookedData?.booking?.doctorId : null,
    booked ? bookedData?.booking?._id : null
  )

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

  const StatCard = ({ icon: Icon, value, label, colorClass, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
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
  )

  return (
    <DashboardLayout 
      title={`Namaste, ${user?.name?.split(' ')[0] ?? 'Patient'} 👋`}
      subtitle="Book a consultation or track your upcoming appointments"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={Calendar} value={upcomingCount} label="Upcoming" colorClass="bg-primary/10 text-primary" delay={0.1} />
        <StatCard icon={CheckCircle2} value={doneCount} label="Consultations Done" colorClass="bg-emerald-100 text-emerald-600" delay={0.2} />
        <StatCard icon={Hash} value={bookedData?.queuePos ?? '—'} label="Queue Position" colorClass="bg-amber-100 text-amber-600" delay={0.3} />
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-xl mb-8 w-fit">
        {[['book', 'Book a Slot'], ['history', 'My Bookings']].map(([key, label]) => (
          <button 
            key={key} 
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'book' && (
          <motion.div 
            key="book"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Slot Picker */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar className="text-primary" size={24} /> Choose a Date & Slot
              </h3>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-slate-700"
                />
              </div>

              <div className="flex-1">
                {loadingSlots ? (
                  <div className="flex flex-col justify-center items-center h-48 space-y-3">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading available slots...</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Calendar size={32} className="text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-500">No slots available on this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                    {slots.map(slot => (
                      <button
                        key={slot._id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${selectedSlot?._id === slot._id ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-sm' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'}`}
                      >
                        <div className="font-bold text-slate-800 mb-1">{slot.doctorId?.name ?? 'Doctor'}</div>
                        <div className="text-xs font-medium text-slate-500 mb-3">{slot.doctorId?.specialty ?? slot.specialty ?? 'General'}</div>
                        <div className="mt-auto inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">
                          <Clock size={12} /> {slot.time}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Symptom Form & Success */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              <AnimatePresence mode="wait">
                {booked ? (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center h-full justify-center"
                  >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Booking Confirmed!</h3>
                    <p className="text-slate-500 font-medium mb-8">
                      {selectedSlot?.doctorId?.name ?? 'Doctor'} &bull; {selectedSlot?.time}
                    </p>
                    
                    {bookedData?.booking && (
                      <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl w-full text-center relative overflow-hidden mb-8">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                        <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2">Live Queue Position</p>
                        <div className="text-5xl font-black text-amber-500 tracking-tighter mb-3">
                          #{queueInfo.connected && queueInfo.position ? queueInfo.position : (bookedData.queuePos ?? '?')}
                        </div>
                        {queueInfo.connected && queueInfo.patientsAhead > 0 && (
                          <p className="text-sm font-medium text-amber-700">
                            {queueInfo.patientsAhead} patient(s) ahead of you.
                          </p>
                        )}
                        {queueInfo.connected && queueInfo.position === 1 && (
                          <motion.p 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-bold text-emerald-600 mt-2 bg-emerald-50 py-1.5 px-3 rounded-full inline-block"
                          >
                            You are next! Please get ready.
                          </motion.p>
                        )}
                      </div>
                    )}
                    <button 
                      onClick={() => { setBooked(false); setSymptom(''); setSelectedSlot(null); setBookedData(null) }}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                      Book Another Consultation
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
                      <Activity className="text-primary" size={24} /> Describe Symptoms
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mb-6">Our AI will create a structured medical brief for the doctor.</p>
                    
                    {error && (
                      <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    <textarea
                      value={symptom}
                      onChange={e => setSymptom(e.target.value)}
                      placeholder="e.g. I have had a fever of 101°F for 3 days along with a sore throat..."
                      className="w-full flex-1 min-h-[200px] px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-slate-700 resize-none mb-6"
                    />

                    {selectedSlot ? (
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between mb-6">
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Selected Slot</p>
                          <p className="text-sm font-bold text-slate-800">{selectedSlot.doctorId?.name ?? 'Doctor'} at {selectedSlot.time}</p>
                        </div>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 border-dashed p-4 rounded-xl text-center mb-6">
                        <p className="text-sm font-medium text-slate-500">Please select a slot from the left to continue.</p>
                      </div>
                    )}

                    <button
                      onClick={handleBook}
                      disabled={!selectedSlot || !symptom.trim() || loadingBook}
                      className={`w-full py-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center transition-all ${(!selectedSlot || !symptom.trim() || loadingBook) ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary-light hover:shadow-lg hover:-translate-y-0.5'}`}
                    >
                      {loadingBook ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                           Booking Appointment...
                        </>
                      ) : 'Confirm Booking'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="text-slate-400" size={24} /> Booking History
            </h3>
            
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="font-medium text-slate-500">No bookings found.</p>
                </div>
              ) : bookings.map((b, i) => {
                const isCompleted = b.status === 'completed'
                const isCancelled = b.status === 'cancelled'
                const statusColor = isCompleted ? 'bg-emerald-100 text-emerald-700' : isCancelled ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'
                
                return (
                  <div key={b._id ?? i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{b.doctorId?.name ?? 'Doctor'}</div>
                        <div className="text-sm font-medium text-slate-500 mt-0.5">{b.slotId?.date ?? '—'} &bull; {b.slotId?.time ?? '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto ml-16 sm:ml-0">
                      {b.queuePos && b.status === 'booked' && (
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          <Hash size={14} /> {b.queuePos} in queue
                        </div>
                      )}
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                        {b.status || 'booked'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}