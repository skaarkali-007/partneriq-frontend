import React, { useEffect, useState } from 'react'
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

import api from "../../services/api"
import { AlertModal } from '../../components/ui/AlertModal'
import { useAlertModal } from '../../hooks/useAlertModal'

interface AuditLog {
  _id: string
  adminId: {
    _id: string
    email: string
    firstName: string
    lastName: string
  }
  action: string
  resource: string
  resourceId?: string
  details: {
    oldValue?: any
    newValue?: any
    reason?: string
    metadata?: any
  }
  ipAddress?: string
  userAgent?: string
  timestamp: string
  createdAt: string
}

interface ActivityLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const ActionIcon: React.FC<{ action: string }> = ({ action }) => {
  const getIconAndColor = (action: string) => {
    if (action.includes('status_changed') || action.includes('bulk_action')) {
      return { icon: UserIcon, color: 'text-blue-600' }
    }
    if (action.includes('created') || action.includes('approved')) {
      return { icon: CheckCircleIcon, color: 'text-green-600' }
    }
    if (action.includes('deleted') || action.includes('rejected') || action.includes('clawback')) {
      return { icon: ExclamationCircleIcon, color: 'text-red-600' }
    }
    return { icon: InformationCircleIcon, color: 'text-gray-600' }
  }

  const { icon: Icon, color } = getIconAndColor(action)
  return <Icon className={`w-5 h-5 ${color}`} />
}

const formatAction = (action: string) => {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return 'Just now'
  }
}

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const alertModal = useAlertModal()
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
    adminId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    fetchActivityLogs()
  }, [filters])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })

      const response = await api.get(`/admin/activity-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.data || !response.data.data) {
        throw new Error('Failed to fetch activity logs')
      }

      const data: { data: ActivityLogsResponse } = response.data || response.data.data
      setLogs(data.data.logs)
      setPagination(data.data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page' && key !== 'limit') {
          queryParams.append(key, value.toString())
        }
      })

      const response = await api.get(`/admin/activity-logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: "blob"
      })

      if (!response.data || !response.data.data) {
        throw new Error('Failed to export logs')
      }

      const blob = response.data || response.data.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alertModal.showAlert({
        title: 'Export Failed',
        message: `Export failed: ${err.message}`,
        type: 'error'
      })
    }
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
        <p className="text-red-800">Error loading activity logs: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Monitor admin actions and system activities</p>
        </div>
        <button
          onClick={exportLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search actions..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
            >
              <option value="">All Actions</option>
              <option value="user_status_changed">User Status Changed</option>
              <option value="user_bulk_action">User Bulk Action</option>
              <option value="product_created">Product Created</option>
              <option value="product_updated">Product Updated</option>
              <option value="commission_approved">Commission Approved</option>
              <option value="payout_approved">Payout Approved</option>
              <option value="admin_login">Admin Login</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resource</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.resource}
              onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value, page: 1 }))}
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="product">Product</option>
              <option value="commission">Commission</option>
              <option value="payout">Payout</option>
              <option value="system">System</option>
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
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ 
              search: '', action: '', resource: '', adminId: '', 
              startDate: '', endDate: '', page: 1, limit: 50 
            })}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {logs.map((log) => (
            <div 
              key={log._id} 
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <ActionIcon action={log.action} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {log.adminId.firstName} {log.adminId.lastName} ({log.adminId.email})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Resource: <span className="font-medium capitalize">{log.resource}</span>
                      {log.resourceId && (
                        <span className="ml-2 text-gray-400">ID: {log.resourceId.slice(-8)}</span>
                      )}
                    </p>
                    
                    {log.details.reason && (
                      <p className="text-sm text-gray-600 mt-1">
                        Reason: <span className="italic">{log.details.reason}</span>
                      </p>
                    )}
                    
                    {log.ipAddress && (
                      <p className="text-xs text-gray-400 mt-1">
                        IP: {log.ipAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No activity logs found matching your criteria</p>
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

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Activity Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="text-sm text-gray-900">{formatAction(selectedLog.action)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin</label>
                  <p className="text-sm text-gray-900">
                    {selectedLog.adminId.firstName} {selectedLog.adminId.lastName} ({selectedLog.adminId.email})
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resource</label>
                  <p className="text-sm text-gray-900 capitalize">
                    {selectedLog.resource}
                    {selectedLog.resourceId && ` (ID: ${selectedLog.resourceId})`}
                  </p>
                </div>
                
                {selectedLog.details.reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="text-sm text-gray-900">{selectedLog.details.reason}</p>
                  </div>
                )}
                
                {(selectedLog.details.oldValue || selectedLog.details.newValue) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Changes</label>
                    <div className="bg-gray-50 rounded-md p-3 text-sm">
                      {selectedLog.details.oldValue && (
                        <div className="mb-2">
                          <span className="font-medium text-red-600">Before:</span>
                          <pre className="text-xs mt-1">{JSON.stringify(selectedLog.details.oldValue, null, 2)}</pre>
                        </div>
                      )}
                      {selectedLog.details.newValue && (
                        <div>
                          <span className="font-medium text-green-600">After:</span>
                          <pre className="text-xs mt-1">{JSON.stringify(selectedLog.details.newValue, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Agent</label>
                    <p className="text-sm text-gray-900 truncate" title={selectedLog.userAgent}>
                      {selectedLog.userAgent || 'Unknown'}
                    </p>
                  </div>
                </div>
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
    </div>
  )
}