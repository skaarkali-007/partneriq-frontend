import React, { useEffect, useState } from 'react'
import { 
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: 'marketer' | 'admin'
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  emailVerified: boolean
  createdAt: string
  profile?: {
    kycStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'requires_resubmission'
    quizScore?: number
    quizCompleted?: boolean
  }
}

interface KYCDocument {
  id: string
  type: 'government_id' | 'proof_of_address' | 'selfie' | 'other'
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: string
}

interface KYCProfile {
  id: string
  userId: any
  kycStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'requires_resubmission'
  kycSubmittedAt?: string
  kycApprovedAt?: string
  kycRejectedAt?: string
  kycRejectionReason?: string
  kycReviewedBy?: any
  complianceQuizScore?: number
  complianceQuizPassed: boolean
  documents: KYCDocument[]
}



const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    revoked: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export const UserManagementPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [selectedUserForKYC, setSelectedUserForKYC] = useState<User | null>(null)
  const [kycProfile, setKycProfile] = useState<KYCProfile | null>(null)
  const [kycLoading, setKycLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && user?.status === 'active') {
      fetchUsers()
    } else {
      setError('Unauthorized: Admin access required')
      setLoading(false)
    }
  }, [filters, isAuthenticated, user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })

      const response = await api.get(`/admin/users?${queryParams}`)
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, status: string, reason?: string) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { status, reason })
      // Refresh users list
      fetchUsers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const bulkAction = async (action: string, reason?: string) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first')
      return
    }

    try {
      await api.post('/admin/users/bulk-action', { 
        userIds: selectedUsers, 
        action, 
        reason 
      })

      setSelectedUsers([])
      fetchUsers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user._id))
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const fetchKYCProfile = async (userId: string) => {
    try {
      setKycLoading(true)
      const response = await api.get(`/admin/users/${userId}/kyc`)
      setKycProfile(response.data.data.profile)
    } catch (err: any) {
      alert(`Error fetching KYC data: ${err.message}`)
    } finally {
      setKycLoading(false)
    }
  }

  const updateKYCStatus = async (userId: string, status: string, reason?: string) => {
    try {
      await api.put(`/admin/users/${userId}/kyc/status`, { status, reason })

      // Refresh KYC profile and users list
      await fetchKYCProfile(userId)
      fetchUsers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const reviewKYCDocument = async (userId: string, documentId: string, status: string, rejectionReason?: string) => {
    try {
      await api.put(`/admin/users/${userId}/kyc/documents/${documentId}`, { status, rejectionReason })

      // Refresh KYC profile
      await fetchKYCProfile(userId)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const downloadKYCDocument = async (userId: string, documentId: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/v1/admin/users/${userId}/kyc/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      // In a real implementation, this would download the file
      // For now, we'll just show a message
      const data = await response.json()
      alert(data.message)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const openKYCReview = (user: User) => {
    setSelectedUserForKYC(user)
    fetchKYCProfile(user._id)
  }

  const closeKYCReview = () => {
    setSelectedUserForKYC(null)
    setKycProfile(null)
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
        <p className="text-red-800">Error loading users: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage marketer accounts and permissions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
            >
              <option value="">All Roles</option>
              <option value="marketer">Marketer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', role: '', status: '', page: 1, limit: 20 })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="space-x-2">
              <button
                onClick={() => bulkAction('approve')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => bulkAction('suspend')}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                Suspend
              </button>
              <button
                onClick={() => bulkAction('revoke')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                KYC Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleSelectUser(user._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 capitalize">{user.role}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.profile?.kycStatus || 'pending'} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {user.role === 'marketer' && (
                      <button
                        onClick={() => openKYCReview(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Review KYC"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                      </button>
                    )}
                    {user.status === 'pending' && (
                      <button
                        onClick={() => updateUserStatus(user._id, 'active')}
                        className="text-green-600 hover:text-green-900"
                        title="Approve"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button
                        onClick={() => updateUserStatus(user._id, 'suspended')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Suspend"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      </button>
                    )}
                    {(user.status === 'active' || user.status === 'suspended') && (
                      <button
                        onClick={() => updateUserStatus(user._id, 'revoked')}
                        className="text-red-600 hover:text-red-900"
                        title="Revoke"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No users found matching your criteria</p>
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

      {/* KYC Review Modal */}
      {selectedUserForKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">KYC Review</h3>
                  <p className="text-sm text-gray-600">
                    {selectedUserForKYC.firstName} {selectedUserForKYC.lastName} ({selectedUserForKYC.email})
                  </p>
                </div>
                <button
                  onClick={closeKYCReview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {kycLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : kycProfile ? (
                <div className="space-y-6">
                  {/* KYC Status Overview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Status</label>
                        <StatusBadge status={kycProfile.kycStatus} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quiz Score</label>
                        <p className="text-sm text-gray-900">
                          {kycProfile.complianceQuizScore || 'Not completed'} 
                          {kycProfile.complianceQuizScore && '/100'}
                          {kycProfile.complianceQuizPassed && (
                            <span className="ml-2 text-green-600">✓ Passed</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Submitted</label>
                        <p className="text-sm text-gray-900">
                          {kycProfile.kycSubmittedAt 
                            ? new Date(kycProfile.kycSubmittedAt).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </p>
                      </div>
                    </div>

                    {kycProfile.kycRejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {kycProfile.kycRejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* KYC Status Actions */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Update KYC Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateKYCStatus(selectedUserForKYC._id, 'in_review')}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        disabled={kycProfile.kycStatus === 'in_review'}
                      >
                        Mark In Review
                      </button>
                      <button
                        onClick={() => updateKYCStatus(selectedUserForKYC._id, 'approved')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        disabled={kycProfile.kycStatus === 'approved'}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:')
                          if (reason) updateKYCStatus(selectedUserForKYC._id, 'rejected', reason)
                        }}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter reason for resubmission request:')
                          if (reason) updateKYCStatus(selectedUserForKYC._id, 'requires_resubmission', reason)
                        }}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                      >
                        Request Resubmission
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      KYC Documents ({kycProfile.documents.length})
                    </h4>
                    
                    {kycProfile.documents.length === 0 ? (
                      <p className="text-sm text-gray-500">No documents uploaded yet</p>
                    ) : (
                      <div className="space-y-3">
                        {kycProfile.documents.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {doc.originalName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {doc.type.replace('_', ' ').toUpperCase()} • 
                                      {(doc.size / 1024).toFixed(1)} KB • 
                                      {new Date(doc.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <StatusBadge status={doc.status} />
                                </div>
                                
                                {doc.rejectionReason && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                    <strong>Rejection Reason:</strong> {doc.rejectionReason}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => downloadKYCDocument(selectedUserForKYC._id, doc.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Download"
                                >
                                  <ArrowDownTrayIcon className="w-4 h-4" />
                                </button>
                                
                                {doc.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => reviewKYCDocument(selectedUserForKYC._id, doc.id, 'approved')}
                                      className="text-green-600 hover:text-green-900"
                                      title="Approve Document"
                                    >
                                      <CheckIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt('Enter rejection reason for this document:')
                                        if (reason) reviewKYCDocument(selectedUserForKYC._id, doc.id, 'rejected', reason)
                                      }}
                                      className="text-red-600 hover:text-red-900"
                                      title="Reject Document"
                                    >
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Failed to load KYC profile</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}