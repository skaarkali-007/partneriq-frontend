// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    MFA_SETUP: '/auth/mfa/setup',
    MFA_VERIFY: '/auth/mfa/verify-setup',
    MFA_DISABLE: '/auth/mfa/disable',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAILS: '/products/:id',
    MATERIALS: '/products/:id/materials',
  },
  TRACKING: {
    LINKS: '/tracking/links',
    CLICKS: '/tracking/clicks',
    CONVERSIONS: '/tracking/conversions',
    STATS: '/tracking/stats/:marketerId',
  },
  COMMISSIONS: {
    LIST: '/commissions',
    SUMMARY: '/commissions/summary/:marketerId',
    CALCULATE: '/commissions/calculate',
    CLAWBACK: '/commissions/clawback',
  },
  PAYOUTS: {
    LIST: '/payouts',
    REQUEST: '/payouts/request',
    BALANCE: '/payouts/balance/:marketerId',
    APPROVE: '/payouts/:id/approve',
    PROCESS: '/payouts/:id/process',
  },
  PAYMENT_METHODS: {
    LIST: '/payment-methods',
    CREATE: '/payment-methods',
    UPDATE: '/payment-methods/:id',
    DELETE: '/payment-methods/:id',
  },
  ANALYTICS: {
    PERFORMANCE: '/analytics/performance',
    DASHBOARD: '/analytics/dashboard',
    REPORTS: '/analytics/reports',
  },
} as const

// Application routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  REFERRALS: '/referrals',
  COMMISSIONS: '/commissions',
  PAYOUTS: '/payouts',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    PRODUCTS: '/admin/products',
    COMMISSIONS: '/admin/commissions',
    PAYOUTS: '/admin/payouts',
    REPORTS: '/admin/reports',
    ACTIVITY: '/admin/activity',
  },
  CUSTOMER: {
    ONBOARDING: '/onboarding',
    LANDING: '/landing/:trackingCode',
  },
} as const

// User roles and permissions
export const USER_ROLES = {
  MARKETER: 'marketer',
  ADMIN: 'admin',
} as const

export const USER_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
} as const

export const KYC_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

// Commission statuses
export const COMMISSION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CLAWED_BACK: 'clawed_back',
} as const

// Payout statuses
export const PAYOUT_STATUSES = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

// Payment method types
export const PAYMENT_METHOD_TYPES = {
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
} as const

// Product statuses
export const PRODUCT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

// Commission types
export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FLAT: 'flat',
} as const

// Material types
export const MATERIAL_TYPES = {
  BANNER: 'banner',
  EMAIL_TEMPLATE: 'email_template',
  FACT_SHEET: 'fact_sheet',
  IMAGE: 'image',
} as const

// KYC document types
export const KYC_DOCUMENT_TYPES = {
  ID_FRONT: 'id_front',
  ID_BACK: 'id_back',
  PROOF_OF_ADDRESS: 'proof_of_address',
  SELFIE: 'selfie',
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'image/jpeg', 'image/png'],
  },
} as const

// Validation rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  WITHDRAWAL: {
    MIN_AMOUNT: 50,
    MAX_AMOUNT: 10000,
  },
} as const

// Time constants
export const TIME = {
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000, // 14 minutes
  SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  COOKIE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  CLEARANCE_PERIOD: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#6366F1',
  SECONDARY: '#6B7280',
} as const

// Status colors mapping
export const STATUS_COLORS = {
  // User statuses
  user_pending: 'yellow',
  user_active: 'green',
  user_suspended: 'red',
  user_revoked: 'gray',
  // Commission statuses
  commission_pending: 'yellow',
  commission_approved: 'blue',
  commission_paid: 'green',
  commission_clawed_back: 'red',
  // Payout statuses
  payout_requested: 'yellow',
  payout_approved: 'blue',
  payout_processing: 'blue',
  payout_completed: 'green',
  payout_failed: 'red',
  // KYC statuses
  kyc_pending: 'yellow',
  kyc_approved: 'green',
  kyc_rejected: 'red',
} as const

// Feature flags
export const FEATURES = {
  MFA_ENABLED: import.meta.env.VITE_ENABLE_MFA === 'true',
  ANALYTICS_ENABLED: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

// Error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
} as const