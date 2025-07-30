import React from 'react'
import { CommissionAnalytics as AnalyticsData } from '../../store/slices/commissionSlice'
import { formatCurrency } from '../../utils/formatters'

interface CommissionAnalyticsProps {
  analytics: AnalyticsData | null
  isLoading: boolean
}

export const CommissionAnalytics: React.FC<CommissionAnalyticsProps> = ({
  analytics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data available</h3>
          <p className="mt-1 text-sm text-gray-500">Analytics will appear once you have commission data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Commissions</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(analytics?.totalCommissions || 0)}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics?.conversionMetrics?.totalCustomers || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                <dd className="text-lg font-medium text-gray-900">{((analytics?.conversionMetrics?.conversionRate || 0) * 100).toFixed(2)}%</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Commission</dt>
                <dd className="text-lg font-medium text-gray-900">{formatCurrency(analytics?.conversionMetrics?.averageCommissionAmount || 0)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analytics?.statusBreakdown?.pending || 0}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics?.statusBreakdown?.approved || 0}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics?.statusBreakdown?.paid || 0}</div>
            <div className="text-sm text-gray-500">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analytics?.statusBreakdown?.clawed_back || 0}</div>
            <div className="text-sm text-gray-500">Clawed Back</div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Commission Trend</h3>
        <div className="space-y-4">
          {(analytics?.monthlyTrend || []).map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <span className="text-gray-500">{formatCurrency(month.amount)} ({month.count} commissions)</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((month.amount / Math.max(...(analytics?.monthlyTrend || []).map(m => m.amount))) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Products</h3>
        <div className="space-y-4">
          {(analytics?.topProducts || []).map((product, index) => (
            <div key={product.productId} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                  <div className="text-sm text-gray-500">{product.count} commissions</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatCurrency(product.totalCommissions)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}