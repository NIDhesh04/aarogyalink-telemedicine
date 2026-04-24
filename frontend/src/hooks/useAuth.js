// This hook is superseded by AuthContext.jsx which now handles real JWT auth.
// Re-exported for backward compatibility in case any component imports this directly.
export { useAuth } from '../context/AuthContext'