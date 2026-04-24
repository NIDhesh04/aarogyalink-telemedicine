import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
})

// Restore JWT token from localStorage on app load (survives page refresh)
const storedToken = localStorage.getItem('aarogya_token')
if (storedToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

export default axiosInstance