import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // needed for httpOnly cookie (JWT refresh token)
})

export default axiosInstance