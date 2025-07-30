import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { commissionService } from '../../services/commissionService'
import { Commission, PaymentMethod, PayoutRequest, CommissionFilters } from '../../types/api'

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

interface CommissionState {
  commissions: Commission[]
  payoutRequests: PayoutRequest[]
  paymentMethods: PaymentMethod[]
  analytics: CommissionAnalytics | null
  availableBalance: number
  pendingBalance: number
  isLoading: boolean
  error: string | null
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
}

const initialState: CommissionState = {
  commissions: [],
  payoutRequests: [],
  paymentMethods: [],
  analytics: null,
  availableBalance: 0,
  pendingBalance: 0,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  },
  filters: {},
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
      return rejectWithValue(error.message || 'Failed to fetch commissions')
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
      return rejectWithValue(error.message || 'Failed to fetch commission summary')
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
      return rejectWithValue(error.message || 'Failed to fetch payment methods')
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
      return rejectWithValue(error.message || 'Failed to add payment method')
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
      return rejectWithValue(error.message || 'Failed to update payment method')
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
      return rejectWithValue(error.message || 'Failed to delete payment method')
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
      return rejectWithValue(error.message || 'Failed to fetch payout requests')
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
      return rejectWithValue(error.message || 'Failed to create payout request')
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
      return rejectWithValue(error.message || 'Failed to fetch balance')
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
      return rejectWithValue(error.message || 'Failed to fetch commission analytics')
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch commissions
      .addCase(fetchCommissions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCommissions.fulfilled, (state, action) => {
        state.isLoading = false
        state.commissions = action.payload.commissions
        state.pagination = action.payload.pagination
      })
      .addCase(fetchCommissions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch commission summary
      .addCase(fetchCommissionSummary.fulfilled, (state, action) => {
        state.availableBalance = action.payload.availableBalance
        state.pendingBalance = action.payload.pendingCommissions
      })
      .addCase(fetchCommissionSummary.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch payment methods
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
        state.paymentMethods = action.payload
      })
      .addCase(fetchPaymentMethods.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Add payment method
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods.push(action.payload)
      })
      .addCase(addPaymentMethod.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Update payment method
      .addCase(updatePaymentMethod.fulfilled, (state, action) => {
        const index = state.paymentMethods.findIndex(method => method.id === action.payload.id)
        if (index !== -1) {
          state.paymentMethods[index] = action.payload
        }
      })
      .addCase(updatePaymentMethod.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Delete payment method
      .addCase(deletePaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload)
      })
      .addCase(deletePaymentMethod.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch payout requests
      .addCase(fetchPayoutRequests.fulfilled, (state, action) => {
        state.payoutRequests = action.payload
      })
      .addCase(fetchPayoutRequests.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Create payout request
      .addCase(createPayoutRequest.fulfilled, (state, action) => {
        state.payoutRequests.unshift(action.payload)
      })
      .addCase(createPayoutRequest.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch balance
      .addCase(fetchBalance.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.isLoading = false
        console.log('Balance fetched:', action.payload) // Debug log
        state.availableBalance = action.payload.availableBalance || 0
        state.pendingBalance = action.payload.pendingBalance || 0
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        console.error('Balance fetch failed:', action.payload) // Debug log
      })
      // Fetch commission analytics
      .addCase(fetchCommissionAnalytics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCommissionAnalytics.fulfilled, (state, action) => {
        state.isLoading = false
        state.analytics = action.payload
      })
      .addCase(fetchCommissionAnalytics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, setFilters, clearFilters, setCurrentPage } = commissionSlice.actions
export default commissionSlice.reducer