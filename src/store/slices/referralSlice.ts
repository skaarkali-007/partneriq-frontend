import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { referralService } from '../../services/referralService'
import { ReferralLink, CustomerReferral, ReferralStats, ReferralFilters } from '../../types/api'

interface ReferralState {
  referralLinks: ReferralLink[]
  customerReferrals: CustomerReferral[]
  stats: ReferralStats | null
  filters: ReferralFilters
  isLoading: boolean
  isCreatingLink: boolean
  error: string | null
  lastUpdated: string | null
  realTimeEnabled: boolean
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
  error: null,
  lastUpdated: null,
  realTimeEnabled: true,
}

// Async thunks
export const fetchReferralLinks = createAsyncThunk(
  'referral/fetchLinks',
  async (marketerId: string, { rejectWithValue }) => {
    try {
      const links = await referralService.getReferralLinks(marketerId)
      return links
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch referral links')
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
        return rejectWithValue('User not authenticated')
      }
      
      const link = await referralService.createReferralLink({ 
        marketerId, 
        productId 
      })
      return link
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create referral link')
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
      return rejectWithValue(error.message || 'Failed to fetch customer referrals')
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
      return rejectWithValue(error.message || 'Failed to fetch referral stats')
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
  },
  extraReducers: (builder) => {
    builder
      // Fetch referral links
      .addCase(fetchReferralLinks.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchReferralLinks.fulfilled, (state, action) => {
        state.isLoading = false
        state.referralLinks = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchReferralLinks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Create referral link
      .addCase(createReferralLink.pending, (state) => {
        state.isCreatingLink = true
        state.error = null
      })
      .addCase(createReferralLink.fulfilled, (state, action) => {
        state.isCreatingLink = false
        state.referralLinks.unshift(action.payload)
      })
      .addCase(createReferralLink.rejected, (state, action) => {
        state.isCreatingLink = false
        state.error = action.payload as string
      })
      // Fetch customer referrals
      .addCase(fetchCustomerReferrals.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCustomerReferrals.fulfilled, (state, action) => {
        state.isLoading = false
        state.customerReferrals = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchCustomerReferrals.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch referral stats
      .addCase(fetchReferralStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
      .addCase(fetchReferralStats.rejected, (state, action) => {
        state.error = action.payload as string
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
} = referralSlice.actions

export default referralSlice.reducer