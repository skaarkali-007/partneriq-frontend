import toast from 'react-hot-toast'
import { ApiError } from '../types/api'

export type ErrorType = 'network' | 'server' | 'client' | 'parse' | 'timeout' | 'validation' | 'auth' | 'unknown'

export class AppError extends Error {
  public status?: number
  public errors?: Record<string, string[]>
  public type: ErrorType
  public originalError?: any
  public responseText?: string
  public contentType?: string

  constructor(
    message: string, 
    type: ErrorType = 'unknown',
    status?: number, 
    errors?: Record<string, string[]>,
    originalError?: any,
    responseText?: string,
    contentType?: string
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.status = status
    this.errors = errors
    this.originalError = originalError
    this.responseText = responseText
    this.contentType = contentType
  }
}

/**
 * Detects if a response contains HTML content instead of JSON
 */
export const isHtmlResponse = (response: any): boolean => {
  if (!response) return false
  
  const contentType = response.headers?.['content-type'] || response.headers?.['Content-Type'] || ''
  const responseText = typeof response.data === 'string' ? response.data : ''
  
  return (
    contentType.includes('text/html') ||
    responseText.trim().startsWith('<!DOCTYPE') ||
    responseText.trim().startsWith('<!doctype') ||
    responseText.trim().startsWith('<html')
  )
}

/**
 * Extracts error message from HTML error pages
 */
export const extractHtmlErrorMessage = (htmlContent: string): string => {
  // Try to extract title from HTML
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim()
    if (title && !title.toLowerCase().includes('error')) {
      return title
    }
  }
  
  // Try to extract h1 content
  const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim()
  }
  
  // Default message for HTML responses
  return 'The server returned an error page instead of the expected data'
}

/**
 * Classifies error type based on error properties
 */
export const classifyError = (error: any): ErrorType => {
  // Network errors (no response received)
  if (error.request && !error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'timeout'
    }
    return 'network'
  }
  
  // JSON parsing errors
  if (error.name === 'SyntaxError' && error.message?.includes('JSON')) {
    return 'parse'
  }
  
  // Response received but with error status
  if (error.response) {
    const status = error.response.status
    
    // Validation errors (check before other client errors)
    if (error.response.data?.errors && typeof error.response.data.errors === 'object') {
      return 'validation'
    }
    
    // Authentication/Authorization errors
    if (status === 401 || status === 403) {
      return 'auth'
    }
    
    // Client errors (4xx)
    if (status >= 400 && status < 500) {
      return 'client'
    }
    
    // Server errors (5xx)
    if (status >= 500) {
      return 'server'
    }
  }
  
  return 'unknown'
}

/**
 * Gets user-friendly error message based on error type and status
 */
export const getUserFriendlyMessage = (error: any, errorType: ErrorType): string => {
  const status = error.response?.status
  
  switch (errorType) {
    case 'network':
      return ERROR_MESSAGES.NETWORK_ERROR
    
    case 'timeout':
      return ERROR_MESSAGES.TIMEOUT
    
    case 'server':
      if (status === 500) {
        return ERROR_MESSAGES.SERVER_ERROR
      }
      if (status === 502 || status === 503 || status === 504) {
        return 'The service is temporarily unavailable. Please try again in a few moments.'
      }
      return ERROR_MESSAGES.SERVER_ERROR
    
    case 'client':
      if (status === 404) {
        return ERROR_MESSAGES.NOT_FOUND
      }
      if (status === 400) {
        return ERROR_MESSAGES.VALIDATION_ERROR
      }
      return 'There was a problem with your request. Please try again.'
    
    case 'auth':
      if (status === 401) {
        return ERROR_MESSAGES.SESSION_EXPIRED
      }
      if (status === 403) {
        return ERROR_MESSAGES.FORBIDDEN
      }
      return ERROR_MESSAGES.UNAUTHORIZED
    
    case 'parse':
      return ERROR_MESSAGES.PARSE_ERROR
    
    case 'validation':
      return ERROR_MESSAGES.VALIDATION_ERROR
    
    default:
      return error.message || 'An unexpected error occurred'
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    // Log the existing AppError for monitoring
    ErrorLogger.logAppError(error, 'Existing AppError')
    return error
  }

  const errorType = classifyError(error)
  let message: string
  let responseText: string | undefined
  let contentType: string | undefined

  if (error.response) {
    contentType = error.response.headers?.['content-type'] || error.response.headers?.['Content-Type']
    
    // Handle HTML error responses
    if (isHtmlResponse(error.response)) {
      responseText = typeof error.response.data === 'string' ? error.response.data : ''
      const htmlMessage = responseText ? extractHtmlErrorMessage(responseText) : 'Invalid response received'
      message = htmlMessage || getUserFriendlyMessage(error, errorType)
      
      // Log HTML response error with detailed information
      if (responseText) {
        ErrorLogger.logHtmlResponseError(responseText, error.config?.url || 'unknown', htmlMessage)
      }
      
      const appError = new AppError(
        message,
        'parse',
        error.response.status,
        undefined,
        error,
        responseText,
        contentType
      )
      
      ErrorLogger.logAppError(appError, 'HTML Response Error')
      return appError
    }
    
    // Handle JSON API error responses
    if (error.response.data && typeof error.response.data === 'object') {
      const apiError: ApiError = {
        message: error.response.data.message || getUserFriendlyMessage(error, errorType),
        errors: error.response.data.errors,
        status: error.response.status,
      }
      
      const appError = new AppError(
        apiError.message,
        errorType,
        apiError.status,
        apiError.errors,
        error,
        undefined,
        contentType
      )
      
      ErrorLogger.logAppError(appError, 'JSON API Error')
      return appError
    }
    
    // Handle other response types
    responseText = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)
    message = getUserFriendlyMessage(error, errorType)
    
    const appError = new AppError(
      message,
      errorType,
      error.response.status,
      undefined,
      error,
      responseText,
      contentType
    )
    
    ErrorLogger.logAppError(appError, 'Other Response Error')
    return appError
  }

  // Handle network errors and other cases
  message = getUserFriendlyMessage(error, errorType)
  
  const appError = new AppError(
    message,
    errorType,
    undefined,
    undefined,
    error
  )
  
  ErrorLogger.logAppError(appError, 'Network/Unknown Error')
  return appError
}

