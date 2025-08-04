import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { commissionService } from '../../services/commissionService'
import { Commission, PaymentMethod, PayoutRequest, CommissionFilters } from '../../types/api'
import { AppError, ErrorType } from '../../utils/errorHandler'

// Import ErrorLogger for comprehensive logging
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

export interface CommissionAnalytics {
  totalCommissions: number
  monthlyTrend: Array<{
    month: string
    amount: number
    count: number
  }>
  statusBreakdown: {
    pending: number
    approved: number
    paid: number
    clawed_back: number
  }
  topProducts: Array<{
    productId: string
    productName: string
    totalCommissions: number
    count: number
  }>
  conversionMetrics: {
    averageCommissionAmount: number
    conversionRate: number
    totalCustomers: number
  }
}

interface CommissionError {
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

interface CommissionState {
  commissions: Commission[]
  payoutRequests: PayoutRequest[]
  paymentMethods: PaymentMethod[]
  analytics: CommissionAnalytics | null
  availableBalance: number
  pendingBalance: number
  isLoading: boolean
  isRetrying: boolean
  error: CommissionError | null
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
  filters: {
    status?: string
    dateFrom?: string
    dateTo?: string
    productId?: string
  }
  loadingStates: {
    fetchingCommissions: boolean
    fetchingSummary: boolean
    fetchingAnalytics: boolean
    fetchingBalance: boolean
    fetchingPaymentMethods: boolean
    fetchingPayoutRequests: boolean
  }
}

const initialState: CommissionState = {
  commissions: [],
  payoutRequests: [],
  paymentMethods: [],
  analytics: null,
  availableBalance: 0,
  pendingBalance: 0,
  isLoading: false,
  isRetrying: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
  loadingStates: {
    fetchingCommissions: false,
    fetchingSummary: false,
    fetchingAnalytics: false,
    fetchingBalance: false,
    fetchingPaymentMethods: false,
    fetchingPayoutRequests: false,
  },
}

// Helper function to create error objects
const createCommissionError = (error: any, endpoint?: string): CommissionError => {
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
export const fetchCommissions = createAsyncThunk(
  'commission/fetchCommissions',
  async (params: { page?: number; filters?: CommissionFilters; marketerId?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await commissionService.getCommissions(
        params.filters,
        params.page || 1,
        20
      )
      return {
        commissions: response.items,
        pagination: {
          currentPage: response.page,
          totalPages: response.totalPages,
          totalItems: response.total,
          itemsPerPage: response.limit,
        }
      }
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/commissions'))
    }
  }
)

export const fetchCommissionSummary = createAsyncThunk(
  'commission/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const summary = await commissionService.getCommissionSummary()
      return summary
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/commissions/summary'))
    }
  }
)

export const fetchPaymentMethods = createAsyncThunk(
  'commission/fetchPaymentMethods',
  async (_, { rejectWithValue }) => {
    try {
      const { paymentMethodService } = await import('../../services/payoutService')
      const paymentMethods = await paymentMethodService.getPaymentMethods()
      return paymentMethods
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/payment-methods'))
    }
  }
)

export const addPaymentMethod = createAsyncThunk(
  'commission/addPaymentMethod',
  async (paymentMethodData: { methodType: 'bank_transfer' | 'paypal' | 'stripe' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'; accountDetails: Record<string, any>; isDefault: boolean }, { rejectWithValue }) => {
    try {
      const { paymentMethodService } = await import('../../services/payoutService')
      const paymentMethod = await paymentMethodService.addPaymentMethod(paymentMethodData)
      return paymentMethod
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/payment-methods'))
    }
  }
)

export const updatePaymentMethod = createAsyncThunk(
  'commission/updatePaymentMethod',
  async ({ id, data }: { id: string; data: Partial<{ methodType: 'bank_transfer' | 'paypal' | 'stripe' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'; accountDetails: Record<string, any>; isDefault: boolean }> }, { rejectWithValue }) => {
    try {
      const { paymentMethodService } = await import('../../services/payoutService')
      const paymentMethod = await paymentMethodService.updatePaymentMethod(id, data)
      return paymentMethod
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, `/payment-methods/${id}`))
    }
  }
)

export const deletePaymentMethod = createAsyncThunk(
  'commission/deletePaymentMethod',
  async (id: string, { rejectWithValue }) => {
    try {
      const { paymentMethodService } = await import('../../services/payoutService')
      await paymentMethodService.deletePaymentMethod(id)
      return id
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, `/payment-methods/${id}`))
    }
  }
)

export const fetchPayoutRequests = createAsyncThunk(
  'commission/fetchPayoutRequests',
  async (_, { rejectWithValue }) => {
    try {
      const { payoutService } = await import('../../services/payoutService')
      const response = await payoutService.getPayoutRequests()
      return response.items
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/payout-requests'))
    }
  }
)

export const createPayoutRequest = createAsyncThunk(
  'commission/createPayoutRequest',
  async (request: { amount: number; paymentMethodId: string }, { rejectWithValue }) => {
    try {
      const { payoutService } = await import('../../services/payoutService')
      const payoutRequest = await payoutService.createPayoutRequest(request)
      return payoutRequest
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/payout-requests'))
    }
  }
)

export const fetchBalance = createAsyncThunk(
  'commission/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const { payoutService } = await import('../../services/payoutService')
      const balance = await payoutService.getBalance()
      return balance
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/balance'))
    }
  }
)

