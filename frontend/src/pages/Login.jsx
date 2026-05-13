import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { UserCircle, Stethoscope, Activity, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle, Cross } from 'lucide-react'

const ROLES = [
  {
    key: 'patient', icon: UserCircle, title: 'Patient',
    desc: 'Book consultations, track queue position, download prescriptions',
    border: 'border-sky-200', accent: 'bg-sky-600', badge: 'bg-sky-50 text-sky-700 border-sky-200',
    route: '/patient'
  },
  {
    key: 'doctor', icon: Stethoscope, title: 'Doctor',
    desc: 'Manage schedule, review clinical briefs, issue prescriptions',
    border: 'border-violet-200', accent: 'bg-violet-700', badge: 'bg-violet-50 text-violet-700 border-violet-200',
    route: '/doctor'
  },
  {
    key: 'asha', icon: Activity, title: 'ASHA Worker',
    desc: 'Book on behalf of patients, manage local community caseload',
    border: 'border-amber-200', accent: 'bg-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200',
    route: '/asha'
  },
  {
    key: 'admin', icon: ShieldCheck, title: 'Administrator',
    desc: 'Manage staff, view analytics, generate operational reports',
    border: 'border-red-200', accent: 'bg-red-700', badge: 'bg-red-50 text-red-700 border-red-200',
    route: '/admin'
  },
]

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('select')
  const [selectedRole, setSelectedRole] = useState(null)
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      const role = ROLES.find(r => r.key === user.role)
      navigate(role?.route || '/patient', { replace: true })
    }
  }, [user, navigate])

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
      if (isRegister) {
        await register({ ...form, role: selectedRole.key })
      } else {
        await login(form.email, form.password)
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex font-sans" style={{ background: '#f0f4f8' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-[#075985] p-12 text-white relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.5) 40px, rgba(255,255,255,0.5) 41px)' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Cross size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight">AarogyaLink</span>
          </div>
          <h2 className="text-4xl font-bold leading-snug mb-4">
            Rural Telemedicine<br />at Scale
          </h2>
          <p className="text-sky-200 text-sm leading-relaxed">
            Connecting patients in remote villages with certified district hospital doctors through AI-assisted consultations and real-time queue management.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { label: 'AI Symptom Triage', desc: 'Structured clinical briefs before every consult' },
            { label: 'Live Queue Tracking', desc: 'Real-time position via Server-Sent Events' },
            { label: 'Prescription PDFs', desc: 'Asynchronous generation via worker threads' },
          ].map(f => (
            <div key={f.label} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-sky-300">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
        >
          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-1 lg:hidden">
              <div className="w-8 h-8 bg-[#075985] rounded-lg flex items-center justify-center">
                <Cross size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-800">AarogyaLink</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === 'select' ? 'Select your role' : (isRegister ? 'Create account' : 'Sign in')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'select' ? 'Choose your role to continue' : `Continuing as ${selectedRole?.title}`}
            </p>
          </div>

          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              {mode === 'select' ? (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ROLES.map(role => {
                      const Icon = role.icon
                      return (
                        <button
                          key={role.key}
                          onClick={() => handleRoleSelect(role)}
                          className={`group flex flex-col items-start p-4 bg-white border-2 ${role.border} rounded-xl hover:bg-slate-50 transition-all text-left`}
                        >
                          <div className={`w-8 h-8 ${role.accent} rounded-lg flex items-center justify-center mb-3`}>
                            <Icon size={16} className="text-white" />
                          </div>
                          <h3 className="font-semibold text-slate-800 text-sm mb-1">{role.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Back + role badge */}
                  <div className="flex items-center justify-between mb-5">
                    <button
                      onClick={() => { setMode('select'); setError(''); setForm({ name: '', email: '', password: '', specialty: '' }) }}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
                    >
                      <ArrowLeft size={15} /> Back
                    </button>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${selectedRole.badge}`}>
                      <selectedRole.icon size={12} /> {selectedRole.title}
                    </span>
                  </div>

                  {/* Sign In / Register tabs */}
                  <div className="flex border border-slate-200 rounded-lg p-0.5 mb-6">
                    {[['Sign In', false], ['Register', true]].map(([label, val]) => (
                      <button
                        key={label}
                        onClick={() => { setIsRegister(val); setError('') }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${isRegister === val ? 'bg-[#075985] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence>
                      {isRegister && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Full Name</label>
                          <input
                            type="text" required value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] text-sm transition-all"
                            placeholder="Full name"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Email Address</label>
                      <input
                        type="email" required value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] text-sm transition-all"
                        placeholder="you@hospital.in"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Password</label>
                      <input
                        type="password" required value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] text-sm transition-all"
                        placeholder="••••••••"
                      />
                    </div>

                    <AnimatePresence>
                      {isRegister && selectedRole?.key === 'doctor' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Medical Specialty</label>
                          <input
                            type="text" required value={form.specialty}
                            onChange={e => setForm({ ...form, specialty: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/40 focus:border-[#0284c7] text-sm transition-all"
                            placeholder="e.g. General Medicine"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        <AlertCircle size={15} className="shrink-0" /> <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit" disabled={loading}
                      className={`w-full py-3 mt-2 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#075985] hover:bg-[#0369a1] shadow-sm hover:shadow-md'}`}
                    >
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                      ) : (
                        <>{isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}