import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import PatientDashboard from './pages/Patient/PatientDashboard'
import DoctorDashboard from './pages/Doctor/DoctorDashboard'
import ASHADashboard from './pages/ASHA/ASHADashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/asha" element={<ASHADashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App