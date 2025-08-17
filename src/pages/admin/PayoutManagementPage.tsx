import React, { useEffect, useState } from 'react'
import { 
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { apiRequest } from '../../utils/apiConfig'

interface Payout {
  _id: string
  marketerId: {
    _id: string
    email: string
    firstName: string
    lastName: string
  }
  paymentMethodId: {
    _id: string
    methodType: string
  }
  adminId?: {
    _id: string
    email: string
    firstName: string
    lastName: string
  }
  amount: number
  status: 'requested' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled'
  requestedAt: string
  approvedAt?: string
  completedAt?: string
  transactionId?: string
  notes?: string
  failureReason?: string
  processingFee?: number
}

interface PayoutListResponse {
  payouts: Payout[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface PayoutStats {
  statusBreakdown: Array<{
    _id: string
    count: number
    totalAmount: number
    avgAmount: number
  }>
  processingTimes: {
    avgProcessingTime: number
    minProcessingTime: number
    maxProcessingTime: number
  }
  dailyTrends: Array<{
    _id: string
    count: number
    totalAmount: number
  }>
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    requested: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
      {status.toUpperCase()}
    </span>
  )
}

export const PayoutManagementPage: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: '',
    marketerId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [stats, setStats] = useState<PayoutStats | null>(null)

  useEffect(() => {
    fetchPayouts()
  }, [filters])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })

      const response = await apiRequest(`/api/v1/admin/payouts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch payouts')
      }

      const data: { data: PayoutListResponse } = await response.json()
      setPayouts(data.data.payouts)
      setPagination(data.data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await apiRequest(`/api/v1/admin/payouts/stats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data.data)
    } catch (err: any) {
      alert(`Error fetching stats: ${err.message}`)
    }
  }

  const updatePayoutStatus = async (payoutId: string, status: string, reason?: string, transactionId?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await apiRequest(`/api/v1/admin/payouts/${payoutId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reason, transactionId })
      })

      if (!response.ok) {
        throw new Error('Failed to update payout status')
      }

      fetchPayouts()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const bulkProcessPayouts = async (action: string, reason?: string) => {
    if (selectedPayouts.length === 0) {
      alert('Please select payouts first')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await apiRequest('/api/v1/admin/payouts/bulk-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          payoutIds: selectedPayouts, 
          action, 
          reason 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk action')
      }

      setSelectedPayouts([])
      fetchPayouts()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.status) queryParams.append('status', filters.status)

      const response = await apiRequest(`/api/v1/admin/payouts/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payout-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(`Export failed: ${err.message}`)
    }
  }

  const handleSelectAll = () => {
    if (selectedPayouts.length === payouts.length) {
      setSelectedPayouts([])
    } else {
      setSelectedPayouts(payouts.map(payout => payout._id))
    }
  }

  const handleSelectPayout = (payoutId: string) => {
    setSelectedPayouts(prev => 
      prev.includes(payoutId) 
        ? prev.filter(id => id !== payoutId)
        : [...prev, payoutId]
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const openStatsModal = () => {
    fetchStats()
    setShowStatsModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading payouts: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-600">Process and manage marketer payouts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={openStatsModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center"
          >
            <ChartBarIcon className="w-4 h-4 mr-2" />
            View Stats
          </button>
          <button
            onClick={exportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            >
              <option value="">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
            />
          </div>
          
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => setFilters({ 
                status: '', marketerId: '', startDate: '', endDate: '', page: 1, limit: 20 
              })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayouts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedPayouts.length} payout{selectedPayouts.length > 1 ? 's' : ''} selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => bulkProcessPayouts('approve')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => bulkProcessPayouts('complete')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Mark Completed
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Enter reason for rejection:')
                  if (reason) bulkProcessPayouts('reject', reason)
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPayouts.length === payouts.length && payouts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marketer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPayouts.includes(payout._id)}
                    onChange={() => handleSelectPayout(payout._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {payout.marketerId.firstName} {payout.marketerId.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{payout.marketerId.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(payout.amount)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 capitalize">{payout.paymentMethodId.methodType}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={payout.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(payout.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {payout.status === 'requested' && (
                      <>
                        <button
                          onClick={() => updatePayoutStatus(payout._id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for rejection:')
                            if (reason) updatePayoutStatus(payout._id, 'failed', reason)
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {payout.status === 'approved' && (
                      <button
                        onClick={() => {
                          const transactionId = prompt('Enter transaction ID (optional):')
                          updatePayoutStatus(payout._id, 'completed', undefined, transactionId || undefined)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Mark as Completed"
                      >
                        <CurrencyDollarIcon className="w-4 h-4" />
                      </button>
                    )}
                    {(payout.status === 'approved' || payout.status === 'processing') && (
                      <button
                        onClick={() => {
                          const reason = prompt('Enter reason for failure:')
                          if (reason) updatePayoutStatus(payout._id, 'failed', reason)
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Mark as Failed"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {payouts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No payouts found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Payout Statistics</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {stats ? (
                <div className="space-y-6">
                  {/* Status Breakdown */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Status Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {stats.statusBreakdown.map((status) => (
                        <div key={status._id} className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-gray-900">
                            {status.count}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">{status._id} Payouts</div>
                          <div className="text-sm text-gray-500">
                            Total: {formatCurrency(status.totalAmount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Avg: {formatCurrency(status.avgAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Processing Times */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Processing Times</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.processingTimes.avgProcessingTime.toFixed(1)}h
                          </div>
                          <div className="text-sm text-gray-600">Average Processing Time</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.processingTimes.minProcessingTime.toFixed(1)}h
                          </div>
                          <div className="text-sm text-gray-600">Fastest Processing</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {stats.processingTimes.maxProcessingTime.toFixed(1)}h
                          </div>
                          <div className="text-sm text-gray-600">Slowest Processing</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Trends */}
                  {stats.dailyTrends && stats.dailyTrends.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Daily Trends</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {stats.dailyTrends.map((trend) => (
                            <div key={trend._id} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{trend._id}</span>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                  {trend.count} payouts
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(trend.totalAmount)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}