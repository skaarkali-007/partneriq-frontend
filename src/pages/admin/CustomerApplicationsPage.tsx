import React, { useEffect, useState } from 'react'
import { 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { AlertModal } from '../../components/ui/AlertModal'
import { PromptModal } from '../../components/ui/PromptModal'
import { useAlertModal } from '../../hooks/useAlertModal'

interface CustomerApplication {
  _id: string
  trackingCode: string
  customerName: string
  email: string
  phone: string
  onboardingStatus: string
  currentStep: number
  kycStatus: string
  kycDocumentsCount: number
  signatureSigned: boolean
  initialSpendAmount?: number
  paymentStatus?: string
  paymentMethod?: string
  paymentDate?: string
  commissionAmount?: number
  commissionStatus?: string
  marketerName: string
  marketerEmail: string
  productName: string
  adminReviewedAt?: string
  adminReviewedBy?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

interface ApplicationStats {
  total: number
  started: number
  personalInfo: number
  kycDocuments: number
  signature: number
  completed: number
  rejected: number
  kycPending: number
  kycInReview: number
  kycApproved: number
  kycRejected: number
  totalSpend: number
  totalCommissions: number
}

interface ApplicationFilters {
  status: string
  kycStatus: string
  paymentStatus: string
  productId: string
  marketerId: string
  search: string
  page: number
  limit: number
  sortBy: string
  sortOrder: string
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    started: { classes: 'bg-gray-100 text-gray-800', label: 'Started' },
    personal_info: { classes: 'bg-blue-100 text-blue-800', label: 'Personal Info' },
    kyc_documents: { classes: 'bg-yellow-100 text-yellow-800', label: 'KYC Documents' },
    signature: { classes: 'bg-purple-100 text-purple-800', label: 'Signature' },
    completed: { classes: 'bg-green-100 text-green-800', label: 'Completed' },
    rejected: { classes: 'bg-red-100 text-red-800', label: 'Rejected' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || {
    classes: 'bg-gray-100 text-gray-800',
    label: status
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
      {config.label}
    </span>
  )
}

const KYCStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    pending: { classes: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    in_review: { classes: 'bg-blue-100 text-blue-800', label: 'In Review' },
    approved: { classes: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { classes: 'bg-red-100 text-red-800', label: 'Rejected' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || {
    classes: 'bg-gray-100 text-gray-800',
    label: status
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.classes}`}>
      {config.label}
    </span>
  )
}

export const CustomerApplicationsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [applications, setApplications] = useState<CustomerApplication[]>([])
  const alertModal = useAlertModal()
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApplications, setSelectedApplications] = useState<string[]>([])
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<CustomerApplication | null>(null)
  const [detailedApplication, setDetailedApplication] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [statusUpdateData, setStatusUpdateData] = useState({ status: '', reason: '', adminNotes: '' })
  const [paymentUpdateData, setPaymentUpdateData] = useState({
    initialSpendAmount: '',
    paymentStatus: '',
    paymentMethod: '',
    paymentDate: '',
    reason: ''
  })

  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    kycStatus: 'all',
    paymentStatus: 'all',
    productId: 'all',
    marketerId: 'all',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && user?.status === 'active') {
      fetchApplications()
      fetchStats()
    } else {
      setError('Unauthorized: Admin access required')
      setLoading(false)
    }
  }, [filters, isAuthenticated, user])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') queryParams.append(key, value.toString())
      })

      const response = await api.get(`/admin/customers/applications?${queryParams}`)
      setApplications(response.data.data.applications)
      setPagination(response.data.data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/customers/applications/stats')
      setStats(response.data.data)
    } catch (err: any) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedApplication || !statusUpdateData.status || !statusUpdateData.reason) {
      alertModal.showAlert({
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        type: 'warning'
      })
      return
    }

    try {
      await api.put(`/admin/customers/applications/${selectedApplication._id}/status`, statusUpdateData)
      setShowStatusModal(false)
      setStatusUpdateData({ status: '', reason: '', adminNotes: '' })
      setSelectedApplication(null)
      fetchApplications()
      fetchStats()
    } catch (err: any) {
      alertModal.showAlert({
        title: 'Error',
        message: `Error: ${err.message}`,
        type: 'error'
      })
    }
  }

  const handlePaymentUpdate = async () => {
    if (!selectedApplication || !paymentUpdateData.reason) {
      alertModal.showAlert({
        title: 'Missing Information',
        message: 'Please provide a reason for the payment update',
        type: 'warning'
      })
      return
    }

    try {
      const updateData = {
        ...paymentUpdateData,
        initialSpendAmount: paymentUpdateData.initialSpendAmount ? parseFloat(paymentUpdateData.initialSpendAmount) : undefined
      }

      await api.put(`/admin/customers/applications/${selectedApplication._id}/payment`, updateData)
      setShowPaymentModal(false)
      setPaymentUpdateData({
        initialSpendAmount: '',
        paymentStatus: '',
        paymentMethod: '',
        paymentDate: '',
        reason: ''
      })
      setSelectedApplication(null)
      fetchApplications()
      fetchStats()
    } catch (err: any) {
      alertModal.showAlert({
        title: 'Error',
        message: `Error: ${err.message}`,
        type: 'error'
      })
    }
  }

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedApplications.length === 0) {
      alertModal.showAlert({
        title: 'No Selection',
        message: 'Please select applications first',
        type: 'warning'
      })
      return
    }

    const reason = await alertModal.showPrompt({
      title: 'Bulk Status Update',
      message: `Enter reason for changing status to ${status}:`,
      placeholder: 'Enter reason...'
    })
    if (!reason) return

    try {
      await api.post('/admin/customers/applications/bulk-status', {
        customerIds: selectedApplications,
        status,
        reason
      })

      setSelectedApplications([])
      fetchApplications()
      fetchStats()
    } catch (err: any) {
      alertModal.showAlert({
        title: 'Error',
        message: `Error: ${err.message}`,
        type: 'error'
      })
    }
  }

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([])
    } else {
      setSelectedApplications(applications ? applications.map(app => app._id) : [])
    }
  }

  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    )
  }

  const openStatusModal = (application: CustomerApplication) => {
    setSelectedApplication(application)
    setStatusUpdateData({
      status: application.onboardingStatus,
      reason: '',
      adminNotes: application.adminNotes || ''
    })
    setShowStatusModal(true)
  }

  const openPaymentModal = (application: CustomerApplication) => {
    setSelectedApplication(application)
    setPaymentUpdateData({
      initialSpendAmount: application.initialSpendAmount?.toString() || '',
      paymentStatus: application.paymentStatus || 'pending',
      paymentMethod: application.paymentMethod || '',
      paymentDate: application.paymentDate ? application.paymentDate.split('T')[0] : '',
      reason: ''
    })
    setShowPaymentModal(true)
  }

  const openDetailsModal = async (application: CustomerApplication) => {
    setSelectedApplication(application)
    setShowDetailsModal(true)
    setLoadingDetails(true)
    
    try {
      const response = await api.get(`/admin/customers/applications/${application._id}`)
      setDetailedApplication(response.data.data)
    } catch (err: any) {
      console.error('Error fetching application details:', err)
      alertModal.showAlert({
        title: 'Error',
        message: `Error loading details: ${err.message}`,
        type: 'error'
      })
    } finally {
      setLoadingDetails(false)
    }
  }

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
    })
  }

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading applications: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Applications</h1>
          <p className="text-gray-600">Manage customer onboarding applications and payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Spend</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpend || 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommissions || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or tracking code..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            >
              <option value="all">All Statuses</option>
              <option value="started">Started</option>
              <option value="personal_info">Personal Info</option>
              <option value="kyc_documents">KYC Documents</option>
              <option value="signature">Signature</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.kycStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value, page: 1 }))}
            >
              <option value="all">All KYC Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                status: 'all',
                kycStatus: 'all',
                paymentStatus: 'all',
                productId: 'all',
                marketerId: 'all',
                search: '',
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                sortOrder: 'desc'
              })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedApplications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''} selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleBulkStatusUpdate('completed')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Mark Completed
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={applications && selectedApplications.length === applications.length && applications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                KYC Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Initial Spend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications && applications.map((application) => (
              <tr key={application._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedApplications.includes(application._id)}
                    onChange={() => handleSelectApplication(application._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {application.customerName}
                    </div>
                    <div className="text-sm text-gray-500">{application.email}</div>
                    <div className="text-xs text-gray-400">{application.trackingCode}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{application.productName}</div>
                  <div className="text-xs text-gray-500">by {application.marketerName}</div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={application.onboardingStatus} />
                  <div className="text-xs text-gray-500 mt-1">
                    Step {application.currentStep}/4
                  </div>
                </td>
                <td className="px-6 py-4">
                  <KYCStatusBadge status={application.kycStatus} />
                  <div className="text-xs text-gray-500 mt-1">
                    {application.kycDocumentsCount} docs
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {application.initialSpendAmount ? formatCurrency(application.initialSpendAmount) : '-'}
                  {application.paymentStatus && (
                    <div className="text-xs text-gray-500 capitalize">{application.paymentStatus}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {application.commissionAmount ? (
                    <span className="font-medium text-green-600">
                      {formatCurrency(application.commissionAmount)}
                    </span>
                  ) : (
                    '-'
                  )}
                  {application.commissionStatus && (
                    <div className="text-xs text-gray-500 capitalize">{application.commissionStatus}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(application.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openDetailsModal(application)}
                      className="text-purple-600 hover:text-purple-900"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openStatusModal(application)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Update Status"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openPaymentModal(application)}
                      className="text-green-600 hover:text-green-900"
                      title="Update Payment"
                    >
                      <CurrencyDollarIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {applications && applications.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No applications found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
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

      {/* Status Update Modal */}
      {showStatusModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Application Status
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Customer: {selectedApplication.customerName}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status *
                </label>
                <select
                  value={statusUpdateData.status}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="started">Started</option>
                  <option value="personal_info">Personal Info</option>
                  <option value="kyc_documents">KYC Documents</option>
                  <option value="signature">Signature</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <textarea
                  value={statusUpdateData.reason}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter reason for status change..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={statusUpdateData.adminNotes}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Optional admin notes..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setSelectedApplication(null)
                  setStatusUpdateData({ status: '', reason: '', adminNotes: '' })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Update Modal */}
      {showPaymentModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Payment Information
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Customer: {selectedApplication.customerName}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Spend Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentUpdateData.initialSpendAmount}
                  onChange={(e) => setPaymentUpdateData(prev => ({ ...prev, initialSpendAmount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentUpdateData.paymentStatus}
                  onChange={(e) => setPaymentUpdateData(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={paymentUpdateData.paymentMethod}
                  onChange={(e) => setPaymentUpdateData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Credit Card, Bank Transfer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentUpdateData.paymentDate}
                  onChange={(e) => setPaymentUpdateData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Update *
                </label>
                <textarea
                  value={paymentUpdateData.reason}
                  onChange={(e) => setPaymentUpdateData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter reason for payment update..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedApplication(null)
                  setPaymentUpdateData({
                    initialSpendAmount: '',
                    paymentStatus: '',
                    paymentMethod: '',
                    paymentDate: '',
                    reason: ''
                  })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Update Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Customer Application Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedApplication(null)
                    setDetailedApplication(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading details...</span>
                </div>
              ) : detailedApplication ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <p className="text-sm text-gray-900">{detailedApplication.firstName} {detailedApplication.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{detailedApplication.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-sm text-gray-900">{detailedApplication.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.dateOfBirth ? formatDate(detailedApplication.dateOfBirth) : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tracking Code</label>
                        <p className="text-sm text-gray-900 font-mono">{detailedApplication.trackingCode}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Application Date</label>
                        <p className="text-sm text-gray-900">{formatDate(detailedApplication.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  {detailedApplication.address && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Address Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Street Address</label>
                          <p className="text-sm text-gray-900">{detailedApplication.address.street || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <p className="text-sm text-gray-900">{detailedApplication.address.city || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">State</label>
                          <p className="text-sm text-gray-900">{detailedApplication.address.state || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                          <p className="text-sm text-gray-900">{detailedApplication.address.zipCode || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Country</label>
                          <p className="text-sm text-gray-900">{detailedApplication.address.country || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Application Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Application Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Status</label>
                        <div className="mt-1">
                          <StatusBadge status={detailedApplication.onboardingStatus} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Step</label>
                        <p className="text-sm text-gray-900">{detailedApplication.currentStep} of {detailedApplication.totalSteps}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.completedAt ? formatDate(detailedApplication.completedAt) : 'Not completed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* KYC Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">KYC Information</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">KYC Status</label>
                          <div className="mt-1">
                            <KYCStatusBadge status={detailedApplication.kyc?.status || 'pending'} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Documents Count</label>
                          <p className="text-sm text-gray-900">{detailedApplication.kyc?.documents?.length || 0} documents</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reviewed Date</label>
                          <p className="text-sm text-gray-900">
                            {detailedApplication.kyc?.reviewedAt ? formatDate(detailedApplication.kyc.reviewedAt) : 'Not reviewed'}
                          </p>
                        </div>
                      </div>

                      {/* KYC Documents */}
                      {detailedApplication.kyc?.documents && detailedApplication.kyc.documents.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Uploaded Documents</label>
                          <div className="space-y-2">
                            {detailedApplication.kyc.documents.map((doc: any, index: number) => (
                              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                                <div className="flex items-center space-x-3">
                                  <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                                    <p className="text-xs text-gray-500">
                                      Type: {doc.type?.replace('_', ' ').toUpperCase()} • 
                                      Uploaded: {formatDate(doc.uploadedAt)}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => window.open(doc.fileUrl, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* KYC Rejection Reason */}
                      {detailedApplication.kyc?.rejectionReason && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {detailedApplication.kyc.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* E-Signature Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">E-Signature</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Signature Status</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.signature?.signed ? (
                            <span className="text-green-600 font-medium">✓ Signed</span>
                          ) : (
                            <span className="text-gray-500">Not signed</span>
                          )}
                        </p>
                      </div>
                      {detailedApplication.signature?.signed && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Signed Date</label>
                            <p className="text-sm text-gray-900">
                              {detailedApplication.signature.signedAt ? formatDate(detailedApplication.signature.signedAt) : 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">IP Address</label>
                            <p className="text-sm text-gray-900 font-mono">
                              {detailedApplication.signature.ipAddress || 'Not recorded'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">User Agent</label>
                            <p className="text-xs text-gray-500 truncate">
                              {detailedApplication.signature.userAgent || 'Not recorded'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Financial Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Initial Spend Amount</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.initialSpendAmount ? formatCurrency(detailedApplication.initialSpendAmount) : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                        <p className="text-sm text-gray-900 capitalize">
                          {detailedApplication.paymentStatus || 'Pending'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.paymentMethod || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.paymentDate ? formatDate(detailedApplication.paymentDate) : 'Not paid'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Commission Information */}
                  {detailedApplication.commissionAmount && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Commission Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Commission Amount</label>
                          <p className="text-sm text-green-600 font-medium">
                            {formatCurrency(detailedApplication.commissionAmount)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Commission Status</label>
                          <p className="text-sm text-gray-900 capitalize">
                            {detailedApplication.commissionStatus || 'Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Product and Marketer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Product & Marketer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product</label>
                        <p className="text-sm text-gray-900">{detailedApplication.product?.name || 'Unknown Product'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Marketer</label>
                        <p className="text-sm text-gray-900">
                          {detailedApplication.marketer ? 
                            `${detailedApplication.marketer.firstName} ${detailedApplication.marketer.lastName}` : 
                            'Unknown Marketer'
                          }
                        </p>
                        {detailedApplication.marketer?.email && (
                          <p className="text-xs text-gray-500">{detailedApplication.marketer.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consent Information */}
                  {detailedApplication.consents && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Consent Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                          <p className="text-sm text-gray-900">
                            {detailedApplication.consents.termsAndConditions ? 
                              <span className="text-green-600">✓ Accepted</span> : 
                              <span className="text-red-600">✗ Not accepted</span>
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Privacy Policy</label>
                          <p className="text-sm text-gray-900">
                            {detailedApplication.consents.privacyPolicy ? 
                              <span className="text-green-600">✓ Accepted</span> : 
                              <span className="text-red-600">✗ Not accepted</span>
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Marketing Communications</label>
                          <p className="text-sm text-gray-900">
                            {detailedApplication.consents.marketingCommunications ? 
                              <span className="text-green-600">✓ Accepted</span> : 
                              <span className="text-gray-500">✗ Declined</span>
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data Processing</label>
                          <p className="text-sm text-gray-900">
                            {detailedApplication.consents.dataProcessing ? 
                              <span className="text-green-600">✓ Accepted</span> : 
                              <span className="text-red-600">✗ Not accepted</span>
                            }
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Consent Date</label>
                          <p className="text-sm text-gray-900">
                            {detailedApplication.consents.consentDate ? formatDate(detailedApplication.consents.consentDate) : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {detailedApplication.adminNotes && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Admin Notes</h4>
                      <p className="text-sm text-gray-700">{detailedApplication.adminNotes}</p>
                      {detailedApplication.adminReviewedBy && (
                        <p className="text-xs text-gray-500 mt-2">
                          Reviewed by: {detailedApplication.adminReviewedBy} • 
                          {detailedApplication.adminReviewedAt ? formatDate(detailedApplication.adminReviewedAt) : 'Unknown date'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Failed to load application details</p>
                </div>
              )}
            </div>

            {/* Modal Footer with Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedApplication(null)
                    setDetailedApplication(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedApplication && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false)
                        openStatusModal(selectedApplication)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Update Status
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false)
                        openPaymentModal(selectedApplication)
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    >
                      Update Payment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={alertModal.handleClose}
        onConfirm={alertModal.handleConfirm}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
        cancelText={alertModal.options.cancelText}
        showCancel={alertModal.options.showCancel}
      />

      <PromptModal
        isOpen={alertModal.isPromptOpen}
        onClose={alertModal.handlePromptClose}
        onConfirm={alertModal.handlePromptConfirm}
        title={alertModal.promptOptions.title}
        message={alertModal.promptOptions.message}
        placeholder={alertModal.promptOptions.placeholder}
        confirmText={alertModal.promptOptions.confirmText}
        cancelText={alertModal.promptOptions.cancelText}
      />
    </div>
  )
}