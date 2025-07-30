import React from 'react'

export interface PerformanceData {
  month: string
  commissions: number
  referrals: number
}

interface PerformanceChartProps {
  data?: PerformanceData[]
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  // Fallback data if no real data is provided
  const fallbackData = [
    { month: 'Jan', commissions: 0, referrals: 0 },
    { month: 'Feb', commissions: 0, referrals: 0 },
    { month: 'Mar', commissions: 0, referrals: 0 },
    { month: 'Apr', commissions: 0, referrals: 0 },
    { month: 'May', commissions: 0, referrals: 0 },
    { month: 'Jun', commissions: 0, referrals: 0 },
  ]

  const chartData = data && data.length > 0 ? data : fallbackData

  const maxCommissions = Math.max(...chartData.map(d => d.commissions), 1) // Ensure minimum of 1 to avoid division by zero
  const maxReferrals = Math.max(...chartData.map(d => d.referrals), 1)

  const totalCommissions = chartData.reduce((sum, d) => sum + d.commissions, 0)
  const totalReferrals = chartData.reduce((sum, d) => sum + d.referrals, 0)
  const avgMonthlyCommissions = chartData.length > 0 ? Math.round(totalCommissions / chartData.length) : 0
  const growthRate = chartData.length > 1 && chartData[0].commissions > 0 
    ? ((chartData[chartData.length - 1].commissions - chartData[0].commissions) / chartData[0].commissions * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Chart Legend */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Commissions ($)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Referrals</span>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="grid grid-cols-6 gap-4 h-64">
        {chartData.map((dataPoint, index) => (
          <div key={index} className="flex flex-col items-center justify-end space-y-2">
            {/* Commission Bar */}
            <div className="w-full flex flex-col items-center justify-end h-full space-y-1">
              <div
                className="w-6 bg-blue-500 rounded-t"
                style={{
                  height: `${(dataPoint.commissions / maxCommissions) * 80}%`,
                  minHeight: '4px',
                }}
                title={`$${dataPoint.commissions}`}
              ></div>
              {/* Referral Bar */}
              <div
                className="w-6 bg-green-500 rounded-t"
                style={{
                  height: `${(dataPoint.referrals / maxReferrals) * 60}%`,
                  minHeight: '4px',
                }}
                title={`${dataPoint.referrals} referrals`}
              ></div>
            </div>
            {/* Month Label */}
            <span className="text-xs text-gray-500 font-medium">{dataPoint.month}</span>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${totalCommissions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Commissions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalReferrals}
          </div>
          <div className="text-sm text-gray-500">Total Referrals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            ${avgMonthlyCommissions.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Avg Monthly</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {growthRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Growth Rate</div>
        </div>
      </div>
    </div>
  )
}