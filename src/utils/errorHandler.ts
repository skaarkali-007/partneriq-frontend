import toast from 'react-hot-toast'
import { ApiError } from '../types/api'

export class AppError extends Error {
  public status?: number
  public errors?: Record<string, string[]>

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.errors = errors
  }
}

export const handleApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error
  }

  if (error.response) {
    // API error response
    const apiError: ApiError = {
      message: error.response.data?.message || 'An error occurred',
      errors: error.response.data?.errors,
      status: error.response.status,
    }
    return new AppError(apiError.message, apiError.status, apiError.errors)
  }

  if (error.request) {
    // Network error
    return new AppError('Network error. Please check your connection.')
  }

  // Generic error
  return new AppError(error.message || 'An unexpected error occurred')
}

export const showErrorToast = (error: AppError | string) => {
  const message = typeof error === 'string' ? error : error.message
  toast.error(message)
}

export const showSuccessToast = (message: string) => {
  toast.success(message)
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
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  MFA_REQUIRED: 'Multi-factor authentication is required.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing.',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  MINIMUM_WITHDRAWAL: 'Amount is below the minimum withdrawal threshold.',
} as const