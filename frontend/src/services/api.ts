import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../config/apiConfig'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const tenantId = localStorage.getItem('tenantId')
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor (single-flight token refresh) ─────────────────────
// Concurrent 401s share ONE refresh call, so token rotation doesn't invalidate
// the others. The rotated refreshToken is persisted for the next cycle.
let refreshPromise: Promise<string> | null = null

function doRefresh(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken')
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true })
      .then((res) => {
        const data = res.data?.data ?? res.data
        localStorage.setItem('accessToken', data.accessToken)
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
        return data.accessToken as string
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config

    // Never try to refresh the auth calls themselves
    const isAuthCall =
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/login')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCall) {
      originalRequest._retry = true
      try {
        const accessToken = await doRefresh()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('tenantId')
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
