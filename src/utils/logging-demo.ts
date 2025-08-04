/**
 * Demonstration script for comprehensive error logging
 * This file shows examples of the enhanced logging functionality
 */

import { handleApiError, showErrorToast } from './errorHandler'
import { AppError } from './errorHandler'

// Example 1: Network Error Logging
export function demonstrateNetworkErrorLogging() {
  console.log('=== Network Error Logging Demo ===')
  
  const networkError = {
    message: 'Network Error',
    code: 'ECONNABORTED',
    request: {}
  }
  
  const appError = handleApiError(networkError)
  showErrorToast(appError)
  
  console.log('Network error logged with comprehensive details including:')
  console.log('- Error type classification')
  console.log('- User session information')
  console.log('- Timestamp and context')
  console.log('- User-facing message logging')
}

// Example 2: HTML Response Error Logging
export function demonstrateHtmlResponseErrorLogging() {
  console.log('\n=== HTML Response Error Logging Demo ===')
  
  const htmlError = {
    response: {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'content-type': 'text/html' },
      data: `<!DOCTYPE html>
<html>
<head><title>Server Error</title></head>
<body>
  <h1>Internal Server Error</h1>
  <p>The server encountered an unexpected condition.</p>
</body>
</html>`
    },
    config: {
      method: 'GET',
      url: '/api/v1/commissions'
    },
    message: 'Request failed with status code 500'
  }
  
  const appError = handleApiError(htmlError)
  showErrorToast(appError)
  
  console.log('HTML response error logged with:')
  console.log('- Raw HTML content for debugging')
  console.log('- Extracted error message from HTML')
  console.log('- Content-type detection')
  console.log('- Response size and truncation')
}

// Example 3: JSON Parsing Error Logging
export function demonstrateJsonParsingErrorLogging() {
  console.log('\n=== JSON Parsing Error Logging Demo ===')
  
  const parseError = {
    name: 'SyntaxError',
    message: 'Unexpected token \'<\', "<!doctype "... is not valid JSON',
    response: {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: '<!doctype html><html><body>Unexpected HTML response</body></html>'
    },
    config: {
      url: '/api/v1/referrals'
    }
  }
  
  const appError = handleApiError(parseError)
  showErrorToast(appError)
  
  console.log('JSON parsing error logged with:')
  console.log('- Raw response content that caused parsing failure')
  console.log('- Content-type mismatch detection')
  console.log('- Specific error classification')
}

// Example 4: Retry Attempt Logging
export function demonstrateRetryLogging() {
  console.log('\n=== Retry Attempt Logging Demo ===')
  
  // This would be called by the ApiService during retry attempts
  console.log('Retry attempts are logged with:')
  console.log('- Attempt number and maximum retries')
  console.log('- Delay calculation and next retry time')
  console.log('- Error type and retryability assessment')
  console.log('- Endpoint and request method')
  console.log('- Exponential backoff timing')
}

// Example 5: User Context Logging
export function demonstrateUserContextLogging() {
  console.log('\n=== User Context Logging Demo ===')
  
  // Mock user session
  const mockToken = btoa(JSON.stringify({
    userId: 'user_12345',
    email: 'user@example.com',
    exp: Date.now() / 1000 + 3600
  }))
  
  localStorage.setItem('token', mockToken)
  
  const contextError = new AppError(
    'Error with user context',
    'server',
    500,
    { field: ['validation error'] }
  )
  
  handleApiError(contextError)
  
  console.log('User context logging includes:')
  console.log('- User ID from JWT token')
  console.log('- Session ID for tracking')
  console.log('- Current URL and user agent')
  console.log('- Validation errors if present')
  
  localStorage.removeItem('token')
}

// Example 6: Production Logging Preparation
export function demonstrateProductionLogging() {
  console.log('\n=== Production Logging Demo ===')
  
  console.log('In production, logs are prepared for external services with:')
  console.log('- Structured JSON format')
  console.log('- Service identification')
  console.log('- Log level classification')
  console.log('- Sanitized sensitive data')
  console.log('- Truncated large responses')
  console.log('- Ready for DataDog, LogRocket, or similar services')
}

// Run all demonstrations
export function runAllLoggingDemos() {
  console.log('🚀 Comprehensive Error Logging Demonstration')
  console.log('============================================')
  
  demonstrateNetworkErrorLogging()
  demonstrateHtmlResponseErrorLogging()
  demonstrateJsonParsingErrorLogging()
  demonstrateRetryLogging()
  demonstrateUserContextLogging()
  demonstrateProductionLogging()
  
  console.log('\n✅ All logging demonstrations completed!')
  console.log('Check the browser console to see the actual log entries.')
}

// Export for use in development
if (process.env.NODE_ENV === 'development') {
  // Make available on window for manual testing
  (window as any).loggingDemo = {
    runAll: runAllLoggingDemos,
    network: demonstrateNetworkErrorLogging,
    html: demonstrateHtmlResponseErrorLogging,
    json: demonstrateJsonParsingErrorLogging,
    retry: demonstrateRetryLogging,
    context: demonstrateUserContextLogging,
    production: demonstrateProductionLogging
  }
}