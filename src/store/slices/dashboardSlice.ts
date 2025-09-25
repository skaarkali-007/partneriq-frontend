import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'

export interface CommissionSummary {
  totalEarnings: number
  pendingCommissions: number
  approvedCommissions: number
  paidCommissions: number
  clawedBackAmount: number
  availableBalance: number
  thisMonthEarnings: number
  conversionRate: number
  totalCommissions: number
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
  performanceData: PerformanceData[]
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

const initialState: DashboardState = {
  commissionSummary: null,
  referralStats: null,
  recentActivity: [],
  performanceData: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// Async thunks for dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_marketerId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { 
        auth: { token: string | null }
      }
      const token = state.auth.token

      if (!token) {
        return rejectWithValue('No authentication token')
      }

      // Fetch dashboard data directly from the API
      const api = (await import('../../services/api')).default
      
      const response = await api.get('/marketer/dashboard')
      const dashboardData = response.data.data
      
      console.log('Dashboard API response:', dashboardData)

      // Transform commission summary data
      const commissionSummaryData = dashboardData.commissionSummary || {}
      const commissionSummary: CommissionSummary = {
        totalEarnings: commissionSummaryData.totalEarned || 0,
        pendingCommissions: commissionSummaryData.pendingAmount || 0,
        approvedCommissions: commissionSummaryData.approvedAmount || 0,
        paidCommissions: commissionSummaryData.paidAmount || 0,
        clawedBackAmount: commissionSummaryData.clawedBackAmount || 0,
        availableBalance: commissionSummaryData.paidAmount || 0,
        thisMonthEarnings: 0, // Calculate from recent customers
        conversionRate: dashboardData.performanceMetrics?.conversionRate || 0,
        totalCommissions: commissionSummaryData.totalCommissions || 0,
      }

      // Calculate this month's earnings from recent customers
      const recentCustomers = dashboardData.recentCustomers || []
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const thisMonthEarnings = recentCustomers
        .filter((customer: any) => {
          const customerDate = new Date(customer.createdAt)
          return customerDate.getMonth() === currentMonth && 
                 customerDate.getFullYear() === currentYear &&
                 customer.status === 'completed'
        })
        .reduce((sum: number, customer: any) => sum + (customer.commissionEarned || 0), 0)
      
      commissionSummary.thisMonthEarnings = thisMonthEarnings

      // Transform referral stats from dashboard data
      const performanceMetrics = dashboardData.performanceMetrics || {}
      const referralStats: ReferralStats = {
        totalClicks: performanceMetrics.totalClicks || 0,
        totalConversions: performanceMetrics.totalConversions || 0,
        conversionRate: performanceMetrics.conversionRate || 0,
        totalCommissions: commissionSummaryData.totalEarned || 0,
        pendingCommissions: commissionSummaryData.pendingAmount || 0,
        approvedCommissions: commissionSummaryData.approvedAmount || 0,
        paidCommissions: commissionSummaryData.paidAmount || 0,
      }

      // Transform recent activity from recent customers
      const recentActivity: RecentActivity[] = recentCustomers.slice(0, 5).map((customer: any) => ({
        id: customer.id,
        type: 'referral' as const,
        description: `${customer.name !== 'N/A' ? customer.name : customer.email} ${customer.status === 'completed' ? 'completed application' : customer.status === 'started' ? 'started application' : customer.status}`,
        amount: customer.commissionEarned || undefined,
        timestamp: customer.createdAt,
        status: customer.status === 'completed' ? 'completed' : customer.status === 'started' ? 'pending' : customer.status,
      }))

      // Fetch commission details for performance chart
      const { commissionService } = await import('../../services/commissionService')
      let performanceData: PerformanceData[] = []
      
      try {
        const commissionsResult = await commissionService.getCommissions({}, 1, 100)
        const commissions = commissionsResult.items || []
        
        // Group commissions by month for the last 6 months
        const monthlyData: { [key: string]: { commissions: number; referrals: number } } = {}
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

          monthlyData[monthKey] = { commissions: 0, referrals: 0 }
        }
        
        // Aggregate commission data by month
        commissions.forEach((commission: any) => {
          const date = new Date(commission.conversionDate)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].commissions += commission.commissionAmount || 0
            monthlyData[monthKey].referrals += 1
          }
        })
        
        // Convert to performance data format
        performanceData = Object.entries(monthlyData).map(([monthKey, data]) => {
          const [, month] = monthKey.split('-')
          const monthIndex = parseInt(month) - 1
          return {
            month: months[monthIndex],
            commissions: data.commissions,
            referrals: data.referrals
          }
        })
      } catch (error) {
        console.error('Error fetching commission details for performance chart:', error)
        // Use fallback data
        performanceData = [
          { month: 'Jan', commissions: 0, referrals: 0 },
          { month: 'Feb', commissions: 0, referrals: 0 },
          { month: 'Mar', commissions: 0, referrals: 0 },
          { month: 'Apr', commissions: 0, referrals: 0 },
          { month: 'May', commissions: 0, referrals: 0 },
          { month: 'Jun', commissions: 0, referrals: 0 },
        ]
      }

      return {
        commissionSummary,
        referralStats,
        recentActivity,
        performanceData,
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
      state.performanceData = []
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
        state.performanceData = action.payload.performanceData
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