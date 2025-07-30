import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store'
import { fetchDashboardData } from '../store/slices/dashboardSlice'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { CommissionSummaryCard } from '../components/dashboard/CommissionSummaryCard'
import { ReferralStatsCard } from '../components/dashboard/ReferralStatsCard'
import { PerformanceChart } from '../components/dashboard/PerformanceChart'
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard'

export const DashboardPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const { 
    commissionSummary, 
    referralStats, 
    recentActivity, 
    isLoading, 
    error,
    lastUpdated 
  } = useSelector((state: RootState) => state.dashboard)

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchDashboardData(user.id))
    }
  }, [dispatch, user?.id])

  const handleRefresh = () => {
    if (user?.id) {
      dispatch(fetchDashboardData(user.id))
    }
  }

  if (isLoading && !commissionSummary) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CommissionSummaryCard data={commissionSummary} />
          <ReferralStatsCard data={referralStats} />
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h2>
          <PerformanceChart />
        </div>

        {/* Recent Activity */}
        <RecentActivityCard activities={recentActivity} />
      </div>
    </DashboardLayout>
  )
}