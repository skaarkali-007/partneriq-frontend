import React, { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchCommissions,
  fetchCommissionAnalytics,
  setFilters,
  clearFilters,
  setCurrentPage,
  clearError,
  setRetrying,
  incrementRetryCount,
} from '../store/slices/commissionSlice'
import { CommissionHistory } from '../components/commissions/CommissionHistory'
import { CommissionAnalytics } from '../components/commissions/CommissionAnalytics'
import { CommissionFilters } from '../components/commissions/CommissionFilters'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { ErrorDisplay } from '../components/common/ErrorDisplay'
import { CommissionFilters as CommissionFiltersType } from '../types/api'

export const CommissionsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const {
    commissions,
    analytics,
    isLoading,
    isRetrying,
    error,
    pagination,
    filters,
  } = useSelector((state: RootState) => state.commission)

  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history')

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCommissions({ 
        page: pagination.currentPage, 
        filters: filters as CommissionFiltersType, 
        marketerId: user.id 
      }))
      dispatch(fetchCommissionAnalytics(user.id))
    }
  }, [dispatch, pagination.currentPage, filters, user?.id])

  const handleFilterChange = (newFilters: any) => {
    dispatch(setFilters(newFilters))
    dispatch(setCurrentPage(1))
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
    dispatch(setCurrentPage(1))
  }

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page))
  }

  const handleRetry = useCallback(async () => {
    if (!user?.id || !error?.retryable) return

    dispatch(setRetrying(true))
    dispatch(incrementRetryCount())

    try {
      // Retry the failed operation based on the current tab
      if (activeTab === 'history') {
        await dispatch(fetchCommissions({ 
          page: pagination.currentPage, 
          filters: filters as CommissionFiltersType, 
          marketerId: user.id 
        })).unwrap()
      } else {
        await dispatch(fetchCommissionAnalytics(user.id)).unwrap()
      }
    } catch (retryError) {
      // Error will be handled by the Redux slice
      console.error('Retry failed:', retryError)
    } finally {
      dispatch(setRetrying(false))
    }
  }, [dispatch, user?.id, error?.retryable, activeTab, pagination.currentPage, filters])

  const handleDismissError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
            <p className="text-gray-600">Track your earnings and commission history</p>
          </div>
        </div>

        {/* Enhanced Error Display */}
        <ErrorDisplay
          error={error}
          isRetrying={isRetrying}
          onRetry={handleRetry}
          onDismiss={handleDismissError}
        />

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Commission History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics & Performance
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <CommissionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <CommissionHistory
              commissions={commissions}
              isLoading={isLoading}
              isRetrying={isRetrying}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <CommissionAnalytics
            analytics={analytics}
            isLoading={isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  )
}