import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import PatientDashboard from './pages/Patient/PatientDashboard'
import DoctorDashboard from './pages/Doctor/DoctorDashboard'
import ASHADashboard from './pages/ASHA/ASHADashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ProfileSettings from './pages/Profile/ProfileSettings'

function ProtectedRoute({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to="/login" replace />
  return children
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/doctor"  element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/asha"    element={<ProtectedRoute role="asha"><ASHADashboard /></ProtectedRoute>} />
        <Route path="/admin"   element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<RequireAuth><ProfileSettings /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App