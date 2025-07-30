// Currency formatting
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Handle edge cases
  if (typeof amount !== 'number' || isNaN(amount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0)
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

// Number formatting with commas
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Date formatting
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj)
}

// Date and time formatting
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Relative time formatting (e.g., "2 hours ago")
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Status badge formatting
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    // User statuses
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    revoked: 'bg-gray-100 text-gray-800',
    
    // Commission statuses
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    clawed_back: 'bg-red-100 text-red-800',
    
    // Payout statuses
    requested: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    
    // KYC statuses
    rejected: 'bg-red-100 text-red-800',
    
    // Product statuses
    inactive: 'bg-gray-100 text-gray-800',
  }
  
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone // Return original if format not recognized
}

// Generate initials from name
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Format commission rate
export const formatCommissionRate = (rate: number, type: 'percentage' | 'flat'): string => {
  if (type === 'percentage') {
    return formatPercentage(rate)
  }
  return formatCurrency(rate)
}

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Format percentage change with sign
export const formatPercentageChange = (change: number): string => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

// Get change color class
export const getChangeColor = (change: number): string => {
  if (change > 0) return 'text-green-600'
  if (change < 0) return 'text-red-600'
  return 'text-gray-600'
}