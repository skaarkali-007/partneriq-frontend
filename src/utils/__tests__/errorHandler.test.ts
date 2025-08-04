import { vi } from 'vitest'
import {
  AppError,
  handleApiError,
  isHtmlResponse,
  extractHtmlErrorMessage,
  classifyError,
  getUserFriendlyMessage,
  ERROR_MESSAGES,
  formatValidationErrors,
  getFieldError,
  logError
} from '../errorHandler'

describe('errorHandler', () => {
  describe('AppError', () => {
    it('should create an AppError with all properties', () => {
      const error = new AppError(
        'Test error',
        'network',
        500,
        { field: ['error message'] },
        new Error('original'),
        '<html>Error</html>',
        'text/html'
      )

      expect(error.message).toBe('Test error')
      expect(error.type).toBe('network')
      expect(error.status).toBe(500)
      expect(error.errors).toEqual({ field: ['error message'] })
      expect(error.originalError).toBeInstanceOf(Error)
      expect(error.responseText).toBe('<html>Error</html>')
      expect(error.contentType).toBe('text/html')
      expect(error.name).toBe('AppError')
    })

    it('should create an AppError with minimal properties', () => {
      const error = new AppError('Simple error')

      expect(error.message).toBe('Simple error')
      expect(error.type).toBe('unknown')
      expect(error.status).toBeUndefined()
      expect(error.errors).toBeUndefined()
      expect(error.originalError).toBeUndefined()
      expect(error.responseText).toBeUndefined()
      expect(error.contentType).toBeUndefined()
    })
  })

  describe('isHtmlResponse', () => {
    it('should detect HTML response by content-type header', () => {
      const response = {
        headers: { 'content-type': 'text/html; charset=utf-8' },
        data: 'some content'
      }

      expect(isHtmlResponse(response)).toBe(true)
    })

    it('should detect HTML response by Content-Type header (capitalized)', () => {
      const response = {
        headers: { 'Content-Type': 'text/html' },
        data: 'some content'
      }

      expect(isHtmlResponse(response)).toBe(true)
    })

    it('should detect HTML response by DOCTYPE in content', () => {
      const response = {
        headers: {},
        data: '<!DOCTYPE html><html><head><title>Error</title></head></html>'
      }

      expect(isHtmlResponse(response)).toBe(true)
    })

    it('should detect HTML response by doctype (lowercase) in content', () => {
      const response = {
        headers: {},
        data: '<!doctype html><html><head><title>Error</title></head></html>'
      }

      expect(isHtmlResponse(response)).toBe(true)
    })

    it('should detect HTML response by html tag in content', () => {
      const response = {
        headers: {},
        data: '<html><head><title>Error</title></head></html>'
      }

      expect(isHtmlResponse(response)).toBe(true)
    })

    it('should return false for JSON response', () => {
      const response = {
        headers: { 'content-type': 'application/json' },
        data: '{"message": "error"}'
      }

      expect(isHtmlResponse(response)).toBe(false)
    })

    it('should return false for null/undefined response', () => {
      expect(isHtmlResponse(null)).toBe(false)
      expect(isHtmlResponse(undefined)).toBe(false)
    })
  })

  describe('extractHtmlErrorMessage', () => {
    it('should extract message from title tag', () => {
      const html = '<html><head><title>404 Not Found</title></head><body><h1>Page Not Found</h1></body></html>'
      
      expect(extractHtmlErrorMessage(html)).toBe('404 Not Found')
    })

    it('should extract message from h1 tag when title contains "error"', () => {
      const html = '<html><head><title>Error Page</title></head><body><h1>Service Unavailable</h1></body></html>'
      
      expect(extractHtmlErrorMessage(html)).toBe('Service Unavailable')
    })

    it('should extract message from h1 tag when no title', () => {
      const html = '<html><body><h1>Internal Server Error</h1></body></html>'
      
      expect(extractHtmlErrorMessage(html)).toBe('Internal Server Error')
    })

    it('should return default message when no title or h1', () => {
      const html = '<html><body><p>Some error occurred</p></body></html>'
      
      expect(extractHtmlErrorMessage(html)).toBe('The server returned an error page instead of the expected data')
    })

    it('should handle empty or invalid HTML', () => {
      expect(extractHtmlErrorMessage('')).toBe('The server returned an error page instead of the expected data')
      expect(extractHtmlErrorMessage('not html')).toBe('The server returned an error page instead of the expected data')
    })
  })

  describe('classifyError', () => {
    it('should classify network errors', () => {
      const error = {
        request: {},
        message: 'Network Error'
      }

      expect(classifyError(error)).toBe('network')
    })

    it('should classify timeout errors', () => {
      const error = {
        request: {},
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      }

      expect(classifyError(error)).toBe('timeout')
    })

    it('should classify timeout errors by message', () => {
      const error = {
        request: {},
        message: 'Request timeout'
      }

      expect(classifyError(error)).toBe('timeout')
    })

    it('should classify 401 as auth error', () => {
      const error = {
        response: { status: 401 }
      }

      expect(classifyError(error)).toBe('auth')
    })

    it('should classify 403 as auth error', () => {
      const error = {
        response: { status: 403 }
      }

      expect(classifyError(error)).toBe('auth')
    })

    it('should classify 4xx as client error', () => {
      const error = {
        response: { status: 400 }
      }

      expect(classifyError(error)).toBe('client')
    })

    it('should classify 5xx as server error', () => {
      const error = {
        response: { status: 500 }
      }

      expect(classifyError(error)).toBe('server')
    })

    it('should classify JSON parsing errors', () => {
      const error = {
        name: 'SyntaxError',
        message: 'Unexpected token < in JSON at position 0'
      }

      expect(classifyError(error)).toBe('parse')
    })

    it('should classify validation errors', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: { email: ['is required'] }
          }
        }
      }

      expect(classifyError(error)).toBe('validation')
    })

    it('should classify unknown errors', () => {
      const error = {
        message: 'Something went wrong'
      }

      expect(classifyError(error)).toBe('unknown')
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('should return network error message', () => {
      const error = { request: {} }
      
      expect(getUserFriendlyMessage(error, 'network')).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('should return timeout error message', () => {
      const error = { code: 'ECONNABORTED' }
      
      expect(getUserFriendlyMessage(error, 'timeout')).toBe(ERROR_MESSAGES.TIMEOUT)
    })

    it('should return server error message for 500', () => {
      const error = { response: { status: 500 } }
      
      expect(getUserFriendlyMessage(error, 'server')).toBe(ERROR_MESSAGES.SERVER_ERROR)
    })

    it('should return service unavailable message for 502/503/504', () => {
      const error502 = { response: { status: 502 } }
      const error503 = { response: { status: 503 } }
      const error504 = { response: { status: 504 } }
      
      const expectedMessage = 'The service is temporarily unavailable. Please try again in a few moments.'
      
      expect(getUserFriendlyMessage(error502, 'server')).toBe(expectedMessage)
      expect(getUserFriendlyMessage(error503, 'server')).toBe(expectedMessage)
      expect(getUserFriendlyMessage(error504, 'server')).toBe(expectedMessage)
    })

    it('should return not found message for 404', () => {
      const error = { response: { status: 404 } }
      
      expect(getUserFriendlyMessage(error, 'client')).toBe(ERROR_MESSAGES.NOT_FOUND)
    })

    it('should return validation error message for 400', () => {
      const error = { response: { status: 400 } }
      
      expect(getUserFriendlyMessage(error, 'client')).toBe(ERROR_MESSAGES.VALIDATION_ERROR)
    })

    it('should return session expired message for 401', () => {
      const error = { response: { status: 401 } }
      
      expect(getUserFriendlyMessage(error, 'auth')).toBe(ERROR_MESSAGES.SESSION_EXPIRED)
    })

    it('should return forbidden message for 403', () => {
      const error = { response: { status: 403 } }
      
      expect(getUserFriendlyMessage(error, 'auth')).toBe(ERROR_MESSAGES.FORBIDDEN)
    })

    it('should return parse error message', () => {
      const error = { name: 'SyntaxError' }
      
      expect(getUserFriendlyMessage(error, 'parse')).toBe(ERROR_MESSAGES.PARSE_ERROR)
    })

    it('should return validation error message', () => {
      const error = { response: { data: { errors: {} } } }
      
      expect(getUserFriendlyMessage(error, 'validation')).toBe(ERROR_MESSAGES.VALIDATION_ERROR)
    })

    it('should return original message for unknown errors', () => {
      const error = { message: 'Custom error message' }
      
      expect(getUserFriendlyMessage(error, 'unknown')).toBe('Custom error message')
    })

    it('should return default message when no original message', () => {
      const error = {}
      
      expect(getUserFriendlyMessage(error, 'unknown')).toBe('An unexpected error occurred')
    })
  })

  describe('handleApiError', () => {
    it('should return existing AppError unchanged', () => {
      const existingError = new AppError('Existing error', 'network')
      
      const result = handleApiError(existingError)
      
      expect(result).toBe(existingError)
    })

    it('should handle HTML error responses', () => {
      const error = {
        response: {
          status: 404,
          headers: { 'content-type': 'text/html' },
          data: '<html><head><title>404 Not Found</title></head></html>'
        }
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('parse')
      expect(result.status).toBe(404)
      expect(result.message).toBe('404 Not Found')
      expect(result.responseText).toBe('<html><head><title>404 Not Found</title></head></html>')
      expect(result.contentType).toBe('text/html')
    })

    it('should handle JSON API error responses', () => {
      const error = {
        response: {
          status: 422,
          headers: { 'content-type': 'application/json' },
          data: {
            message: 'Validation failed',
            errors: { email: ['is required'] }
          }
        }
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('validation')
      expect(result.status).toBe(422)
      expect(result.message).toBe('Validation failed')
      expect(result.errors).toEqual({ email: ['is required'] })
    })

    it('should handle server errors with JSON response', () => {
      const error = {
        response: {
          status: 500,
          headers: { 'content-type': 'application/json' },
          data: {
            message: 'Internal server error'
          }
        }
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('server')
      expect(result.status).toBe(500)
      expect(result.message).toBe('Internal server error')
    })

    it('should handle responses without JSON data', () => {
      const error = {
        response: {
          status: 500,
          headers: { 'content-type': 'text/plain' },
          data: 'Internal Server Error'
        }
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('server')
      expect(result.status).toBe(500)
      expect(result.message).toBe(ERROR_MESSAGES.SERVER_ERROR)
      expect(result.responseText).toBe('Internal Server Error')
    })

    it('should handle network errors', () => {
      const error = {
        request: {},
        message: 'Network Error'
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('network')
      expect(result.status).toBeUndefined()
      expect(result.message).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('should handle timeout errors', () => {
      const error = {
        request: {},
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('timeout')
      expect(result.message).toBe(ERROR_MESSAGES.TIMEOUT)
    })

    it('should handle unknown errors', () => {
      const error = {
        message: 'Something unexpected happened'
      }

      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.type).toBe('unknown')
      expect(result.message).toBe('Something unexpected happened')
    })
  })

  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const errors = {
        email: ['is required', 'must be valid'],
        password: ['is too short']
      }

      const result = formatValidationErrors(errors)

      expect(result).toBe('email: is required, must be valid; password: is too short')
    })

    it('should handle empty errors object', () => {
      const result = formatValidationErrors({})

      expect(result).toBe('')
    })
  })

  describe('getFieldError', () => {
    it('should return first error for a field', () => {
      const errors = {
        email: ['is required', 'must be valid'],
        password: ['is too short']
      }

      expect(getFieldError(errors, 'email')).toBe('is required')
      expect(getFieldError(errors, 'password')).toBe('is too short')
    })

    it('should return undefined for non-existent field', () => {
      const errors = {
        email: ['is required']
      }

      expect(getFieldError(errors, 'password')).toBeUndefined()
    })

    it('should return undefined for undefined errors', () => {
      expect(getFieldError(undefined, 'email')).toBeUndefined()
    })
  })

  describe('logError', () => {
    let consoleSpy: any
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should log error details in development', () => {
      process.env.NODE_ENV = 'development'
      
      const error = new AppError(
        'Test error',
        'network',
        500,
        { field: ['error'] },
        new Error('original'),
        '<html>Error</html>',
        'text/html'
      )

      logError(error, 'test-context')

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR_HANDLER]', expect.objectContaining({
        errorMessage: 'Test error',
        errorType: 'network',
        status: 500,
        context: 'test-context',
        responseText: expect.any(String),
        contentType: 'text/html',
        validationErrors: { field: ['error'] },
        originalError: expect.objectContaining({
          name: 'Error',
          message: 'original'
        }),
        timestamp: expect.any(String),
        level: 'ERROR',
        service: 'frontend-error-handler'
      }))
    })

    it('should not log to console in production', () => {
      process.env.NODE_ENV = 'production'
      
      const error = new AppError('Test error', 'network')
      logError(error)

      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('should use default context when none provided', () => {
      process.env.NODE_ENV = 'development'
      
      const error = new AppError('Test error', 'network')
      logError(error)

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR_HANDLER]', expect.objectContaining({
        context: 'Unknown',
        errorMessage: 'Test error',
        errorType: 'network',
        level: 'ERROR',
        service: 'frontend-error-handler'
      }))
    })

    it('should handle minimal error data', () => {
      process.env.NODE_ENV = 'development'
      
      const error = new AppError('Simple error')
      logError(error, 'minimal-test')

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR_HANDLER]', expect.objectContaining({
        errorMessage: 'Simple error',
        errorType: 'unknown',
        status: undefined,
        context: 'minimal-test',
        timestamp: expect.any(String),
        level: 'ERROR',
        service: 'frontend-error-handler'
      }))
    })
  })
})