import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { useAuth } from '../contexts/AuthContext'
import {
  fetchCommissions,
  fetchCommissionAnalytics,
  setFilters,
  clearFilters,
  setCurrentPage,
} from '../store/slices/commissionSlice'
import { CommissionHistory } from '../components/commissions/CommissionHistory'
import { CommissionAnalytics } from '../components/commissions/CommissionAnalytics'
import { CommissionFilters } from '../components/commissions/CommissionFilters'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { CommissionFilters as CommissionFiltersType } from '../types/api'

export const CommissionsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const {
    commissions,
    analytics,
    isLoading,
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

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