export const fetchCommissionAnalytics = createAsyncThunk(
  'commission/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const analytics = await commissionService.getCommissionAnalytics()
      return analytics
    } catch (error: any) {
      return rejectWithValue(createCommissionError(error, '/commissions/analytics'))
    }
  }
)

const commissionSlice = createSlice({
  name: 'commission',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload
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
      // Fetch commissions
      .addCase(fetchCommissions.pending, (state) => {
        state.loadingStates.fetchingCommissions = true
        state.isLoading = true
        // Only clear error if this is not a retry attempt
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchCommissions.fulfilled, (state, action) => {
        state.loadingStates.fetchingCommissions = false
        state.isLoading = false
        state.isRetrying = false
        state.error = null
        state.commissions = action.payload.commissions
        state.pagination = action.payload.pagination
      })
      .addCase(fetchCommissions.rejected, (state, action) => {
        state.loadingStates.fetchingCommissions = false
        state.isLoading = false
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        // Enhanced error logging for monitoring
        ReduxErrorLogger.logSliceError('commission', 'fetchCommissions', error, error.endpoint)
      })
      // Fetch commission summary
      .addCase(fetchCommissionSummary.pending, (state) => {
        state.loadingStates.fetchingSummary = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchCommissionSummary.fulfilled, (state, action) => {
        state.loadingStates.fetchingSummary = false
        state.isRetrying = false
        state.error = null
        state.availableBalance = action.payload.availableBalance
        state.pendingBalance = action.payload.pendingCommissions
      })
      .addCase(fetchCommissionSummary.rejected, (state, action) => {
        state.loadingStates.fetchingSummary = false
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'fetchCommissionSummary', error, error.endpoint)
      })
      // Fetch payment methods
      .addCase(fetchPaymentMethods.pending, (state) => {
        state.loadingStates.fetchingPaymentMethods = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.loadingStates.fetchingPaymentMethods = false
        state.isRetrying = false
        state.error = null
        state.paymentMethods = action.payload
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.loadingStates.fetchingPaymentMethods = false
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'fetchPaymentMethods', error, error.endpoint)
      })
      // Add payment method
      .addCase(addPaymentMethod.pending, (state) => {
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.isRetrying = false
        state.error = null
        state.paymentMethods.push(action.payload)
      })
      .addCase(addPaymentMethod.rejected, (state, action) => {
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'addPaymentMethod', error, error.endpoint)
      })
      // Update payment method
      .addCase(updatePaymentMethod.pending, (state) => {
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        state.isRetrying = false
        state.error = null
        const index = state.paymentMethods.findIndex(method => method.id === action.payload.id)
        if (index !== -1) {
          state.paymentMethods[index] = action.payload
        }
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'updatePaymentMethod', error, error.endpoint)
      })
      // Delete payment method
      .addCase(deletePaymentMethod.pending, (state) => {
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.isRetrying = false
        state.error = null
        state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload)
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'deletePaymentMethod', error, error.endpoint)
      })
      // Fetch payout requests
      .addCase(fetchPayoutRequests.pending, (state) => {
        state.loadingStates.fetchingPayoutRequests = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchPayoutRequests.fulfilled, (state, action) => {
        state.loadingStates.fetchingPayoutRequests = false
        state.isRetrying = false
        state.error = null
        state.payoutRequests = action.payload
      })
      .addCase(fetchPayoutRequests.rejected, (state, action) => {
        state.loadingStates.fetchingPayoutRequests = false
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'fetchPayoutRequests', error, error.endpoint)
      })
      // Create payout request
      .addCase(createPayoutRequest.pending, (state) => {
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(createPayoutRequest.fulfilled, (state, action) => {
        state.isRetrying = false
        state.error = null
        state.payoutRequests.unshift(action.payload)
      })
      .addCase(createPayoutRequest.rejected, (state, action) => {
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'createPayoutRequest', error, error.endpoint)
      })
      // Fetch balance
      .addCase(fetchBalance.pending, (state) => {
        state.loadingStates.fetchingBalance = true
        state.isLoading = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loadingStates.fetchingBalance = false
        state.isLoading = false
        state.isRetrying = false
        state.error = null
        state.availableBalance = action.payload.availableBalance || 0
        state.pendingBalance = action.payload.pendingBalance || 0
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loadingStates.fetchingBalance = false
        state.isLoading = false
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'fetchBalance', error, error.endpoint)
      })
      // Fetch commission analytics
      .addCase(fetchCommissionAnalytics.pending, (state) => {
        state.loadingStates.fetchingAnalytics = true
        state.isLoading = true
        if (!state.isRetrying) {
          state.error = null
        }
      })
      .addCase(fetchCommissionAnalytics.fulfilled, (state, action) => {
        state.loadingStates.fetchingAnalytics = false
        state.isLoading = false
        state.isRetrying = false
        state.error = null
        state.analytics = action.payload
      })
      .addCase(fetchCommissionAnalytics.rejected, (state, action) => {
        state.loadingStates.fetchingAnalytics = false
        state.isLoading = false
        state.isRetrying = false
        const error = action.payload as CommissionError
        state.error = error
        ReduxErrorLogger.logSliceError('commission', 'fetchCommissionAnalytics', error, error.endpoint)
      })
  },
})

export const { clearError, setFilters, clearFilters, setCurrentPage, setRetrying, incrementRetryCount } = commissionSlice.actions
export default commissionSlice.reducer