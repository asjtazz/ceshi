import axios from 'axios'
import { showToast } from 'vant'
import router from '@/router'

const isDingtalk = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('dingtalk')
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true' || 
                import.meta.env.DEV

let BASE_URL = ''

if (useMock) {
  BASE_URL = 'http://localhost:3002/api'
} else {
  BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
}

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json; charset=utf-8' }
})

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('assets_token')
  const user = localStorage.getItem('assets_user')
  
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  if (isDingtalk()) {
    config.headers['X-Dingtalk-User'] = user || ''
  }
  
  return config
})

instance.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const status = err.response?.status
    const origReq = err.config

    if (status === 401 && !origReq?._retry) {
      origReq._retry = true
      const refreshToken = localStorage.getItem('assets_refresh_token')
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          localStorage.setItem('assets_token', res.data.token)
          origReq.headers.Authorization = `Bearer ${res.data.token}`
          return instance(origReq)
        } catch {
          localStorage.clear()
          router.push(isDingtalk() ? '/dingtalk' : '/')
          showToast('登录已过期，请重新登录')
        }
      } else {
        localStorage.clear()
        router.push(isDingtalk() ? '/dingtalk' : '/')
      }
    }

    const msg = err.response?.data?.message || '网络异常，请稍后重试'
    if (status !== 401) showToast(msg)
    return Promise.reject(err)
  }
)

export default instance
