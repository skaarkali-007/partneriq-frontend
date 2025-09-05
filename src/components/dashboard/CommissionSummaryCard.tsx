import React from 'react'
import { CommissionSummary } from '../../store/slices/dashboardSlice'

interface CommissionSummaryCardProps {
  data: CommissionSummary | null
}

export const CommissionSummaryCard: React.FC<CommissionSummaryCardProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  if (!data) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
              <dd className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalEarnings)}</dd>
              <dd className="text-sm text-gray-500">{data.totalCommissions || 0} total commissions</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Paid</dt>
            <dd className="text-green-600 font-semibold">{formatCurrency(data.paidCommissions || 0)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Approved</dt>
            <dd className="text-blue-600 font-semibold">{formatCurrency(data.approvedCommissions || 0)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Pending</dt>
            <dd className="text-yellow-600 font-semibold">{formatCurrency(data.pendingCommissions)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Clawed Back</dt>
            <dd className="text-red-600 font-semibold">{formatCurrency(data.clawedBackAmount || 0)}</dd>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-500">This Month</dt>
              <dd className="text-gray-900 font-semibold">{formatCurrency(data.thisMonthEarnings)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Conversion Rate</dt>
              <dd className="text-gray-900 font-semibold">{formatPercentage(data.conversionRate / 100)}</dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}