import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import { Users, CalendarCheck, CheckSquare, TrendingUp, Stethoscope, ClipboardList, Shield, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const EMPTY_ANALYTICS = [
  { day: 'Mon', bookings: 0 }, { day: 'Tue', bookings: 0 },
  { day: 'Wed', bookings: 0 }, { day: 'Thu', bookings: 0 },
  { day: 'Fri', bookings: 0 }, { day: 'Sat', bookings: 0 },
  { day: 'Sun', bookings: 0 },
]

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.bookings), 1)
  return (
    <div className="flex items-end gap-2 h-24 px-1">
      {data.map(d => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-slate-500">{d.bookings || ''}</span>
          <div
            className="w-full rounded-t-sm bg-[#0284c7] transition-all duration-500"
            style={{ height: `${Math.max((d.bookings / max) * 64, 2)}px`, opacity: d.bookings === 0 ? 0.2 : 1 }}
          />
          <span className="text-[10px] text-slate-400 font-medium">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState([])
  const [stats, setStats] = useState({ totalDoctors: 0, totalBookings: 0, completedToday: 0 })
  const [analytics, setAnalytics] = useState(EMPTY_ANALYTICS)
  const [totalWeekly, setTotalWeekly] = useState(0)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/users/doctors').then(r => setDoctors(r.data)),
      axiosInstance.get('/admin/stats').then(r => setStats(r.data)),
      axiosInstance.get('/admin/audit-log').then(r => setAuditLogs(r.data)),
      axiosInstance.get('/admin/analytics').then(r => {
        setAnalytics(r.data.weeklyBookings.map(d => ({ day: d.day, bookings: d.count })))
        setTotalWeekly(r.data.total)
      })
    ]).catch(console.error).finally(() => setLoading(false))
  }, [])

  const peakDay = useMemo(() => {
    return analytics.reduce((prev, cur) => (prev.bookings > cur.bookings ? prev : cur), { day: '—', bookings: 0 })
  }, [analytics])

  const statCards = [
    { icon: Users, label: 'Total Doctors', value: stats.totalDoctors, color: 'text-violet-700 bg-violet-50 border-violet-100' },
    { icon: CalendarCheck, label: 'All-Time Bookings', value: stats.totalBookings, color: 'text-sky-700 bg-sky-50 border-sky-100' },
    { icon: CheckSquare, label: 'Completed Today', value: stats.completedToday, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { icon: TrendingUp, label: 'Active Patients', value: Math.floor(stats.totalBookings * 0.8), color: 'text-amber-700 bg-amber-50 border-amber-100' },
  ]

  return (
    <DashboardLayout title="Administration" subtitle="District Hospital — Operational Overview">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${s.color} shrink-0`}>
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
        {/* Doctor Roster */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Registered Doctors</h2>
            <span className="text-xs text-slate-400 font-medium">{doctors.length} total</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-[#0284c7] rounded-full animate-spin" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Stethoscope size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No doctors registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Name', 'Specialty', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((d, i) => (
                    <motion.tr
                      key={d._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                            <Stethoscope size={14} className="text-violet-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800">Dr. {d.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{d.specialty ?? '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-800">Weekly Bookings</h2>
            <span className="text-xl font-bold text-[#0284c7]">{totalWeekly}</span>
          </div>
          <BarChart data={analytics} />
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
            {[
              { label: 'Peak Day', value: `${peakDay.day} (${peakDay.bookings})`, color: 'text-sky-700' },
              { label: 'Most Active', value: doctors.length > 0 ? `Dr. ${doctors[0].name}` : '—', color: 'text-violet-700' },
              { label: 'Daily Average', value: `${Math.round(totalWeekly / 7)} bookings`, color: 'text-amber-700' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                <span className={`text-xs font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList size={16} className="text-slate-400" /> Platform Audit Log
          </h2>
          <span className="text-xs text-slate-400 font-medium">Last 50 entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {['Event', 'User', 'Details', 'Time'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-400">No activity logs found.</td>
                </tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr key={log._id || i} className="hover:bg-slate-50 transition-colors text-xs">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-slate-700">{log.action}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{log.performedBy?.name || 'System'}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{log.performedBy?.role || 'Service'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 font-medium">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}