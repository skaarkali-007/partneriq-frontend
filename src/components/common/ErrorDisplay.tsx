import React from 'react'
import { ErrorType } from '../../utils/errorHandler'

interface ErrorDisplayProps {
  error: {
    message: string
    type: ErrorType
    status?: number
    retryable: boolean
    retryCount?: number
    lastRetryAt?: string
    endpoint?: string
  } | null
  isRetrying?: boolean
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

const getErrorIcon = (type: ErrorType) => {
  switch (type) {
    case 'network':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    case 'server':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'parse':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'timeout':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'auth':
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    default:
      return (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
  }
}

const getErrorTypeLabel = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'Connection Error'
    case 'server':
      return 'Server Error'
    case 'parse':
      return 'Data Error'
    case 'timeout':
      return 'Timeout Error'
    case 'auth':
      return 'Authentication Error'
    case 'client':
      return 'Request Error'
    case 'validation':
      return 'Validation Error'
    default:
      return 'Error'
  }
}

const getErrorColor = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'text-orange-400'
    case 'server':
      return 'text-red-400'
    case 'parse':
      return 'text-purple-400'
    case 'timeout':
      return 'text-yellow-400'
    case 'auth':
      return 'text-blue-400'
    default:
      return 'text-red-400'
  }
}

const getBorderColor = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'border-orange-200'
    case 'server':
      return 'border-red-200'
    case 'parse':
      return 'border-purple-200'
    case 'timeout':
      return 'border-yellow-200'
    case 'auth':
      return 'border-blue-200'
    default:
      return 'border-red-200'
  }
}

const getBackgroundColor = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return 'bg-orange-50'
    case 'server':
      return 'bg-red-50'
    case 'parse':
      return 'bg-purple-50'
    case 'timeout':
      return 'bg-yellow-50'
    case 'auth':
      return 'bg-blue-50'
    default:
      return 'bg-red-50'
  }
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  isRetrying = false,
  onRetry,
  onDismiss,
  className = ''
}) => {
  if (!error) return null

  const errorColor = getErrorColor(error.type)
  const borderColor = getBorderColor(error.type)
  const backgroundColor = getBackgroundColor(error.type)

  return (
    <div className={`rounded-md border p-4 ${backgroundColor} ${borderColor} ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${errorColor}`}>
          {getErrorIcon(error.type)}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium ${errorColor.replace('400', '800')}`}>
              {getErrorTypeLabel(error.type)}
              {error.status && ` (${error.status})`}
            </h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`ml-2 inline-flex rounded-md p-1.5 ${errorColor.replace('400', '400')} hover:${backgroundColor.replace('50', '100')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${backgroundColor.replace('bg-', '').replace('-50', '-50')} focus:ring-${errorColor.replace('text-', '').replace('-400', '-500')}`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className={`mt-2 text-sm ${errorColor.replace('400', '700')}`}>
            <p>{error.message}</p>
            
            {/* Additional error details */}
            {error.endpoint && (
              <p className="mt-1 text-xs opacity-75">
                Endpoint: {error.endpoint}
              </p>
            )}
            
            {/* Retry information */}
            {error.retryCount && error.retryCount > 0 && (
              <p className="mt-1 text-xs opacity-75">
                Retry attempts: {error.retryCount}
                {error.lastRetryAt && (
                  <span className="ml-2">
                    Last attempt: {new Date(error.lastRetryAt).toLocaleTimeString()}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex space-x-3">
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className={`inline-flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium text-white shadow-sm ${
                  isRetrying 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : `bg-${errorColor.replace('text-', '').replace('-400', '-600')} hover:bg-${errorColor.replace('text-', '').replace('-400', '-700')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${errorColor.replace('text-', '').replace('-400', '-500')}`
                }`}
              >
                {isRetrying ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </>
                )}
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`inline-flex items-center rounded-md border ${borderColor} bg-white px-3 py-2 text-sm font-medium ${errorColor.replace('400', '700')} shadow-sm hover:${backgroundColor.replace('50', '100')} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${errorColor.replace('text-', '').replace('-400', '-500')}`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}