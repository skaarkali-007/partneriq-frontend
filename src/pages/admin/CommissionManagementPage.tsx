import React, { useEffect, useState } from 'react'
import { 
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface Commission {
  _id: string
  marketerId: {
    _id: string
    email: string
    firstName: string
    lastName: string
  }
  productId: {
    _id: string
    name: string
    category: string
  }
  customerId: string
  trackingCode: string
  initialSpendAmount: number
  commissionRate: number
  commissionAmount: number
  status: 'pending' | 'approved' | 'paid' | 'clawed_back'
  conversionDate: string
  approvalDate?: string
  clearancePeriodDays: number
  createdAt: string
  updatedAt: string
}

interface CommissionListResponse {
  commissions: Commission[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    clawed_back: 'bg-red-100 text-red-800'
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

export const CommissionManagementPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    marketerId: '',
    productId: '',
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

  useEffect(() => {
    fetchCommissions()
  }, [filters])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })

      const response = await fetch(`/api/v1/admin/commissions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch commissions')
      }

      const data: { data: CommissionListResponse } = await response.json()
      setCommissions(data.data.commissions)
      setPagination(data.data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateCommissionStatus = async (commissionId: string, status: string, reason?: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/admin/commissions/${commissionId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, reason })
      })

      if (!response.ok) {
        throw new Error('Failed to update commission status')
      }

      fetchCommissions()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const bulkUpdateCommissions = async (status: string, reason?: string) => {
    if (selectedCommissions.length === 0) {
      alert('Please select commissions first')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/admin/commissions/bulk-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          commissionIds: selectedCommissions, 
          status, 
          reason 
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk update')
      }

      setSelectedCommissions([])
      fetchCommissions()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleSelectAll = () => {
    if (selectedCommissions.length === commissions.length) {
      setSelectedCommissions([])
    } else {
      setSelectedCommissions(commissions.map(commission => commission._id))
    }
  }

  const handleSelectCommission = (commissionId: string) => {
    setSelectedCommissions(prev => 
      prev.includes(commissionId) 
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
        <p className="text-red-800">Error loading commissions: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600">Review and manage marketer commissions</p>
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="clawed_back">Clawed Back</option>
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
                search: '', status: '', marketerId: '', productId: '', 
                startDate: '', endDate: '', page: 1, limit: 20 
              })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCommissions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedCommissions.length} commission{selectedCommissions.length > 1 ? 's' : ''} selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => bulkUpdateCommissions('approved')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => bulkUpdateCommissions('paid')}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Mark Paid
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Enter reason for clawback:')
                  if (reason) bulkUpdateCommissions('clawed_back', reason)
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Clawback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCommissions.length === commissions.length && commissions.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Marketer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Initial Spend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversion Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commissions.map((commission) => (
              <tr key={commission._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCommissions.includes(commission._id)}
                    onChange={() => handleSelectCommission(commission._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {commission.marketerId ? 
                        `${commission.marketerId.firstName} ${commission.marketerId.lastName}` : 
                        'Unknown Marketer'
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {commission.marketerId?.email || 'No email'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {commission.productId?.name || 'Unknown Product'}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {commission.productId?.category || 'Unknown Category'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{formatCurrency(commission.initialSpendAmount)}</span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(commission.commissionAmount)}</div>
                    <div className="text-sm text-gray-500">{(commission.commissionRate * 100).toFixed(2)}%</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={commission.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(commission.conversionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {commission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateCommissionStatus(commission._id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter reason for rejection:')
                            if (reason) updateCommissionStatus(commission._id, 'clawed_back', reason)
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Reject/Clawback"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {commission.status === 'approved' && (
                      <button
                        onClick={() => updateCommissionStatus(commission._id, 'paid')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Mark as Paid"
                      >
                        <CurrencyDollarIcon className="w-4 h-4" />
                      </button>
                    )}
                    {(commission.status === 'approved' || commission.status === 'paid') && (
                      <button
                        onClick={() => {
                          const reason = prompt('Enter reason for clawback:')
                          if (reason) updateCommissionStatus(commission._id, 'clawed_back', reason)
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Clawback"
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
        
        {commissions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No commissions found matching your criteria</p>
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
    </div>
  )
}