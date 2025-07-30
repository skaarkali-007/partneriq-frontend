import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { store } from '../store'
import { logout, refreshToken } from '../store/slices/authSlice'

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh token
        await store.dispatch(refreshToken())
        
        // Retry the original request with new token
        const state = store.getState()
        const newToken = state.auth.token
        
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logout())
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

// Generic API service class
export class ApiService {
  protected baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await api.request<ApiResponse<T>>({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        ...config,
      })

      return response.data.data
    } catch (error: any) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        errors: error.response?.data?.errors,
        status: error.response?.status,
      }
      throw apiError
    }
  }

  protected get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config)
  }

  protected post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config)
  }

  protected put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config)
  }

  protected patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config)
  }

  protected delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config)
  }
}