import { AxiosResponse } from 'axios'
import { 
  ResponseValidator,
  validateContentType,
  isJsonResponse,
  isHtmlErrorPage,
  extractErrorMessage,
  validateResponse,
  shouldRetryError,
  isTemporaryError
} from '../responseValidator'

// Helper function to create mock AxiosResponse
const createMockResponse = (
  data: any,
  status: number = 200,
  contentType: string = 'application/json',
  headers: Record<string, string> = {}
): AxiosResponse => ({
  data,
  status,
  statusText: 'OK',
  headers: {
    'content-type': contentType,
    ...headers
  },
  config: {} as any,
  request: {} as any
})

describe('ResponseValidator', () => {
  describe('validateContentType', () => {
    it('should return true for application/json content-type', () => {
      const response = createMockResponse({}, 200, 'application/json')
      expect(ResponseValidator.validateContentType(response)).toBe(true)
    })

    it('should return true for application/json with charset', () => {
      const response = createMockResponse({}, 200, 'application/json; charset=utf-8')
      expect(ResponseValidator.validateContentType(response)).toBe(true)
    })

    it('should return false for text/html content-type', () => {
      const response = createMockResponse({}, 200, 'text/html')
      expect(ResponseValidator.validateContentType(response)).toBe(false)
    })

    it('should return false for text/plain content-type', () => {
      const response = createMockResponse({}, 200, 'text/plain')
      expect(ResponseValidator.validateContentType(response)).toBe(false)
    })

    it('should handle case-insensitive content-type headers', () => {
      const response = createMockResponse({}, 200, '', { 'Content-Type': 'APPLICATION/JSON' })
      expect(ResponseValidator.validateContentType(response)).toBe(true)
    })

    it('should return false when content-type header is missing', () => {
      const response = createMockResponse({}, 200, '')
      expect(ResponseValidator.validateContentType(response)).toBe(false)
    })
  })

  describe('isJsonResponse', () => {
    it('should return true for valid JSON object response', () => {
      const response = createMockResponse({ success: true, data: {} }, 200, 'application/json')
      expect(ResponseValidator.isJsonResponse(response)).toBe(true)
    })

    it('should return true for valid JSON string response', () => {
      const response = createMockResponse('{"success": true}', 200, 'application/json')
      expect(ResponseValidator.isJsonResponse(response)).toBe(true)
    })

    it('should return false for invalid JSON string', () => {
      const response = createMockResponse('invalid json', 200, 'application/json')
      expect(ResponseValidator.isJsonResponse(response)).toBe(false)
    })

    it('should return false for HTML response', () => {
      const response = createMockResponse('<html><body>Error</body></html>', 500, 'text/html')
      expect(ResponseValidator.isJsonResponse(response)).toBe(false)
    })

    it('should return false when content-type is not JSON', () => {
      const response = createMockResponse({ data: 'test' }, 200, 'text/plain')
      expect(ResponseValidator.isJsonResponse(response)).toBe(false)
    })

    it('should handle null response data', () => {
      const response = createMockResponse(null, 200, 'application/json')
      expect(ResponseValidator.isJsonResponse(response)).toBe(true)
    })
  })

  describe('isHtmlErrorPage', () => {
    it('should return true for HTML response with doctype', () => {
      const htmlContent = '<!DOCTYPE html><html><head><title>Error</title></head><body><h1>500 Error</h1></body></html>'
      const response = createMockResponse(htmlContent, 500, 'text/html')
      expect(ResponseValidator.isHtmlErrorPage(response)).toBe(true)
    })

    it('should return true for HTML response with html tag', () => {
      const htmlContent = '<html><body><h1>Not Found</h1></body></html>'
      const response = createMockResponse(htmlContent, 404, 'text/html')
      expect(ResponseValidator.isHtmlErrorPage(response)).toBe(true)
    })

    it('should return false for JSON response', () => {
      const response = createMockResponse({ error: 'Not found' }, 404, 'application/json')
      expect(ResponseValidator.isHtmlErrorPage(response)).toBe(false)
    })

    it('should return false for plain text response', () => {
      const response = createMockResponse('Error occurred', 500, 'text/plain')
      expect(ResponseValidator.isHtmlErrorPage(response)).toBe(false)
    })

    it('should handle case-insensitive HTML detection', () => {
      const htmlContent = '<!DOCTYPE HTML><HTML><BODY>Error</BODY></HTML>'
      const response = createMockResponse(htmlContent, 500, 'text/html')
      expect(ResponseValidator.isHtmlErrorPage(response)).toBe(true)
    })
  })

  describe('extractHtmlErrorInfo', () => {
    it('should extract title from HTML error page', () => {
      const htmlContent = '<html><head><title>404 Not Found</title></head><body></body></html>'
      const response = createMockResponse(htmlContent, 404, 'text/html')
      const errorInfo = ResponseValidator.extractHtmlErrorInfo(response)
      expect(errorInfo.title).toBe('404 Not Found')
    })

    it('should extract heading from HTML error page', () => {
      const htmlContent = '<html><body><h1>Internal Server Error</h1></body></html>'
      const response = createMockResponse(htmlContent, 500, 'text/html')
      const errorInfo = ResponseValidator.extractHtmlErrorInfo(response)
      expect(errorInfo.heading).toBe('Internal Server Error')
    })

    it('should extract error code from various patterns', () => {
      const testCases = [
        { html: '<p>Error: 500</p>', expectedCode: '500' },
        { html: '<div>Status: 404</div>', expectedCode: '404' },
        { html: '<span>403 Error</span>', expectedCode: '403' },
        { html: '<p>HTTP 502</p>', expectedCode: '502' }
      ]

      testCases.forEach(({ html, expectedCode }) => {
        const response = createMockResponse(html, 500, 'text/html')
        const errorInfo = ResponseValidator.extractHtmlErrorInfo(response)
        expect(errorInfo.errorCode).toBe(expectedCode)
      })
    })

    it('should extract error message from HTML content', () => {
      const htmlContent = '<html><body><p class="error-message">Database connection failed</p></body></html>'
      const response = createMockResponse(htmlContent, 500, 'text/html')
      const errorInfo = ResponseValidator.extractHtmlErrorInfo(response)
      expect(errorInfo.message).toBe('Database connection failed')
    })

    it('should handle HTML with multiple potential error messages', () => {
      const htmlContent = `
        <html>
          <body>
            <h1>Server Error</h1>
            <p>The server encountered an error</p>
            <p class="error-message">Specific error details</p>
          </body>
        </html>
      `
      const response = createMockResponse(htmlContent, 500, 'text/html')
      const errorInfo = ResponseValidator.extractHtmlErrorInfo(response)
      expect(errorInfo.heading).toBe('Server Error')
      expect(errorInfo.message).toBe('Specific error details')
    })
  })

  describe('extractErrorMessage', () => {
    it('should extract message from HTML error page', () => {
      const htmlContent = '<html><head><title>Service Unavailable</title></head><body><h1>503 Service Unavailable</h1></body></html>'
      const response = createMockResponse(htmlContent, 503, 'text/html')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('503 Service Unavailable')
    })

    it('should extract message from JSON error response', () => {
      const jsonData = { message: 'Validation failed', errors: { email: ['Invalid email'] } }
      const response = createMockResponse(jsonData, 400, 'application/json')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('Validation failed')
    })

    it('should extract message from JSON string response', () => {
      const jsonString = '{"error": "User not found"}'
      const response = createMockResponse(jsonString, 404, 'application/json')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('User not found')
    })

    it('should handle plain text error responses', () => {
      const response = createMockResponse('Connection timeout', 408, 'text/plain')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('Connection timeout')
    })

    it('should fallback to status-based message for unknown response types', () => {
      const response = createMockResponse('some binary data', 500, 'application/octet-stream')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('The server is experiencing issues. Please try again in a few moments.')
    })

    it('should prioritize HTML message over title', () => {
      const htmlContent = `
        <html>
          <head><title>Generic Error Page</title></head>
          <body>
            <h1>Database Connection Failed</h1>
            <p class="error-message">Unable to connect to database server</p>
          </body>
        </html>
      `
      const response = createMockResponse(htmlContent, 500, 'text/html')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('Unable to connect to database server')
    })
  })

  describe('getStatusBasedMessage', () => {
    it('should return appropriate messages for different status codes', () => {
      const testCases = [
        { status: 400, expected: 'Bad request. Please check your input and try again.' },
        { status: 401, expected: 'Your session has expired. Please log in again.' },
        { status: 403, expected: 'You do not have permission to access this resource.' },
        { status: 404, expected: 'The requested information is not available.' },
        { status: 408, expected: 'The request took too long to complete. Please try again.' },
        { status: 429, expected: 'Too many requests. Please wait a moment and try again.' },
        { status: 500, expected: 'The server is experiencing issues. Please try again in a few moments.' },
        { status: 502, expected: 'Bad gateway. The server is temporarily unavailable.' },
        { status: 503, expected: 'Service temporarily unavailable. Please try again later.' },
        { status: 504, expected: 'Gateway timeout. The server took too long to respond.' }
      ]

      testCases.forEach(({ status, expected }) => {
        expect(ResponseValidator.getStatusBasedMessage(status)).toBe(expected)
      })
    })

    it('should handle unknown 4xx status codes', () => {
      const message = ResponseValidator.getStatusBasedMessage(418) // I'm a teapot
      expect(message).toBe('There was a problem with your request. Please try again.')
    })

    it('should handle unknown 5xx status codes', () => {
      const message = ResponseValidator.getStatusBasedMessage(599)
      expect(message).toBe('The server is experiencing issues. Please try again in a few moments.')
    })

    it('should handle unknown status codes', () => {
      const message = ResponseValidator.getStatusBasedMessage(999)
      expect(message).toBe('The server is experiencing issues. Please try again in a few moments.')
    })

    it('should handle truly unknown status codes outside common ranges', () => {
      const message = ResponseValidator.getStatusBasedMessage(200) // 2xx success code
      expect(message).toBe('An unexpected error occurred. Please try again.')
    })
  })

  describe('validateResponse', () => {
    it('should return valid result for JSON response', () => {
      const response = createMockResponse({ data: 'test' }, 200, 'application/json')
      const result = ResponseValidator.validateResponse(response)
      expect(result.isValid).toBe(true)
      expect(result.contentType).toBe('application/json')
      expect(result.errorMessage).toBeUndefined()
    })

    it('should return invalid result for HTML response with error message', () => {
      const htmlContent = '<html><body><h1>Not Found</h1></body></html>'
      const response = createMockResponse(htmlContent, 404, 'text/html')
      const result = ResponseValidator.validateResponse(response)
      expect(result.isValid).toBe(false)
      expect(result.contentType).toBe('text/html')
      expect(result.errorMessage).toBe('Not Found')
    })
  })

  describe('shouldRetryError', () => {
    it('should return true for network errors (no response)', () => {
      expect(ResponseValidator.shouldRetryError()).toBe(true)
    })

    it('should return true for retryable status codes', () => {
      const retryableStatuses = [408, 429, 500, 502, 503, 504]
      retryableStatuses.forEach(status => {
        const response = createMockResponse({}, status)
        expect(ResponseValidator.shouldRetryError(response)).toBe(true)
      })
    })

    it('should return false for non-retryable status codes', () => {
      const nonRetryableStatuses = [400, 401, 403, 404, 422]
      nonRetryableStatuses.forEach(status => {
        const response = createMockResponse({}, status)
        expect(ResponseValidator.shouldRetryError(response)).toBe(false)
      })
    })
  })

  describe('isTemporaryError', () => {
    it('should return true for network errors (no response)', () => {
      expect(ResponseValidator.isTemporaryError()).toBe(true)
    })

    it('should return true for temporary status codes', () => {
      const temporaryStatuses = [408, 429, 500, 502, 503, 504]
      temporaryStatuses.forEach(status => {
        const response = createMockResponse({}, status)
        expect(ResponseValidator.isTemporaryError(response)).toBe(true)
      })
    })

    it('should return false for permanent error status codes', () => {
      const permanentStatuses = [400, 401, 403, 404, 422]
      permanentStatuses.forEach(status => {
        const response = createMockResponse({}, status)
        expect(ResponseValidator.isTemporaryError(response)).toBe(false)
      })
    })
  })

  // Test exported convenience functions
  describe('exported convenience functions', () => {
    it('should export validateContentType function', () => {
      const response = createMockResponse({}, 200, 'application/json')
      expect(validateContentType(response)).toBe(true)
    })

    it('should export isJsonResponse function', () => {
      const response = createMockResponse({ data: 'test' }, 200, 'application/json')
      expect(isJsonResponse(response)).toBe(true)
    })

    it('should export isHtmlErrorPage function', () => {
      const htmlContent = '<html><body>Error</body></html>'
      const response = createMockResponse(htmlContent, 500, 'text/html')
      expect(isHtmlErrorPage(response)).toBe(true)
    })

    it('should export extractErrorMessage function', () => {
      const response = createMockResponse({ message: 'Test error' }, 400, 'application/json')
      expect(extractErrorMessage(response)).toBe('Test error')
    })

    it('should export validateResponse function', () => {
      const response = createMockResponse({}, 200, 'application/json')
      const result = validateResponse(response)
      expect(result.isValid).toBe(true)
    })

    it('should export shouldRetryError function', () => {
      const response = createMockResponse({}, 500)
      expect(shouldRetryError(response)).toBe(true)
    })

    it('should export isTemporaryError function', () => {
      const response = createMockResponse({}, 503)
      expect(isTemporaryError(response)).toBe(true)
    })
  })

  // Edge cases and error handling
  describe('edge cases', () => {
    it('should handle response with no headers', () => {
      const response = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        request: {} as any
      }
      expect(ResponseValidator.validateContentType(response)).toBe(false)
    })

    it('should handle response with undefined data', () => {
      const response = createMockResponse(undefined, 200, 'application/json')
      expect(ResponseValidator.isJsonResponse(response)).toBe(false)
    })

    it('should handle malformed HTML', () => {
      const malformedHtml = '<html><body><h1>Error</h1><p>Missing closing tags'
      const response = createMockResponse(malformedHtml, 500, 'text/html')
      const errorInfo = ResponseValidator.extractHtmlErrorInfo(response)
      expect(errorInfo.heading).toBe('Error')
    })

    it('should handle very long plain text responses', () => {
      const longText = 'A'.repeat(300) // Very long text
      const response = createMockResponse(longText, 500, 'text/plain')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('The server is experiencing issues. Please try again in a few moments.')
    })

    it('should handle empty response data', () => {
      const response = createMockResponse('', 500, 'text/html')
      const message = ResponseValidator.extractErrorMessage(response)
      expect(message).toBe('The server is experiencing issues. Please try again in a few moments.')
    })
  })
})