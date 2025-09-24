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
  type?: 'network' | 'parse' | 'http' | 'timeout'
  originalError?: any
}

// Retry configuration
interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableStatusCodes: number[]
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableStatusCodes: [500, 502, 503, 504, 408, 429] // Server errors and timeouts
}

// Enhanced error messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  SERVER_ERROR: 'The server is experiencing issues. Please try again in a few moments.',
  NOT_FOUND: 'The requested information is not available.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PARSE_ERROR: 'Received an unexpected response from the server.',
  TIMEOUT: 'The request took too long to complete. Please try again.',
  HTML_RESPONSE: 'The server returned an error page instead of data.'
}

// Enhanced logger utility for comprehensive API error logging
class ApiLogger {
  private static formatLogEntry(level: string, message: string, context?: any) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: 'frontend-api',
      message,
      ...context
    }
  }

  static log(level: 'info' | 'warn' | 'error', message: string, context?: any) {
    const logEntry = this.formatLogEntry(level, message, context)
    
    switch (level) {
      case 'info':
        console.info('[API]', logEntry)
        break
      case 'warn':
        console.warn('[API]', logEntry)
        break
      case 'error':
        console.error('[API]', logEntry)
        break
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }
  }

  static logApiError(error: any, context: string, endpoint?: string, requestData?: any) {
    const errorDetails = {
      context,
      endpoint,
      method: error.config?.method?.toUpperCase(),
      requestData: requestData ? this.sanitizeRequestData(requestData) : undefined,
      status: error.response?.status,
      statusText: error.response?.statusText,
      contentType: error.response?.headers?.['content-type'],
      responseSize: error.response?.headers?.['content-length'],
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorType: this.classifyErrorType(error),
      errorMessage: error.message,
      stack: error.stack,
      // Include raw response for debugging parse errors
      rawResponse: this.shouldLogRawResponse(error) ? this.truncateResponse(error.response?.data) : undefined
    }
    
    this.log('error', `API Error: ${error.message}`, errorDetails)
  }

  static logRetryAttempt(attempt: number, maxRetries: number, endpoint: string, error: any, delay: number) {
    const retryDetails = {
      attempt,
      maxRetries,
      endpoint,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      errorType: this.classifyErrorType(error),
      errorMessage: error.message,
      retryDelay: delay,
      nextRetryAt: new Date(Date.now() + delay).toISOString()
    }
    
    this.log('warn', `Retry attempt ${attempt}/${maxRetries} for ${endpoint}`, retryDetails)
  }

  static logRetryExhausted(endpoint: string, error: any, totalAttempts: number) {
    const exhaustedDetails = {
      endpoint,
      method: error.config?.method?.toUpperCase(),
      totalAttempts,
      finalStatus: error.response?.status,
      finalErrorType: this.classifyErrorType(error),
      finalErrorMessage: error.message
    }
    
    this.log('error', `All retry attempts exhausted for ${endpoint}`, exhaustedDetails)
  }

  static logUserFacingError(userMessage: string, originalError: any, context: string) {
    const userErrorDetails = {
      context,
      userMessage,
      originalErrorType: this.classifyErrorType(originalError),
      originalStatus: originalError.response?.status,
      endpoint: originalError.config?.url,
      method: originalError.config?.method?.toUpperCase(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    }
    
    this.log('error', `User-facing error displayed: ${userMessage}`, userErrorDetails)
  }

  static logJsonParseError(rawResponse: any, contentType: string, endpoint: string) {
    const parseErrorDetails = {
      endpoint,
      contentType,
      responseType: typeof rawResponse,
      responseLength: typeof rawResponse === 'string' ? rawResponse.length : 'N/A',
      responsePreview: this.truncateResponse(rawResponse),
      isHtmlResponse: this.isHtmlContent(rawResponse),
      errorType: 'json_parse_error'
    }
    
    this.log('error', `JSON parsing failed for ${endpoint}`, parseErrorDetails)
  }

  static logSuccessfulRequest(method: string, endpoint: string, duration: number, attempt: number = 1) {
    const successDetails = {
      method: method.toUpperCase(),
      endpoint,
      duration,
      attempt,
      wasRetried: attempt > 1
    }
    
    this.log('info', `API request successful: ${method.toUpperCase()} ${endpoint}`, successDetails)
  }

  static classifyErrorType(error: any): string {
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'timeout'
      }
      return 'network'
    }

    const status = error.response.status
    const contentType = error.response.headers?.['content-type'] || ''

    if (contentType.includes('text/html')) {
      return 'html_response'
    }

    if (status >= 500) return 'server_error'
    if (status >= 400) return 'client_error'
    
    return 'unknown'
  }

  private static shouldLogRawResponse(error: any): boolean {
    // Log raw response for parse errors and HTML responses
    const contentType = error.response?.headers?.['content-type'] || ''
    return contentType.includes('text/html') || 
           error.name === 'SyntaxError' ||
           error.message?.includes('JSON')
  }

  private static truncateResponse(response: any, maxLength: number = 1000): string {
    if (!response) return 'No response data'
    
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response)
    
    if (responseStr.length <= maxLength) {
      return responseStr
    }
    
    return responseStr.substring(0, maxLength) + '... [truncated]'
  }

  private static isHtmlContent(content: any): boolean {
    if (typeof content !== 'string') return false
    
    const trimmed = content.trim().toLowerCase()
    return trimmed.startsWith('<!doctype') || 
           trimmed.startsWith('<!DOCTYPE') || 
           trimmed.startsWith('<html')
  }

  static sanitizeRequestData(data: any): any {
    if (!data) return data
    
    // Remove sensitive fields from logging
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
    const sanitized = { ...data }
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  private static getCurrentUserId(): string | undefined {
    try {
      // Get user ID from Redux store or localStorage
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.userId || payload.sub
      }
    } catch {
      // Ignore errors in user ID extraction
    }
    return undefined
  }

  private static getSessionId(): string {
    // Generate or retrieve session ID for tracking
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  private static sendToLoggingService(_logEntry: any): void {
    // In production, send logs to external service (e.g., DataDog, LogRocket, etc.)
    // This is a placeholder for the actual implementation
    try {
      // Example: Send to logging endpoint
      // fetch('/api/v1/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(() => {}) // Ignore logging errors
    } catch {
      // Ignore errors in logging service
    }
  }
}

