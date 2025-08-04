import { AxiosResponse } from 'axios'

/**
 * Response validation utility for handling different response types
 * and extracting meaningful error messages from HTML error pages
 */

export interface ValidationResult {
  isValid: boolean
  contentType: string
  errorMessage?: string
}

export interface HtmlErrorInfo {
  title?: string
  heading?: string
  errorCode?: string
  message?: string
}

export class ResponseValidator {
  /**
   * Validates if the response has the expected JSON content-type
   */
  static validateContentType(response: AxiosResponse): boolean {
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
    return contentType.toLowerCase().includes('application/json')
  }

  /**
   * Checks if the response is a valid JSON response
   */
  static isJsonResponse(response: AxiosResponse): boolean {
    try {
      // First check content-type header
      if (!this.validateContentType(response)) {
        return false
      }
      
      // If response.data is already parsed by axios and is an object (including null), it's valid JSON
      if (typeof response.data === 'object') {
        return true
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof response.data === 'string') {
        JSON.parse(response.data)
        return true
      }
      
      return false
    } catch {
      return false
    }
  }

  /**
   * Detects if the response is an HTML error page
   */
  static isHtmlErrorPage(response: AxiosResponse): boolean {
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
    const isHtmlContentType = contentType.toLowerCase().includes('text/html')
    
    if (!isHtmlContentType) {
      return false
    }

    // Check if response data contains HTML doctype or html tags
    const responseText = typeof response.data === 'string' ? response.data : String(response.data)
    const htmlPatterns = [
      /<!doctype\s+html/i,
      /<html[^>]*>/i,
      /<head[^>]*>/i,
      /<body[^>]*>/i
    ]

    return htmlPatterns.some(pattern => pattern.test(responseText))
  }

  /**
   * Extracts error information from HTML error pages
   */
  static extractHtmlErrorInfo(response: AxiosResponse): HtmlErrorInfo {
    const responseText = typeof response.data === 'string' ? response.data : String(response.data)
    const errorInfo: HtmlErrorInfo = {}

    // Extract title
    const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      errorInfo.title = titleMatch[1].trim()
    }

    // Extract main heading (h1)
    const h1Match = responseText.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match && h1Match[1]) {
      errorInfo.heading = h1Match[1].trim()
    }

    // Extract error code from common patterns
    const errorCodePatterns = [
      /error\s*:?\s*(\d{3})/i,
      /status\s*:?\s*(\d{3})/i,
      /(\d{3})\s*error/i,
      /http\s*(\d{3})/i
    ]

    for (const pattern of errorCodePatterns) {
      const match = responseText.match(pattern)
      if (match && match[1]) {
        errorInfo.errorCode = match[1]
        break
      }
    }

    // Extract error message from common HTML error page structures
    const messagePatterns = [
      /<p[^>]*class="[^"]*error[^"]*"[^>]*>([^<]+)<\/p>/i,
      /<div[^>]*class="[^"]*message[^"]*"[^>]*>([^<]+)<\/div>/i,
      /<p[^>]*>([^<]*(?:error|failed|not found|unavailable)[^<]*)<\/p>/i,
      /<div[^>]*>([^<]*(?:error|failed|not found|unavailable)[^<]*)<\/div>/i
    ]

    for (const pattern of messagePatterns) {
      const match = responseText.match(pattern)
      if (match && match[1]) {
        errorInfo.message = match[1].trim()
        break
      }
    }

    return errorInfo
  }

  /**
   * Extracts a user-friendly error message from various response types
   */
  static extractErrorMessage(response: AxiosResponse): string {
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
    const status = response.status

    // Handle HTML error pages
    if (this.isHtmlErrorPage(response)) {
      const htmlErrorInfo = this.extractHtmlErrorInfo(response)
      
      // Prioritize extracted message, then heading, then title
      if (htmlErrorInfo.message) {
        return htmlErrorInfo.message
      }
      
      if (htmlErrorInfo.heading && !htmlErrorInfo.heading.toLowerCase().includes('error')) {
        return htmlErrorInfo.heading
      }
      
      if (htmlErrorInfo.title && !htmlErrorInfo.title.toLowerCase().includes('error')) {
        return htmlErrorInfo.title
      }

      // Fallback to status-based messages for HTML responses
      return this.getStatusBasedMessage(status)
    }

    // Handle JSON responses with error messages
    if (this.isJsonResponse(response)) {
      try {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
        if (data && typeof data === 'object') {
          // Try common error message fields
          const messageFields = ['message', 'error', 'detail', 'description']
          for (const field of messageFields) {
            if (data[field] && typeof data[field] === 'string') {
              return data[field]
            }
          }
        }
      } catch {
        // JSON parsing failed, fall through to status-based message
      }
    }

    // Handle plain text responses
    if (contentType.includes('text/plain')) {
      const responseText = typeof response.data === 'string' ? response.data : String(response.data)
      if (responseText && responseText.length < 200) { // Reasonable length for error message
        return responseText.trim()
      }
    }

    // Fallback to status-based message
    return this.getStatusBasedMessage(status)
  }

  /**
   * Gets a user-friendly error message based on HTTP status code
   */
  static getStatusBasedMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input and try again.'
      case 401:
        return 'Your session has expired. Please log in again.'
      case 403:
        return 'You do not have permission to access this resource.'
      case 404:
        return 'The requested information is not available.'
      case 408:
        return 'The request took too long to complete. Please try again.'
      case 409:
        return 'There was a conflict with your request. Please try again.'
      case 422:
        return 'Please check your input and try again.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'The server is experiencing issues. Please try again in a few moments.'
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.'
      case 503:
        return 'Service temporarily unavailable. Please try again later.'
      case 504:
        return 'Gateway timeout. The server took too long to respond.'
      default:
        if (status >= 500) {
          return 'The server is experiencing issues. Please try again in a few moments.'
        } else if (status >= 400) {
          return 'There was a problem with your request. Please try again.'
        } else {
          return 'An unexpected error occurred. Please try again.'
        }
    }
  }

  /**
   * Validates response and returns comprehensive validation result
   */
  static validateResponse(response: AxiosResponse): ValidationResult {
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
    
    if (this.isJsonResponse(response)) {
      return {
        isValid: true,
        contentType
      }
    }

    return {
      isValid: false,
      contentType,
      errorMessage: this.extractErrorMessage(response)
    }
  }

  /**
   * Checks if an error should be retried based on response characteristics
   */
  static shouldRetryError(response?: AxiosResponse): boolean {
    if (!response) {
      // Network errors should be retried
      return true
    }

    const status = response.status

    // Retry server errors (5xx) and specific client errors
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(status)
  }

  /**
   * Determines if the response indicates a temporary vs permanent error
   */
  static isTemporaryError(response?: AxiosResponse): boolean {
    if (!response) {
      // Network errors are typically temporary
      return true
    }

    const status = response.status
    const temporaryStatuses = [408, 429, 500, 502, 503, 504]
    
    return temporaryStatuses.includes(status)
  }
}

// Export commonly used validation functions for convenience
export const validateContentType = ResponseValidator.validateContentType
export const isJsonResponse = ResponseValidator.isJsonResponse
export const isHtmlErrorPage = ResponseValidator.isHtmlErrorPage
export const extractErrorMessage = ResponseValidator.extractErrorMessage
export const validateResponse = ResponseValidator.validateResponse
export const shouldRetryError = ResponseValidator.shouldRetryError
export const isTemporaryError = ResponseValidator.isTemporaryError