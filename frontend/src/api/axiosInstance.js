import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends httpOnly refresh cookie on every request
})

// ── Restore token from localStorage on app load (survives page refresh) ────
const storedToken = localStorage.getItem('aarogya_token')
if (storedToken) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

// ── Request interceptor: always attach the latest token ────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('aarogya_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: silent JWT refresh on 401 ───────────────────────
//
// Teacher checklist: "Axios interceptor: silent access token refresh on 401
// before retrying request"
//
// Flow:
//   1. Request fails with 401 (access token expired)
//   2. Interceptor calls POST /auth/refresh (uses httpOnly refresh cookie)
//   3. Gets a new accessToken → saves to localStorage → retries original request
//   4. All other 401 requests that arrived while refreshing are queued and
//      retried together once the new token is available (failedQueue pattern)
//   5. If the refresh itself fails → clear everything → redirect to /login

let isRefreshing = false
let failedQueue = []  // requests that arrived while a refresh was in-flight

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,  // pass through all successful responses

  async (error) => {
    const originalRequest = error.config

    // Only handle 401s that haven't already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If a refresh is already in-flight, queue this request until it resolves
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      // Mark this request so it doesn't loop if the retry itself 401s
      originalRequest._retry = true
      isRefreshing = true

      try {
        // Silent refresh — the httpOnly cookie is sent automatically
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newToken = data.accessToken

        // Persist and apply the new token
        localStorage.setItem('aarogya_token', newToken)
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

        // Resolve all queued requests with the new token
        processQueue(null, newToken)

        // Retry the original request with the refreshed token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return axiosInstance(originalRequest)

      } catch (refreshError) {
        // Refresh token is also expired or invalid → force full logout
        processQueue(refreshError, null)
        localStorage.removeItem('aarogya_token')
        localStorage.removeItem('aarogya_user')
        delete axiosInstance.defaults.headers.common['Authorization']
        window.location.href = '/login'
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance