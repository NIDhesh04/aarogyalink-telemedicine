import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut, UserCircle, Stethoscope, Activity, ShieldCheck, Home } from 'lucide-react'

const ROLE_COLORS = { patient: 'text-primary bg-primary/10', doctor: 'text-doctor bg-doctor/10', asha: 'text-asha bg-asha/10', admin: 'text-admin bg-admin/10' }
const ROLE_ICONS  = { patient: UserCircle, doctor: Stethoscope, asha: Activity, admin: ShieldCheck }

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return null

  const RoleIcon = ROLE_ICONS[user.role] || UserCircle
  const colorClass = ROLE_COLORS[user.role] || 'text-slate-500 bg-slate-100'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLinks = [
    { name: 'Dashboard', icon: Home, path: `/${user.role}` }
    // Add more role-specific links here in the future
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed lg:static top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0"
        style={{ transform: sidebarOpen ? 'translateX(0)' : '' }}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-light rounded-xl flex items-center justify-center text-white shadow-md">
            <Stethoscope size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">AarogyaLink</span>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map(link => {
            const Icon = link.icon
            return (
              <button
                key={link.name}
                onClick={() => { navigate(link.path); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-primary bg-primary/5 hover:bg-primary/10"
              >
                <Icon size={18} />
                {link.name}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${colorClass}`}>
            <RoleIcon size={24} />
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-none">{user.name}</span>
              <span className="text-xs font-medium uppercase tracking-wider mt-1 opacity-80">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6 lg:px-10 shrink-0 z-30 sticky top-0">
          <button className="p-2 mr-4 rounded-lg bg-white border border-slate-200 text-slate-500 lg:hidden shadow-sm" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm font-medium text-slate-500">{subtitle}</p>}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
