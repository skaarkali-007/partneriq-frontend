// Common API types
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
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: any
}

// User and Authentication types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'marketer' | 'admin'
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  emailVerified: boolean
  lastLogin?: string
  mfaEnabled: boolean
  mfaSetupCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  userId: string
  phone?: string
  address?: string
  kycStatus: 'pending' | 'approved' | 'rejected'
  kycDocuments?: KycDocument[]
  quizScore?: number
  quizCompletedAt?: string
}

export interface KycDocument {
  id: string
  type: 'id_front' | 'id_back' | 'proof_of_address' | 'selfie'
  filename: string
  url: string
  status: 'pending' | 'approved' | 'rejected'
  uploadedAt: string
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  category: string
  commissionType: 'percentage' | 'flat'
  commissionRate?: number
  commissionFlatAmount?: number
  minInitialSpend: number
  status: 'active' | 'inactive'
  landingPageUrl: string
  createdAt: string
  updatedAt: string
  materials?: ProductMaterial[]
}

export interface ProductMaterial {
  id: string
  productId: string
  materialType: 'banner' | 'email_template' | 'fact_sheet' | 'image'
  title: string
  fileUrl: string
  dimensions?: string
  createdAt: string
}

// Tracking and Referral types
export interface ReferralLink {
  id: string
  marketerId: string
  productId: string
  trackingCode: string
  linkUrl: string
  isActive: boolean
  expiresAt?: string
  clickCount: number
  conversionCount: number
  createdAt: string
  updatedAt: string
  product?: Product
}

export interface ClickEvent {
  id: string
  trackingCode: string
  ipAddress: string
  userAgent: string
  referrer?: string
  timestamp: string
  sessionId: string
  customerId?: string
}

export interface ConversionEvent {
  id: string
  trackingCode: string
  customerId: string
  productId: string
  initialSpendAmount: number
  conversionTimestamp: string
  attributionMethod: 'cookie' | 'portal' | 's2s'
  commissionEligible: boolean
  product?: Product
}

// Commission types
export interface Commission {
  id: string
  marketerId: string
  customerId: string
  productId: string
  trackingCode: string
  initialSpendAmount: number
  commissionRate: number
  commissionAmount: number
  status: 'pending' | 'approved' | 'paid' | 'clawed_back'
  conversionDate: string
  approvalDate?: string
  clearancePeriodDays: number
  createdAt: string
  updatedAt: string
  product?: Product
  customer?: Customer
}

export interface CommissionAdjustment {
  id: string
  commissionId: string
  adjustmentType: 'clawback' | 'bonus' | 'correction'
  amount: number
  reason: string
  adminId: string
  createdAt: string
}

export interface CommissionSummary {
  totalEarned: number
  pendingCommissions: number
  approvedCommissions: number
  paidCommissions: number
  availableBalance: number
  thisMonthEarnings: number
  lastMonthEarnings: number
  conversionRate: number
  totalReferrals: number
  successfulReferrals: number
}

// Payout types
export interface PaymentMethod {
  id: string
  userId: string
  methodType: 'bank_transfer' | 'paypal' | 'stripe' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'
  accountDetails: Record<string, any>
  isDefault: boolean
  isVerified: boolean
  createdAt: string
}

export interface PayoutRequest {
  id: string
  marketerId: string
  paymentMethodId: string
  amount: number
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'failed'
  requestedAt: string
  approvedAt?: string
  processedAt?: string
  completedAt?: string
  failureReason?: string
  transactionId?: string
  adminId?: string
  paymentMethod?: PaymentMethod
}

// Customer types
export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  status: 'pending' | 'active' | 'suspended'
  onboardingStatus: 'started' | 'documents_uploaded' | 'under_review' | 'approved' | 'rejected'
  initialSpendAmount?: number
  createdAt: string
  updatedAt: string
}

// Analytics types
export interface AnalyticsData {
  period: string
  value: number
  change?: number
  changePercentage?: number
}

export interface PerformanceMetrics {
  totalClicks: AnalyticsData
  totalConversions: AnalyticsData
  conversionRate: AnalyticsData
  totalCommissions: AnalyticsData
  averageCommission: AnalyticsData
  topProducts: Array<{
    product: Product
    clicks: number
    conversions: number
    commissions: number
  }>
}

// Form types
export interface LoginForm {
  email: string
  password: string
  mfaCode?: string
  rememberMe?: boolean
}

export interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  agreeToTerms: boolean
}

export interface ProfileForm {
  firstName: string
  lastName: string
  phone?: string
  address?: string
}

export interface PayoutRequestForm {
  amount: number
  paymentMethodId: string
}

export interface PaymentMethodForm {
  methodType: 'bank_transfer' | 'paypal' | 'stripe' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'
  accountDetails: Record<string, any>
  isDefault: boolean
}

// Filter and search types
export interface CommissionFilters {
  status?: Commission['status']
  productId?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
}

export interface ReferralFilters {
  productId?: string
  status?: 'pending' | 'converted' | 'expired' | 'all'
  dateFrom?: string
  dateTo?: string
  product?: string
  dateRange?: string
  search?: string
  commissionStatus?: string
  source?: string
}

export interface CustomerReferral {
  id: string
  customerId: string
  customerEmail?: string
  customerName?: string
  trackingCode: string
  productId: string
  productName?: string
  status: 'pending' | 'onboarding' | 'converted' | 'rejected' | 'expired'
  referredAt: string
  convertedAt?: string
  lastActivityAt?: string
  initialSpend?: number
  commissionAmount?: number
  commissionStatus?: 'pending' | 'approved' | 'paid' | 'clawed_back'
  source?: 'cookie' | 'portal' | 'direct' | 's2s'
  customer?: Customer
  product?: Product
}

export interface ReferralStats {
  totalClicks: number
  totalConversions: number
  conversionRate: number
  totalCommissions: number
  pendingCommissions: number
  approvedCommissions: number
  paidCommissions: number
}

export interface PayoutFilters {
  status?: PayoutRequest['status']
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
}