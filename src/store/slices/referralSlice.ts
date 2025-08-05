import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { referralService } from '../../services/referralService'
import { ReferralLink, CustomerReferral, ReferralStats, ReferralFilters } from '../../types/api'
import { AppError, ErrorType } from '../../utils/errorHandler'

// Enhanced error logger for comprehensive logging
class ReduxErrorLogger {
  static logSliceError(sliceName: string, actionType: string, error: any, endpoint?: string) {
    const logData = {
      sliceName,
      actionType,
      endpoint,
      errorType: error.type || 'unknown',
      status: error.status,
      message: error.message,
      retryable: error.retryable,
      retryCount: error.retryCount,
      lastRetryAt: error.lastRetryAt,
      contentType: error.contentType,
      responseText: error.responseText ? error.responseText.substring(0, 500) + '...' : undefined,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    }

    console.error(`[REDUX_${sliceName.toUpperCase()}] ${actionType} failed:`, logData)

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService({
        level: 'ERROR',
        service: `redux-${sliceName}`,
        ...logData
      })
    }
  }

  static logRetryAttempt(sliceName: string, actionType: string, retryCount: number, error: any) {
    const logData = {
      sliceName,
      actionType,
      retryCount,
      errorType: error.type,
      status: error.status,
      message: error.message,
      timestamp: new Date().toISOString()
    }

    console.warn(`[REDUX_${sliceName.toUpperCase()}] Retry attempt ${retryCount} for ${actionType}:`, logData)

    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService({
        level: 'WARN',
        service: `redux-${sliceName}`,
        ...logData
      })
    }
  }

  private static getCurrentUserId(): string | undefined {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.userId || payload.sub
      }
    } catch {
      // Ignore errors
    }
    return undefined
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  private static sendToLoggingService(_logEntry: any): void {
    try {
      // Send to external logging service in production
      // fetch('/api/v1/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(() => {})
    } catch {
      // Ignore logging errors
    }
  }
}

interface ReferralError {
  message: string
  type: ErrorType
  status?: number
  retryable: boolean
  retryCount?: number
  lastRetryAt?: string
  responseText?: string
  contentType?: string
  endpoint?: string
}

interface ReferralState {
  referralLinks: ReferralLink[]
  customerReferrals: CustomerReferral[]
  stats: ReferralStats | null
  filters: ReferralFilters
  isLoading: boolean
  isCreatingLink: boolean
  isRetrying: boolean
  error: ReferralError | null
  lastUpdated: string | null
  realTimeEnabled: boolean
  loadingStates: {
    fetchingLinks: boolean
    fetchingReferrals: boolean
    fetchingStats: boolean
    creatingLink: boolean
  }
}

const initialState: ReferralState = {
  referralLinks: [],
  customerReferrals: [],
  stats: null,
  filters: {
    status: 'all',
    product: 'all',
    dateRange: '30',
    search: '',
    commissionStatus: 'all',
    source: 'all',
  },
  isLoading: false,
  isCreatingLink: false,
  isRetrying: false,
  error: null,
  lastUpdated: null,
  realTimeEnabled: true,
  loadingStates: {
    fetchingLinks: false,
    fetchingReferrals: false,
    fetchingStats: false,
    creatingLink: false,
  },
}

// Helper function to create error objects
const createReferralError = (error: any, endpoint?: string): ReferralError => {
  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.type,
      status: error.status,
      retryable: ['network', 'server', 'timeout', 'parse'].includes(error.type),
      responseText: error.responseText,
      contentType: error.contentType,
      endpoint,
    }
  }
  
  // Handle API service errors (from enhanced ApiService)
  if (error.type && error.message) {
    return {
      message: error.message,
      type: error.type,
      status: error.status,
      retryable: ['network', 'server', 'timeout', 'parse'].includes(error.type),
      endpoint,
    }
  }
  
  return {
    message: error.message || 'An unexpected error occurred',
    type: 'unknown',
    retryable: false,
    endpoint,
  }
}

// Async thunks
export const fetchReferralLinks = createAsyncThunk(
  'referral/fetchLinks',
  async (marketerId: string, { rejectWithValue }) => {
    try {
      const links = await referralService.getReferralLinks(marketerId)
      return links
    } catch (error: any) {
      return rejectWithValue(createReferralError(error, '/referral-links'))
    }
  }
)

export const createReferralLink = createAsyncThunk(
  'referral/createLink',
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any
      const marketerId = state.auth.user?.id
      
      if (!marketerId) {
        return rejectWithValue(createReferralError(new Error('User not authenticated'), '/referral-links'))
      }
      
      const link = await referralService.createReferralLink({ 
        marketerId, 
        productId 
      })
      return link
    } catch (error: any) {
      return rejectWithValue(createReferralError(error, '/referral-links'))
    }
  }
)

export const fetchCustomerReferrals = createAsyncThunk(
  'referral/fetchReferrals',
  async ({ marketerId, filters }: { marketerId: string; filters: ReferralFilters }, { rejectWithValue }) => {
    try {
      const referrals = await referralService.getCustomerReferrals(marketerId, filters)
      return referrals
    } catch (error: any) {
      return rejectWithValue(createReferralError(error, `/marketer/${marketerId}/customers`))
    }
  }
)

