import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import DashboardLayout from '../../components/DashboardLayout'
import { User, Phone, Mail, Shield, Save, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ProfileSettings() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({ name: '', phone: '' })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axiosInstance.get('/users/profile')
        setProfile(data)
        setFormData({ name: data.name || '', phone: data.phone || '' })
      } catch (err) {
        setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load profile data.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await axiosInstance.put('/users/profile', formData)
      setSuccess('Profile updated successfully!')
      
      // Update local storage so Navbar reflects name change if needed
      const storedUser = JSON.parse(localStorage.getItem('aarogya_user') || '{}')
      storedUser.name = data.user.name
      localStorage.setItem('aarogya_user', JSON.stringify(storedUser))
      
      // The context will update on next refresh, or we can just show success
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Profile Settings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-[#0284c7]/30 dark:border-[#38bdf8]/30 border-t-[#0284c7] dark:border-t-[#38bdf8] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Profile Settings" subtitle="Manage your personal information and preferences.">
      <div className="max-w-3xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex items-center gap-4">
          <div className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500">
            <User size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Profile Settings</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage your personal information and preferences.</p>
          </div>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Mail size={14}/> Email Address</label>
              <input type="text" value={profile?.email || ''} disabled className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={14}/> Account Role</label>
              <input type="text" value={profile?.role?.toUpperCase() || ''} disabled className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium cursor-not-allowed" />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Editable fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><User size={14}/> Full Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/50 text-slate-700 dark:text-slate-200 font-medium transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone size={14}/> Phone Number</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="e.g. +91 9876543210" className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/50 text-slate-700 dark:text-slate-200 font-medium transition-all" />
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/50">
              <AlertCircle size={18} /> <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 size={18} /> <p>{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={saving || !formData.name.trim()} className={`px-6 py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${saving ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 shadow-none cursor-not-allowed' : 'bg-[#075985] hover:bg-[#0369a1]'}`}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
    </DashboardLayout>
  )
}
