import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { CustomerReferral } from '../../types/api'
import { updateCustomerReferral } from '../../store/slices/referralSlice'

interface ReferralTrackingTableProps {
  referrals: CustomerReferral[]
  isLoading: boolean
  isRetrying?: boolean
}

export const ReferralTrackingTable: React.FC<ReferralTrackingTableProps> = ({
  referrals,
  isLoading,
  isRetrying = false,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { realTimeEnabled } = useSelector((state: RootState) => state.referral)
  
  const [sortField, setSortField] = useState<keyof CustomerReferral>('referredAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedReferral, setSelectedReferral] = useState<CustomerReferral | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [, setLastUpdate] = useState<Date>(new Date())

  // Real-time updates simulation with WebSocket-like behavior
  useEffect(() => {
    if (!realTimeEnabled) return

    const interval = setInterval(() => {
      // Simulate real-time status updates
      referrals.forEach(referral => {
        if (Math.random() < 0.05) { // 5% chance of status update
          const possibleStatuses = ['pending', 'onboarding', 'converted', 'rejected']
          const currentIndex = possibleStatuses.indexOf(referral.status)
          
          // Progress status forward occasionally
          if (currentIndex < possibleStatuses.length - 1 && Math.random() < 0.3) {
            const newStatus = possibleStatuses[currentIndex + 1] as CustomerReferral['status']
            dispatch(updateCustomerReferral({
              id: referral.id,
              status: newStatus,
              lastActivityAt: new Date().toISOString(),
              ...(newStatus === 'converted' && {
                convertedAt: new Date().toISOString(),
                initialSpend: Math.floor(Math.random() * 10000) + 1000,
                commissionAmount: Math.floor(Math.random() * 500) + 50,
                commissionStatus: 'pending' as const
              })
            }))
          }
        }
      })
      setLastUpdate(new Date())
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [referrals, realTimeEnabled, dispatch])

  // Enhanced real-time activity tracking
  useEffect(() => {
    if (!realTimeEnabled) return

    // Simulate activity updates for better UX
    const activityInterval = setInterval(() => {
      referrals.forEach(referral => {
        // Update last activity for active referrals
        if (referral.status === 'onboarding' && Math.random() < 0.1) {
          dispatch(updateCustomerReferral({
            id: referral.id,
            lastActivityAt: new Date().toISOString(),
          }))
        }
      })
    }, 10000) // Check every 10 seconds

    return () => clearInterval(activityInterval)
  }, [referrals, realTimeEnabled, dispatch])

  // Enhanced real-time notification system
  useEffect(() => {
    if (!realTimeEnabled) return

    // Simulate WebSocket connection for real-time updates
    const simulateWebSocketUpdates = () => {
      // Simulate conversion events
      if (Math.random() < 0.02) { // 2% chance of new conversion
        const pendingReferrals = referrals.filter(r => r.status === 'pending' || r.status === 'onboarding')
        if (pendingReferrals.length > 0) {
          const randomReferral = pendingReferrals[Math.floor(Math.random() * pendingReferrals.length)]
          dispatch(updateCustomerReferral({
            id: randomReferral.id,
            status: 'converted',
            convertedAt: new Date().toISOString(),
            initialSpend: Math.floor(Math.random() * 15000) + 2000,
            commissionAmount: Math.floor(Math.random() * 750) + 100,
            commissionStatus: 'pending',
            lastActivityAt: new Date().toISOString(),
          }))
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Conversion!', {
              body: `${randomReferral.customerEmail} just converted on ${randomReferral.productName}`,
              icon: '/favicon.ico'
            })
          }
        }
      }
    }

    const wsInterval = setInterval(simulateWebSocketUpdates, 8000) // Check every 8 seconds
    return () => clearInterval(wsInterval)
  }, [referrals, realTimeEnabled, dispatch])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string, referral: CustomerReferral) => {
    const statusConfig = {
      pending: { 
        classes: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: 'Pending',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      onboarding: { 
        classes: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Onboarding',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      converted: { 
        classes: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Converted',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      },
      rejected: { 
        classes: 'bg-red-100 text-red-800 border-red-200', 
        label: 'Rejected',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      classes: 'bg-gray-100 text-gray-800 border-gray-200',
      label: status,
      icon: null
    }

    // Show pulse animation for recent activity
    const isRecentActivity = referral.lastActivityAt && 
      new Date(referral.lastActivityAt).getTime() > Date.now() - 60000 // Last minute

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        config.classes
      } ${isRecentActivity ? 'animate-pulse' : ''}`}>
        {config.icon}
        {config.label}
        {isRecentActivity && (
          <span className="ml-1 w-1.5 h-1.5 bg-current rounded-full animate-ping"></span>
        )}
      </span>
    )
  }

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      cookie: { classes: 'bg-purple-100 text-purple-800', label: 'Cookie' },
      portal: { classes: 'bg-indigo-100 text-indigo-800', label: 'Portal' },
      direct: { classes: 'bg-gray-100 text-gray-800', label: 'Direct' },
    }

    const config = sourceConfig[source as keyof typeof sourceConfig] || {
      classes: 'bg-gray-100 text-gray-800',
      label: source
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  const handleViewDetails = (referral: CustomerReferral) => {
    setSelectedReferral(referral)
    setShowDetails(true)
  }

  const handleSort = (field: keyof CustomerReferral) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedReferrals = [...referrals].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue === undefined || bValue === undefined) return 0
    
    let comparison = 0
    if (aValue < bValue) comparison = -1
    if (aValue > bValue) comparison = 1
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const SortIcon: React.FC<{ field: keyof CustomerReferral }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Customer Referrals ({referrals.length})
          </h3>
          
          <div className="flex items-center space-x-4">
            {/* Retry indicator */}
            {isRetrying && (
              <div className="flex items-center text-sm text-blue-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Retrying...
              </div>
            )}
            
            {/* Real-time indicator */}
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live updates
            </div>
          </div>
        </div>

        {sortedReferrals.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No customer referrals match your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('customerEmail')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      <SortIcon field="customerEmail" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('productName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Product</span>
                      <SortIcon field="productName" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('referredAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Referred</span>
                      <SortIcon field="referredAt" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('initialSpend')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Initial Spend</span>
                      <SortIcon field="initialSpend" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('commissionAmount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Commission</span>
                      <SortIcon field="commissionAmount" />
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {referral.customerEmail?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {referral.customerEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.trackingCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{referral.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(referral.status, referral)}
                        {referral.source && getSourceBadge(referral.source)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(referral.referredAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.initialSpend ? formatCurrency(referral.initialSpend) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {referral.commissionAmount ? (
                        <span className="font-medium text-green-600">
                          {formatCurrency(referral.commissionAmount)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewDetails(referral)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedReferral && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Referral Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-6">
                {/* Customer Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedReferral.customerEmail}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedReferral.customerId}</p>
                      </div>
                      {selectedReferral.customerName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedReferral.customerName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Referral Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedReferral.productName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tracking Code</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{selectedReferral.trackingCode}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedReferral.status, selectedReferral)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Source</label>
                        <div className="mt-1">
                          {selectedReferral.source && getSourceBadge(selectedReferral.source)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Referred At</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedReferral.referredAt)}</p>
                      </div>
                      {selectedReferral.convertedAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Converted At</label>
                          <p className="mt-1 text-sm text-gray-900">{formatDate(selectedReferral.convertedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                {(selectedReferral.initialSpend || selectedReferral.commissionAmount) && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Financial Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedReferral.initialSpend && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Initial Spend</label>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                              {formatCurrency(selectedReferral.initialSpend)}
                            </p>
                          </div>
                        )}
                        {selectedReferral.commissionAmount && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Commission Amount</label>
                            <p className="mt-1 text-lg font-semibold text-green-600">
                              {formatCurrency(selectedReferral.commissionAmount)}
                            </p>
                          </div>
                        )}
                        {selectedReferral.commissionStatus && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Commission Status</label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">{selectedReferral.commissionStatus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Timeline */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Activity Timeline</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        <li>
                          <div className="relative pb-8">
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Customer referred via {selectedReferral.source} at{' '}
                                    <time dateTime={selectedReferral.referredAt}>
                                      {formatDate(selectedReferral.referredAt)}
                                    </time>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                        
                        {selectedReferral.convertedAt && (
                          <li>
                            <div className="relative pb-8">
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Customer converted at{' '}
                                      <time dateTime={selectedReferral.convertedAt}>
                                        {formatDate(selectedReferral.convertedAt)}
                                      </time>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        )}

                        <li>
                          <div className="relative">
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white">
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Last activity at{' '}
                                    <time dateTime={selectedReferral.lastActivityAt}>
                                      {selectedReferral.lastActivityAt ? formatDate(selectedReferral.lastActivityAt) : 'N/A'}
                                    </time>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // In real implementation, this would export referral data
                    console.log('Exporting referral data:', selectedReferral)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}