// Response validator utility
class ResponseValidator {
  static validateContentType(response: AxiosResponse): boolean {
    const contentType = response.headers['content-type'] || ''
    return contentType.includes('application/json')
  }

  static isJsonResponse(response: AxiosResponse): boolean {
    try {
      if (!this.validateContentType(response)) {
        return false
      }
      
      // If response.data is already parsed by axios, it's valid JSON
      if (typeof response.data === 'object') {
        return true
      }
      
      // If it's a string, try to parse it
      if (typeof response.data === 'string') {
        JSON.parse(response.data)
        return true
      }
      
      return false
    } catch {
      return false
    }
  }

  static extractErrorMessage(response: AxiosResponse): string {
    const contentType = response.headers['content-type'] || ''
    
    if (contentType.includes('text/html')) {
      // Extract title or first heading from HTML
      const htmlContent = typeof response.data === 'string' ? response.data : String(response.data)
      const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i)
      const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i)
      const preMatch = htmlContent.match(/<pre[^>]*>([^<]+)<\/pre>/i)
      
      // If title is just "Error", try to get more specific info from pre tag or h1
      if (titleMatch && titleMatch[1] && titleMatch[1].trim() !== 'Error') {
        return titleMatch[1].trim()
      }
      if (preMatch && preMatch[1]) {
        const preContent = preMatch[1].trim()
        // Convert "Cannot GET /api/v1/..." to user-friendly message
        if (preContent.includes('Cannot GET') || preContent.includes('Cannot POST')) {
          return ERROR_MESSAGES.NOT_FOUND
        }
        return preContent
      }
      if (h1Match && h1Match[1]) {
        return h1Match[1].trim()
      }
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim()
      }
      
      return ERROR_MESSAGES.HTML_RESPONSE
    }
    
    return ERROR_MESSAGES.PARSE_ERROR
  }
}

// Generic API service class with enhanced error handling
export class ApiService {
  protected baseUrl: string
  private retryConfig: RetryConfig

  constructor(baseUrl: string = '', retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.retryConfig.maxRetries) {
      return false
    }

    // Network errors should be retried
    if (!error.response) {
      return true
    }