export const showErrorToast = (error: AppError | string) => {
  const message = typeof error === 'string' ? error : error.message
  const errorType = typeof error === 'string' ? 'string' : error.type
  
  // Log that an error toast is being shown to the user
  ErrorLogger.logErrorToastShown(message, errorType, 'Error Toast')
  
  toast.error(message)
}

export const showSuccessToast = (message: string) => {
  toast.success(message)
}

/**
 * Enhanced error logger for comprehensive error tracking and monitoring
 */
class ErrorLogger {
  private static formatLogEntry(level: string, message: string, context?: any) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: 'frontend-error-handler',
      message,
      ...context
    }
  }

  static logAppError(error: AppError, context?: string) {
    const logData = {
      context: context || 'Unknown',
      errorMessage: error.message,
      errorType: error.type,
      status: error.status,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      ...(error.responseText && { 
        responseText: this.truncateText(error.responseText, 1000),
        responseLength: error.responseText.length
      }),
      ...(error.contentType && { contentType: error.contentType }),
      ...(error.errors && { validationErrors: error.errors }),
      ...(error.originalError && { 
        originalError: {
          name: error.originalError.name,
          message: error.originalError.message,
          stack: error.originalError.stack,
          config: error.originalError.config ? {
            method: error.originalError.config.method,
            url: error.originalError.config.url,
            timeout: error.originalError.config.timeout
          } : undefined
        }
      })
    }

    const logEntry = this.formatLogEntry('error', `App Error: ${error.message}`, logData)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR_HANDLER]', logEntry)
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }
  }

  static logUserAction(action: string, details?: any) {
    const logData = {
      action,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      url: window.location.href,
      timestamp: new Date().toISOString(),
      ...details
    }

    const logEntry = this.formatLogEntry('info', `User Action: ${action}`, logData)

    if (process.env.NODE_ENV === 'development') {
      console.info('[ERROR_HANDLER]', logEntry)
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }
  }

  static logErrorToastShown(message: string, errorType?: string, context?: string) {
    const logData = {
      toastMessage: message,
      errorType,
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      url: window.location.href
    }

    const logEntry = this.formatLogEntry('warn', `Error toast shown: ${message}`, logData)

    if (process.env.NODE_ENV === 'development') {
      console.warn('[ERROR_HANDLER]', logEntry)
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }
  }

  static logHtmlResponseError(htmlContent: string, endpoint: string, extractedMessage: string) {
    const logData = {
      endpoint,
      extractedMessage,
      htmlPreview: this.truncateText(htmlContent, 500),
      htmlLength: htmlContent.length,
      isHtmlResponse: true,
      errorType: 'html_response_error'
    }

    const logEntry = this.formatLogEntry('error', `HTML response received instead of JSON for ${endpoint}`, logData)

    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR_HANDLER]', logEntry)
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry)
    }
  }

  private static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength) + '... [truncated]'
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

/**
 * Logs error details for debugging and monitoring
 * @deprecated Use ErrorLogger.logAppError instead
 */
export const logError = (error: AppError, context?: string) => {
  ErrorLogger.logAppError(error, context)
}

export const getFieldError = (errors: Record<string, string[]> | undefined, field: string): string | undefined => {
  if (!errors || !errors[field]) return undefined
  return errors[field][0] // Return first error for the field
}

export const formatValidationErrors = (errors: Record<string, string[]>): string => {
  const errorMessages = Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ')
  
  return errorMessages
}

// Error boundary fallback component props
export interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested information is not available.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'The server is experiencing issues. Please try again in a few moments.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  MFA_REQUIRED: 'Multi-factor authentication is required.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  MINIMUM_WITHDRAWAL: 'Amount is below the minimum withdrawal threshold.',
  PARSE_ERROR: 'Received an unexpected response from the server.',
  TIMEOUT: 'The request took too long to complete. Please try again.',
} as const