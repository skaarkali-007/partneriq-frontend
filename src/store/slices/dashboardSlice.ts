import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

export interface CommissionSummary {
  totalEarnings: number
  pendingCommissions: number
  approvedCommissions: number
  availableBalance: number
  thisMonthEarnings: number
  conversionRate: number
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

export interface RecentActivity {
  id: string
  type: 'commission' | 'referral' | 'payout'
  description: string
  amount?: number
  timestamp: string
  status: string
}

export interface PerformanceData {
  month: string
  commissions: number
  referrals: number
}

interface DashboardState {
  commissionSummary: CommissionSummary | null
  referralStats: ReferralStats | null
  recentActivity: RecentActivity[]
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: DashboardState = {
  commissionSummary: null,
  referralStats: null,
  recentActivity: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// Async thunks for dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (marketerId: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { 
        auth: { token: string | null }
        referral: {
          customerReferrals: any[]
          referralLinks: any[]
        }
      }
      const token = state.auth.token

      if (!token) {
        return rejectWithValue('No authentication token')
      }

      // Import referral actions dynamically to avoid circular dependency
      const { fetchReferralLinks, fetchCustomerReferrals } = await import('./referralSlice')
      
      // Fetch referral data using the same actions as the referrals page
      await Promise.all([
        dispatch(fetchReferralLinks(marketerId)),
        dispatch(fetchCustomerReferrals({ marketerId, filters: {
          status: 'all',
          product: 'all', 
          dateRange: '30',
          search: '',
          commissionStatus: 'all',
          source: 'all'
        }}))
      ])

      // Get updated state after fetching referral data
      const updatedState = getState() as { 
        auth: { token: string | null }
        referral: {
          customerReferrals: any[]
          referralLinks: any[]
        }
      }

      // Fetch commission data using the commission service
      const { commissionService } = await import('../../services/commissionService')
      
      const [commissionSummaryResult, commissionsResult] = await Promise.allSettled([
        commissionService.getCommissionSummary(),
        commissionService.getCommissions({}, 1, 100) // Get recent commissions for this month calculation
      ])

      // Process commission data
      let commissionSummary: CommissionSummary = {
        totalEarnings: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        availableBalance: 0,
        thisMonthEarnings: 0,
        conversionRate: 0,
      }

      if (commissionSummaryResult.status === 'fulfilled' && commissionSummaryResult.value) {
        const data = commissionSummaryResult.value
        commissionSummary = {
          totalEarnings: data.totalEarned || 0,
          pendingCommissions: data.pendingCommissions || 0,
          approvedCommissions: data.totalEarned || 0,
          availableBalance: data.availableBalance || 0,
          thisMonthEarnings: 0, // Will calculate below
          conversionRate: 0, // Will calculate from referral data
        }
      }

      // Calculate this month's earnings from commissions
      if (commissionsResult.status === 'fulfilled' && commissionsResult.value) {
        const commissions = commissionsResult.value.items || []
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        const thisMonthCommissions = commissions.filter(commission => {
          const commissionDate = new Date(commission.conversionDate)
          return commissionDate.getMonth() === currentMonth && 
                 commissionDate.getFullYear() === currentYear
        })
        
        commissionSummary.thisMonthEarnings = thisMonthCommissions.reduce(
          (sum, commission) => sum + commission.commissionAmount, 
          0
        )
      }

      // Process referral stats - calculate from customer referrals data
      let referralStats: ReferralStats = {
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        paidCommissions: 0,
      }

      // Get referrals data from Redux state (after dispatching referral actions)
      const referrals = updatedState.referral.customerReferrals || []
      const referralLinks = updatedState.referral.referralLinks || []

      console.log('Dashboard - Customer referrals from Redux:', referrals)
      console.log('Dashboard - Referral links from Redux:', referralLinks)

      // Calculate stats from referrals data (same logic as ReferralAnalytics component)
      const totalConversions = referrals.filter((r: any) => r.status === 'converted').length
      
      // Handle referralLinks structure - ensure it's always treated as an array
      let referralLinksArray: any[] = []
      if (Array.isArray(referralLinks)) {
        referralLinksArray = referralLinks
      } else {
        // If referralLinks is not an array, treat as empty to prevent errors
        referralLinksArray = []
      }
      
      const totalClicks = referralLinksArray.reduce((sum: number, link: any) => sum + (link.clickCount || 0), 0)
      const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0

      console.log('Dashboard - Calculated stats:', {
        totalConversions,
        totalClicks,
        conversionRate,
        referralsLength: referrals.length,
        referralLinksLength: Array.isArray(referralLinks) ? referralLinks.length : 'not array',
        referralLinksType: typeof referralLinks,
        referralLinksArrayLength: referralLinksArray.length
      })

      const totalCommissions = referrals
        .filter(r => r.commissionAmount)
        .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)

      const pendingCommissions = referrals
        .filter(r => r.commissionAmount && r.commissionStatus === 'pending')
        .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)

      const approvedCommissions = referrals
        .filter(r => r.commissionAmount && r.commissionStatus === 'approved')
        .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)

      const paidCommissions = referrals
        .filter(r => r.commissionAmount && r.commissionStatus === 'paid')
        .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)

      referralStats = {
        totalClicks,
        totalConversions,
        conversionRate,
        totalCommissions,
        pendingCommissions,
        approvedCommissions,
        paidCommissions,
      }

      // Process recent activity from customer referrals
      const recentActivity: RecentActivity[] = referrals.slice(0, 5).map((referral: any) => ({
        id: referral.id,
        type: 'referral' as const,
        description: `${referral.customerName || referral.customerEmail} ${referral.status === 'converted' ? 'completed application' : 'started application'}`,
        amount: referral.initialSpend || undefined,
        timestamp: referral.referredAt,
        status: referral.status === 'converted' ? 'completed' : referral.status === 'pending' ? 'pending' : 'in_progress',
      }))

      return {
        commissionSummary,
        referralStats,
        recentActivity,
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      return rejectWithValue('Network error occurred')
    }
  }
)

export const refreshCommissionSummary = createAsyncThunk(
  'dashboard/refreshCommissions',
  async (marketerId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string | null } }
      const token = state.auth.token

      if (!token) {
        return rejectWithValue('No authentication token')
      }

      const data = await api.get(`/commissions/summary/${marketerId}`)
      return data
    } catch (error) {
      return rejectWithValue('Network error occurred')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateRecentActivity: (state, action: PayloadAction<RecentActivity>) => {
      state.recentActivity.unshift(action.payload)
      // Keep only the latest 10 activities
      if (state.recentActivity.length > 10) {
        state.recentActivity = state.recentActivity.slice(0, 10)
      }
    },
    clearDashboardData: (state) => {
      state.commissionSummary = null
      state.referralStats = null
      state.recentActivity = []
      state.lastUpdated = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false
        state.commissionSummary = action.payload.commissionSummary
        state.referralStats = action.payload.referralStats
        state.recentActivity = action.payload.recentActivity
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Refresh commission summary
      .addCase(refreshCommissionSummary.fulfilled, (state, action) => {
        state.commissionSummary = action.payload.data || action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(refreshCommissionSummary.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { clearError, updateRecentActivity, clearDashboardData } = dashboardSlice.actions
export default dashboardSlice.reducer