    // Check if status code is retryable
    const status = error.response.status
    return this.retryConfig.retryableStatusCodes.includes(status)
  }

  private getRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
      this.retryConfig.maxDelay
    )
    
    // Add random jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1)
    return Math.max(0, delay + jitter)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private handleApiError(error: any, endpoint: string, requestData?: any): ApiError {
    // Use enhanced logging for comprehensive error details
    ApiLogger.logApiError(error, 'API Request', endpoint, requestData)

    if (!error.response) {
      // Network error
      const errorMessage = ERROR_MESSAGES.NETWORK_ERROR
      ApiLogger.logUserFacingError(errorMessage, error, 'Network Error')
      
      return {
        message: errorMessage,
        type: 'network',
        originalError: error
      }
    }

    const response = error.response
    const status = response.status

    // Check if response is HTML instead of JSON
    if (!ResponseValidator.isJsonResponse(response)) {
      // Log JSON parsing error with raw response content
      ApiLogger.logJsonParseError(response.data, response.headers['content-type'] || '', endpoint)
      
      const extractedMessage = ResponseValidator.extractErrorMessage(response)
      ApiLogger.logUserFacingError(extractedMessage, error, 'Parse Error')
      
      return {
        message: extractedMessage,
        status,
        type: 'parse',
        originalError: error
      }
    }

    // Handle different HTTP status codes
    let message: string
    let type: ApiError['type'] = 'http'

    switch (status) {
      case 400:
        // Try multiple possible error message fields from backend response
        message = response.data?.error || response.data?.message || ERROR_MESSAGES.VALIDATION_ERROR
        break
      case 401:
        message = response.data?.error || response.data?.message || ERROR_MESSAGES.UNAUTHORIZED
        break
      case 404:
        message = response.data?.error || response.data?.message || ERROR_MESSAGES.NOT_FOUND
        break
      case 408:
        message = response.data?.error || response.data?.message || ERROR_MESSAGES.TIMEOUT
        type = 'timeout'
        break
      case 500:
      case 502:
      case 503:
      case 504:
        // For server errors, still use generic message for security
        message = ERROR_MESSAGES.SERVER_ERROR
        break
      default:
        // For other client errors (422, 409, etc.), show the actual error message
        message = response.data?.error || response.data?.message || ERROR_MESSAGES.SERVER_ERROR
    }

    // Log the user-facing error message
    ApiLogger.logUserFacingError(message, error, `HTTP ${status} Error`)

    return {
      message,
      errors: response.data?.errors,
      status,
      type,
      originalError: error
    }
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    // Handle baseURL override in config
    let endpoint: string
    let requestConfig: AxiosRequestConfig
    
    if (config?.baseURL) {
      // If baseURL is provided in config, construct full URL
      const fullBaseUrl = config.baseURL.startsWith('http') 
        ? config.baseURL 
        : `${API_BASE_URL.replace('/api/v1', '')}${config.baseURL}`
      endpoint = `${fullBaseUrl}${url}`
      requestConfig = { ...config }
      delete requestConfig.baseURL // Remove baseURL from config since we're using full URL
    } else {
      endpoint = `${this.baseUrl}${url}`
      requestConfig = config || {}
    }
    
    let lastError: any

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
      const attemptStartTime = Date.now()
      
      try {
        // Log the API request attempt
        ApiLogger.log('info', `API Request: ${method} ${endpoint}`, { 
          attempt, 
          requestData: data ? ApiLogger.sanitizeRequestData(data) : undefined,
          isRetry: attempt > 1
        })

        const response = await api.request<ApiResponse<T>>({
          method,
          url: endpoint,
          data,
          ...requestConfig,
        })

        // Validate response content type
        if (!ResponseValidator.isJsonResponse(response)) {
          // Log JSON parsing error with raw response content
          ApiLogger.logJsonParseError(response.data, response.headers['content-type'] || '', endpoint)
          throw new Error('Invalid JSON response received')
        }

        // Calculate request duration
        const duration = Date.now() - attemptStartTime
        
        // Log successful request
        ApiLogger.logSuccessfulRequest(method, endpoint, duration, attempt)

        return response.data.data
      } catch (error: any) {
        lastError = error

        // Don't retry on the last attempt
        if (attempt > this.retryConfig.maxRetries) {
          // Log that all retry attempts have been exhausted
          ApiLogger.logRetryExhausted(endpoint, error, attempt)
          break
        }

        // Check if we should retry
        if (!this.shouldRetry(error, attempt)) {
          // Log that error is not retryable
          ApiLogger.log('info', `Error not retryable for ${endpoint}`, {
            attempt,
            errorType: ApiLogger.classifyErrorType(error),
            status: error.response?.status
          })
          break
        }

        // Calculate retry delay
        const delay = this.getRetryDelay(attempt)
        
        // Log retry attempt with detailed information
        ApiLogger.logRetryAttempt(attempt, this.retryConfig.maxRetries, endpoint, error, delay)

        // Wait before retrying
        await this.sleep(delay)
      }
    }

    // All retries exhausted, handle and throw the final error
    const apiError = this.handleApiError(lastError, endpoint, data)
    throw apiError
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