import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Menu, X, LogOut, UserCircle, Stethoscope, Activity, ShieldCheck, LayoutDashboard, Cross, Settings, Sun, Moon, Languages } from 'lucide-react'

const ROLE_CONFIG = {
  patient:  { icon: UserCircle,  label: 'Patient',        color: 'text-sky-700 bg-sky-50 border-sky-200' },
  doctor:   { icon: Stethoscope, label: 'Doctor',         color: 'text-violet-700 bg-violet-50 border-violet-200' },
  asha:     { icon: Activity,    label: 'ASHA Worker',    color: 'text-amber-700 bg-amber-50 border-amber-200' },
  admin:    { icon: ShieldCheck, label: 'Administrator',  color: 'text-red-700 bg-red-50 border-red-200' },
}

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en'
    i18n.changeLanguage(nextLang)
  }

  if (!user) return null

  const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.patient
  const RoleIcon = cfg.icon

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#f0f4f8] dark:bg-slate-950 transition-colors duration-200">
      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/30 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[#075985] dark:bg-slate-900 z-50 flex flex-col transition-all duration-200 border-r border-transparent dark:border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Cross size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold tracking-tight text-base">AarogyaLink</span>
          <button className="ml-auto text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4">
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 mb-2">Navigation</p>
          <button
            onClick={() => { navigate(`/${user.role}`); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white transition-colors mb-1 ${useLocation().pathname === `/${user.role}` ? 'bg-white/15' : 'hover:bg-white/10'}`}
          >
            <LayoutDashboard size={16} /> {t('Dashboard')}
          </button>
          <button
            onClick={() => { navigate('/profile'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${useLocation().pathname === '/profile' ? 'bg-white/15' : 'hover:bg-white/10'}`}
          >
            <Settings size={16} /> {t('Settings')}
          </button>
        </nav>

        {/* User card at bottom */}
        <div className="p-3 border-t border-white/10 dark:border-slate-800">
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border mb-2 ${cfg.color} dark:bg-slate-800/50 dark:border-slate-700 bg-white`}>
            <RoleIcon size={18} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t(cfg.label)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={15} /> {t('Logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 lg:px-8 shrink-0 sticky top-0 z-30 transition-colors duration-200">
          <button
            className="p-1.5 mr-4 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle language"
            >
              <Languages size={16} />
              <span className="uppercase">{i18n.language === 'hi' ? 'HI' : 'EN'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="hidden sm:flex items-center">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.color} dark:bg-slate-800 dark:border-slate-700`}>
                <RoleIcon size={12} /> {t(cfg.label)}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
