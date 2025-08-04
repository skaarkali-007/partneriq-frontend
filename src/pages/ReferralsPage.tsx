import React, { useEffect, useCallback, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store'
import { useAuth } from '../contexts/AuthContext'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { ReferralLinkGenerator } from '../components/referrals/ReferralLinkGenerator'
import { ReferralTrackingTable } from '../components/referrals/ReferralTrackingTable'
import { ReferralFilters } from '../components/referrals/ReferralFilters'
import { ReferralAnalytics } from '../components/referrals/ReferralAnalytics'
import { ReferralNotifications } from '../components/referrals/ReferralNotifications'
import { ErrorDisplay } from '../components/common/ErrorDisplay'
import { 
  fetchReferralLinks, 
  fetchCustomerReferrals, 
  fetchReferralStats,
  setFilters,
  toggleRealTime,
  createReferralLink,
  clearError,
  setRetrying,
  incrementRetryCount
} from '../store/slices/referralSlice'
import { ReferralFilters as ReferralFiltersType } from '../types/api'

export interface ReferralFilters extends ReferralFiltersType {
  minSpend?: string
  maxSpend?: string
  dateFrom?: string
  dateTo?: string
}

export const ReferralsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const { 
    referralLinks, 
    customerReferrals, 
    filters: reduxFilters,
    isLoading, 
    isRetrying,
    error,
    realTimeEnabled,
    stats
  } = useSelector((state: RootState) => state.referral)

  // Local state for extended filters
  const [extendedFilters, setExtendedFilters] = useState<ReferralFilters>({
    ...reduxFilters,
    minSpend: '',
    maxSpend: '',
    dateFrom: '',
    dateTo: '',
  })

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted')
        }
      })
    }
  }, [])

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Make actual API calls if user is available
        if (user?.id) {
          dispatch(fetchReferralLinks(user.id))
          dispatch(fetchCustomerReferrals({ marketerId: user.id, filters: reduxFilters }))
          dispatch(fetchReferralStats(user.id))
        }
      } catch (error) {
        console.error('Failed to initialize referral data:', error)
      }
    }

    initializeData()
  }, [dispatch, user?.id])

  // Real-time updates - refresh data periodically
  useEffect(() => {
    if (!realTimeEnabled) return

    const interval = setInterval(() => {
      // Refresh real data from backend
      if (user?.id) {
        dispatch(fetchCustomerReferrals({ marketerId: user.id, filters: reduxFilters }))
        dispatch(fetchReferralStats(user.id))
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [realTimeEnabled, dispatch, user?.id, reduxFilters])

  const handleCreateReferralLink = useCallback(async (productId: string) => {
    try {
      await dispatch(createReferralLink(productId)).unwrap()
    } catch (error) {
      console.error('Failed to create referral link:', error)
    }
  }, [dispatch])

  const handleFiltersChange = useCallback((newFilters: Partial<ReferralFilters>) => {
    const updatedFilters = { ...extendedFilters, ...newFilters }
    setExtendedFilters(updatedFilters)
    
    // Update Redux filters (excluding extended fields)
    const { minSpend, maxSpend, dateFrom, dateTo, ...reduxFilterUpdate } = updatedFilters
    dispatch(setFilters(reduxFilterUpdate))
    
    // Fetch updated data based on new filters
    // dispatch(fetchCustomerReferrals(updatedFilters))
  }, [extendedFilters, dispatch])

  const handleRefreshData = useCallback(() => {
    if (user?.id) {
      dispatch(fetchReferralLinks(user.id))
      dispatch(fetchCustomerReferrals({ marketerId: user.id, filters: reduxFilters }))
      dispatch(fetchReferralStats(user.id))
    }
  }, [dispatch, reduxFilters, user?.id])

  const handleToggleRealTime = useCallback(() => {
    dispatch(toggleRealTime())
  }, [dispatch])

  const handleClearError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleRetry = useCallback(async () => {
    if (!user?.id || !error?.retryable) return

    dispatch(setRetrying(true))
    dispatch(incrementRetryCount())

    try {
      // Retry all failed operations
      await Promise.all([
        dispatch(fetchReferralLinks(user.id)).unwrap(),
        dispatch(fetchCustomerReferrals({ marketerId: user.id, filters: reduxFilters })).unwrap(),
        dispatch(fetchReferralStats(user.id)).unwrap()
      ])
    } catch (retryError) {
      // Error will be handled by the Redux slice
      console.error('Retry failed:', retryError)
    } finally {
      dispatch(setRetrying(false))
    }
  }, [dispatch, user?.id, error?.retryable, reduxFilters])

  // Enhanced filtering logic
  const filteredReferrals = useMemo(() => customerReferrals.filter(referral => {
    // Basic filters
    if (extendedFilters.status !== 'all' && referral.status !== extendedFilters.status) {
      return false
    }
    
    if (extendedFilters.search && !referral.customerEmail?.toLowerCase().includes(extendedFilters.search.toLowerCase())) {
      return false
    }
    
    // Commission status filter
    if (extendedFilters.commissionStatus && extendedFilters.commissionStatus !== 'all') {
      if (!referral.commissionStatus || referral.commissionStatus !== extendedFilters.commissionStatus) {
        return false
      }
    }
    
    // Source filter
    if (extendedFilters.source && extendedFilters.source !== 'all') {
      if (referral.source !== extendedFilters.source) {
        return false
      }
    }
    
    // Spend amount filters
    if (extendedFilters.minSpend && referral.initialSpend) {
      if (referral.initialSpend < parseFloat(extendedFilters.minSpend)) {
        return false
      }
    }
    
    if (extendedFilters.maxSpend && referral.initialSpend) {
      if (referral.initialSpend > parseFloat(extendedFilters.maxSpend)) {
        return false
      }
    }
    
    // Date range filter
    const referredDate = new Date(referral.referredAt)
    
    // Custom date range
    if (extendedFilters.dateFrom) {
      const fromDate = new Date(extendedFilters.dateFrom)
      if (referredDate < fromDate) {
        return false
      }
    }
    
    if (extendedFilters.dateTo) {
      const toDate = new Date(extendedFilters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      if (referredDate > toDate) {
        return false
      }
    }
    
    // Standard date range filter (if no custom dates)
    if (!extendedFilters.dateFrom && !extendedFilters.dateTo && extendedFilters.dateRange) {
      const daysAgo = parseInt(extendedFilters.dateRange)
      if (daysAgo > 0) {
        const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        if (referredDate < cutoffDate) {
          return false
        }
      }
    }
    
    return true
  }), [customerReferrals, extendedFilters])

  const handleExportData = useCallback(() => {
    try {
      // Prepare data for export
      const exportData = filteredReferrals.map(referral => ({
        'Customer Email': referral.customerEmail,
        'Customer Name': referral.customerName || '',
        'Product': referral.productName,
        'Tracking Code': referral.trackingCode,
        'Status': referral.status,
        'Source': referral.source,
        'Referred Date': new Date(referral.referredAt).toLocaleDateString(),
        'Converted Date': referral.convertedAt ? new Date(referral.convertedAt).toLocaleDateString() : '',
        'Initial Spend': referral.initialSpend ? `$${referral.initialSpend.toFixed(2)}` : '',
        'Commission Amount': referral.commissionAmount ? `$${referral.commissionAmount.toFixed(2)}` : '',
        'Commission Status': referral.commissionStatus || '',
        'Last Activity': referral.lastActivityAt ? new Date(referral.lastActivityAt).toLocaleDateString() : '',
      }))

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {})
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row] || ''
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `referral-data-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to export data:', error)
    }
  }, [filteredReferrals])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Referral Tracking</h1>
            <p className="text-sm text-gray-500">
              Manage your referral links and track customer conversions
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <ReferralNotifications
              onNotificationClick={(notification) => {
                // Handle notification click - could scroll to specific referral or show details
                console.log('Notification clicked:', notification)
                if (notification.referralId) {
                  // In a real implementation, this could highlight the specific referral
                  // or open a modal with details
                }
              }}
            />
            
            {/* Real-time Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Real-time updates</span>
              <button
                onClick={handleToggleRealTime}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  realTimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                title={realTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              {realTimeEnabled && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExportData}
              disabled={filteredReferrals.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export referral data to CSV"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
            
            {/* Stats Summary */}
            {stats && (
              <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-blue-600">{stats.totalClicks || 0}</span>
                  <span>Clicks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-green-600">{stats.totalConversions || 0}</span>
                  <span>Conversions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-purple-600">{((stats.conversionRate || 0) * 100).toFixed(1)}%</span>
                  <span>Rate</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Error Display */}
        <ErrorDisplay
          error={error}
          isRetrying={isRetrying}
          onRetry={handleRetry}
          onDismiss={handleClearError}
        />

        {/* Performance Analytics */}
        <ReferralAnalytics
          referrals={customerReferrals}
          referralLinks={referralLinks}
        />

        {/* Referral Link Generator */}
        <ReferralLinkGenerator
          referralLinks={referralLinks}
          onCreateLink={handleCreateReferralLink}
          isLoading={isLoading}
        />

        {/* Filters */}
        <ReferralFilters
          filters={{
            status: extendedFilters.status,
            productId: extendedFilters.productId,
            dateFrom: extendedFilters.dateFrom,
            dateTo: extendedFilters.dateTo,
            product: extendedFilters.product || ''
          }}
          onFiltersChange={(filters) => handleFiltersChange(filters as Partial<ReferralFilters>)}
          totalCount={customerReferrals.length}
          filteredCount={filteredReferrals.length}
        />

        {/* Customer Referrals Table */}
        <ReferralTrackingTable
          referrals={filteredReferrals}
          isLoading={isLoading}
          isRetrying={isRetrying}
        />
      </div>
    </DashboardLayout>
  )
}