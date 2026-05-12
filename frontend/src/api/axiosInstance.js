import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5005/api',
  withCredentials: true,
})

// Restore JWT token from localStorage on app load (survives page refresh)
const storedToken = localStorage.getItem('aarogya_token')
if (storedToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

// Add response interceptor to handle 401 Unauthorized errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('aarogya_token')
      localStorage.removeItem('aarogya_user')
      delete axiosInstance.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance