import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { UserCircle, Stethoscope, Activity, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react'

const ROLES = [
  { key: 'patient', icon: UserCircle, title: 'Patient', desc: 'Book slots, describe symptoms, track queue', color: 'bg-primary text-white', route: '/patient' },
  { key: 'doctor',  icon: Stethoscope, title: 'Doctor', desc: 'View schedule, symptom briefs, prescriptions', color: 'bg-doctor text-white', route: '/doctor' },
  { key: 'asha',    icon: Activity, title: 'ASHA Worker', desc: 'Manage patients, book on their behalf', color: 'bg-asha text-white', route: '/asha' },
  { key: 'admin',   icon: ShieldCheck, title: 'Admin', desc: 'Doctor management, analytics, reports', color: 'bg-admin text-white', route: '/admin' },
]

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('select') // 'select' | 'form'
  const [selectedRole, setSelectedRole] = useState(null)
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setMode('form')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let user
      if (isRegister) {
        user = await register({ ...form, role: selectedRole.key })
      } else {
        user = await login(form.email, form.password)
      }
      const role = ROLES.find(r => r.key === user.role)
      navigate(role?.route || '/patient')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-doctor/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-asha/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: '4s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg p-8 sm:p-10 glass rounded-3xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
            <Stethoscope size={32} strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AarogyaLink</h1>
          <p className="text-slate-500 mt-1 font-medium">Rural Telemedicine Platform</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Select your role</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ROLES.map(role => {
                  const Icon = role.icon
                  return (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      key={role.key}
                      onClick={() => handleRoleSelect(role)}
                      className="group flex flex-col items-start p-5 bg-white/50 border border-slate-200 rounded-2xl hover:bg-white hover:border-primary/30 transition-all shadow-sm hover:shadow-md text-left"
                    >
                      <div className={`p-2 rounded-xl mb-3 ${role.color} shadow-sm group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">{role.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col w-full"
            >
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => { setMode('select'); setError(''); setForm({name:'', email:'', password:'', specialty:''}) }}
                  className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft size={16} className="mr-1" /> Back
                </button>
                <div className="flex items-center px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                  <selectedRole.icon size={14} className="mr-1.5" />
                  {selectedRole.title}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100/80 p-1 rounded-xl mb-6 relative">
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors ${!isRegister ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => { setIsRegister(false); setError('') }}
                >
                  Sign In
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors ${isRegister ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => { setIsRegister(true); setError('') }}
                >
                  Register
                </button>
                {/* Active Indicator */}
                <motion.div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
                  animate={{ left: isRegister ? 'calc(50% + 2px)' : '4px' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <AnimatePresence>
                  {isRegister && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={form.name} 
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="Ravi Kumar"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <AnimatePresence>
                  {isRegister && selectedRole?.key === 'doctor' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 mt-4">Specialty</label>
                      <input 
                        type="text" 
                        required
                        value={form.specialty} 
                        onChange={e => setForm({ ...form, specialty: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/70 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="General Medicine"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                    className="text-sm text-red-500 bg-red-50 p-3 rounded-xl mt-2 border border-red-100"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className={`w-full py-3.5 mt-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center transition-all ${selectedRole.color} ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    <>
                      {isRegister ? 'Create Account' : 'Sign In'}
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}