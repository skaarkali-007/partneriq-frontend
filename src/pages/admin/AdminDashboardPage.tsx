import React, { useEffect, useState } from 'react'
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

interface DashboardStats {
  users: {
    pending: number
    active: number
    suspended: number
    revoked: number
  }
  commissions: {
    pending: { count: number; amount: number }
    approved: { count: number; amount: number }
    paid: { count: number; amount: number }
    clawed_back: { count: number; amount: number }
  }
  payouts: {
    requested: { count: number; amount: number }
    approved: { count: number; amount: number }
    processing: { count: number; amount: number }
    completed: { count: number; amount: number }
    failed: { count: number; amount: number }
  }
  products: {
    active: number
    inactive: number
  }
}

const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<any>
  color: string
}> = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-md ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
)

export const AdminDashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Current user:', user) // Debug log
      if (user.role === 'admin') {
        if (user.status === 'active') {
          fetchDashboardStats()
        } else {
          setError(`Admin account status is '${user.status}'. Must be 'active' to access admin features.`)
          setLoading(false)
        }
      } else {
        setError(`User role is '${user.role}'. Must be 'admin' to access admin features.`)
        setLoading(false)
      }
    } else if (!isAuthenticated) {
      setError('Not authenticated')
      setLoading(false)
    }
  }, [isAuthenticated, user])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats')
      setStats(response.data.data || response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
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
        <p className="text-red-800">Error loading dashboard: {error}</p>
      </div>
    )
  }

  if (!stats) return null

  const totalUsers = stats.users.pending + stats.users.active + stats.users.suspended + stats.users.revoked
  const totalCommissionAmount = stats.commissions.pending.amount + stats.commissions.approved.amount + stats.commissions.paid.amount
  const totalPayoutAmount = stats.payouts.completed.amount + stats.payouts.processing.amount + stats.payouts.requested.amount
  const totalProducts = stats.products.active + stats.products.inactive

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of platform performance and key metrics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtitle={`${stats.users.active} active`}
          icon={UsersIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Commissions"
          value={formatCurrency(totalCommissionAmount)}
          subtitle={`${stats.commissions.paid.count} paid`}
          icon={CurrencyDollarIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Total Payouts"
          value={formatCurrency(totalPayoutAmount)}
          subtitle={`${stats.payouts.completed.count} completed`}
          icon={DocumentTextIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Products"
          value={totalProducts}
          subtitle={`${stats.products.active} active`}
          icon={CubeIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Approval</span>
              <span className="text-sm font-medium text-yellow-600">{stats.users.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active</span>
              <span className="text-sm font-medium text-green-600">{stats.users.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Suspended</span>
              <span className="text-sm font-medium text-red-600">{stats.users.suspended}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revoked</span>
              <span className="text-sm font-medium text-gray-600">{stats.users.revoked}</span>
            </div>
          </div>
        </div>

        {/* Commission Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="text-right">
                <span className="text-sm font-medium text-yellow-600">
                  {formatCurrency(stats.commissions.pending.amount)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({stats.commissions.pending.count})
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <div className="text-right">
                <span className="text-sm font-medium text-blue-600">
                  {formatCurrency(stats.commissions.approved.amount)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({stats.commissions.approved.count})
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paid</span>
              <div className="text-right">
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(stats.commissions.paid.amount)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({stats.commissions.paid.count})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Activity logging system will be implemented in future updates</p>
        </div>
      </div>
    </div>
  )
}