export const fetchReferralStats = createAsyncThunk(
  'referral/fetchStats',
  async (marketerId: string, { rejectWithValue }) => {
    try {
      const stats = await referralService.getReferralStats(marketerId)
      return stats
    } catch (error: any) {
      return rejectWithValue(createReferralError(error, '/referral-stats'))
    }
  }
)

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ReferralFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    toggleRealTime: (state) => {
      state.realTimeEnabled = !state.realTimeEnabled
    },
    updateReferralLink: (state, action: PayloadAction<Partial<ReferralLink> & { id: string }>) => {
      const index = state.referralLinks.findIndex(link => link.id === action.payload.id)
      if (index !== -1) {
        state.referralLinks[index] = { ...state.referralLinks[index], ...action.payload }
      }
    },
    updateCustomerReferral: (state, action: PayloadAction<Partial<CustomerReferral> & { id: string }>) => {
      const index = state.customerReferrals.findIndex(referral => referral.id === action.payload.id)
      if (index !== -1) {
        state.customerReferrals[index] = { ...state.customerReferrals[index], ...action.payload }
      }
    },
    addNewReferral: (state, action: PayloadAction<CustomerReferral>) => {
      state.customerReferrals.unshift(action.payload)
    },
    updateLinkStats: (state, action: PayloadAction<{ linkId: string; clicks: number; conversions: number }>) => {
      const link = state.referralLinks.find(l => l.id === action.payload.linkId)
      if (link) {
        link.clickCount = action.payload.clicks
        link.conversionCount = action.payload.conversions
        link.updatedAt = new Date().toISOString()
      }
    },
    setRetrying: (state, action: PayloadAction<boolean>) => {
      state.isRetrying = action.payload
    },
    incrementRetryCount: (state) => {
      if (state.error) {
        state.error.retryCount = (state.error.retryCount || 0) + 1
        state.error.lastRetryAt = new Date().toISOString()
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch referral links
      .addCase(fetchReferralLinks.pending, (state) => {
        state.loadingStates.fetchingLinks = true
        state.isLoading = true
        // Only clear error if this is not a retry attempt
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchReferralLinks.fulfilled, (state, action) => {
        state.loadingStates.fetchingLinks = false
        state.isLoading = false
        state.isRetrying = false
        state.error = null
        state.referralLinks = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchReferralLinks.rejected, (state, action) => {
        state.loadingStates.fetchingLinks = false
        state.isLoading = false
        state.isRetrying = false
        const error = action.payload as ReferralError
        state.error = error
        // Enhanced error logging for monitoring
        ReduxErrorLogger.logSliceError('referral', 'fetchReferralLinks', error, error.endpoint)
      })
      // Create referral link
      .addCase(createReferralLink.pending, (state) => {
        state.loadingStates.creatingLink = true
        state.isCreatingLink = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(createReferralLink.fulfilled, (state, action) => {
        state.loadingStates.creatingLink = false
        state.isCreatingLink = false
        state.isRetrying = false
        state.error = null
        state.referralLinks.unshift(action.payload)
      })
      .addCase(createReferralLink.rejected, (state, action) => {
        state.loadingStates.creatingLink = false
        state.isCreatingLink = false
        state.isRetrying = false
        const error = action.payload as ReferralError
        state.error = error
        ReduxErrorLogger.logSliceError('referral', 'createReferralLink', error, error.endpoint)
      })
      // Fetch customer referrals
      .addCase(fetchCustomerReferrals.pending, (state) => {
        state.loadingStates.fetchingReferrals = true
        state.isLoading = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchCustomerReferrals.fulfilled, (state, action) => {
        state.loadingStates.fetchingReferrals = false
        state.isLoading = false
        state.isRetrying = false
        state.error = null
        state.customerReferrals = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchCustomerReferrals.rejected, (state, action) => {
        state.loadingStates.fetchingReferrals = false
        state.isLoading = false
        state.isRetrying = false
        const error = action.payload as ReferralError
        state.error = error
        ReduxErrorLogger.logSliceError('referral', 'fetchCustomerReferrals', error, error.endpoint)
      })
      // Fetch referral stats
      .addCase(fetchReferralStats.pending, (state) => {
        state.loadingStates.fetchingStats = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchReferralStats.fulfilled, (state, action) => {
        state.loadingStates.fetchingStats = false
        state.isRetrying = false
        state.error = null
        state.stats = action.payload
      })
      .addCase(fetchReferralStats.rejected, (state, action) => {
        state.loadingStates.fetchingStats = false
        state.isRetrying = false
        const error = action.payload as ReferralError
        state.error = error
        ReduxErrorLogger.logSliceError('referral', 'fetchReferralStats', error, error.endpoint)
      })
  },
})

export const {
  setFilters,
  clearError,
  toggleRealTime,
  updateReferralLink,
  updateCustomerReferral,
  addNewReferral,
  updateLinkStats,
  setRetrying,
  incrementRetryCount,
} = referralSlice.actions

export default referralSlice.reducer