import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 max-w-md w-full text-center shadow-sm"
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">404</h1>
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Page Not Found</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#075985] hover:bg-[#0369a1] text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
