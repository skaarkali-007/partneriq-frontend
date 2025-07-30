import React from 'react'
import { ReferralStats } from '../../store/slices/dashboardSlice'

interface ReferralStatsCardProps {
  data: ReferralStats | null
}

export const ReferralStatsCard: React.FC<ReferralStatsCardProps> = ({ data }) => {
  const formatPercentage = (rate: number) => {
    if (isNaN(rate) || !isFinite(rate)) {
      return '0.0%'
    }
    return `${(rate * 100).toFixed(1)}%`
  }

  const formatNumber = (num: number) => {
    if (isNaN(num) || !isFinite(num)) {
      return '0'
    }
    return num.toString()
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
            <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Referral Statistics</dt>
              <dd className="text-lg font-medium text-gray-900">{formatNumber(data.totalClicks)} Total Clicks</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Total Clicks</dt>
            <dd className="text-gray-900 font-semibold">{formatNumber(data.totalClicks)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Conversions</dt>
            <dd className="text-gray-900 font-semibold">{formatNumber(data.totalConversions)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="font-medium text-gray-500">Conversion Rate</dt>
            <dd className="text-gray-900 font-semibold">{formatPercentage(data.conversionRate)}</dd>
          </div>
        </div>
      </div>
    </div>
  )
}