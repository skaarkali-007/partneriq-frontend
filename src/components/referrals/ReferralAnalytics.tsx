import React, { useMemo } from 'react'
import { CustomerReferral, ReferralLink } from '../../types/api'

interface ReferralAnalyticsProps {
  referrals: CustomerReferral[]
  referralLinks: ReferralLink[]
}

export const ReferralAnalytics: React.FC<ReferralAnalyticsProps> = ({
  referrals,
  referralLinks,
}) => {
  const analytics = useMemo(() => {
    const totalReferrals = referrals.length
    const convertedReferrals = referrals.filter(r => r.status === 'converted').length
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length
    const onboardingReferrals = referrals.filter(r => r.status === 'onboarding').length
    const rejectedReferrals = referrals.filter(r => r.status === 'rejected').length
    
    const totalSpend = referrals
      .filter(r => r.initialSpend)
      .reduce((sum, r) => sum + (r.initialSpend || 0), 0)
    
    const totalCommissions = referrals
      .filter(r => r.commissionAmount)
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)
    
    const pendingCommissions = referrals
      .filter(r => r.commissionAmount && r.commissionStatus === 'pending')
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)
    
    const approvedCommissions = referrals
      .filter(r => r.commissionAmount && r.commissionStatus === 'approved')
      .reduce((sum, r) => sum + (r.commissionAmount || 0), 0)
    
    const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0
    const averageSpend = convertedReferrals > 0 ? totalSpend / convertedReferrals : 0
    
    // Link performance
    const totalClicks = referralLinks.reduce((sum, link) => sum + (link.clickCount || 0), 0)
    const totalLinkConversions = referralLinks.reduce((sum, link) => sum + (link.conversionCount || 0), 0)
    const clickToConversionRate = totalClicks > 0 ? (totalLinkConversions / totalClicks) * 100 : 0
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentReferrals = referrals.filter(r => new Date(r.referredAt) >= sevenDaysAgo).length
    const recentConversions = referrals.filter(r => 
      r.convertedAt && new Date(r.convertedAt) >= sevenDaysAgo
    ).length
    
    return {
      totalReferrals,
      convertedReferrals,
      pendingReferrals,
      onboardingReferrals,
      rejectedReferrals,
      totalSpend,
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      conversionRate,
      averageSpend,
      totalClicks,
      clickToConversionRate,
      recentReferrals,
      recentConversions,
    }
  }, [referrals, referralLinks])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          Performance Analytics
        </h3>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Referrals */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Referrals</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalReferrals}</p>
                <p className="text-xs text-blue-600">
                  {analytics.recentReferrals} in last 7 days
                </p>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatPercentage(analytics.conversionRate)}
                </p>
                <p className="text-xs text-green-600">
                  {analytics.convertedReferrals} conversions
                </p>
              </div>
            </div>
          </div>

          {/* Total Commissions */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Commissions</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(analytics.totalCommissions)}
                </p>
                <p className="text-xs text-purple-600">
                  {formatCurrency(analytics.pendingCommissions)} pending
                </p>
              </div>
            </div>
          </div>

          {/* Average Spend */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Average Spend</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(analytics.averageSpend)}
                </p>
                <p className="text-xs text-orange-600">
                  per conversion
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Referral Status Distribution */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Referral Status Distribution</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Converted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.convertedReferrals}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({formatPercentage(analytics.totalReferrals > 0 ? (analytics.convertedReferrals / analytics.totalReferrals) * 100 : 0)})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Onboarding</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.onboardingReferrals}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({formatPercentage(analytics.totalReferrals > 0 ? (analytics.onboardingReferrals / analytics.totalReferrals) * 100 : 0)})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.pendingReferrals}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({formatPercentage(analytics.totalReferrals > 0 ? (analytics.pendingReferrals / analytics.totalReferrals) * 100 : 0)})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-700">Rejected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.rejectedReferrals}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({formatPercentage(analytics.totalReferrals > 0 ? (analytics.rejectedReferrals / analytics.totalReferrals) * 100 : 0)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Commission Status */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Commission Breakdown</h4>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Earned</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(analytics.totalCommissions)}
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-yellow-700">Pending</span>
                  <span className="text-lg font-bold text-yellow-900">
                    {formatCurrency(analytics.pendingCommissions)}
                  </span>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-700">Approved</span>
                  <span className="text-lg font-bold text-green-900">
                    {formatCurrency(analytics.approvedCommissions)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Link Performance */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Link Performance</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.totalClicks}</p>
              <p className="text-sm text-gray-600">Total Clicks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatPercentage(analytics.clickToConversionRate)}
              </p>
              <p className="text-sm text-gray-600">Click-to-Conversion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics.recentConversions}</p>
              <p className="text-sm text-gray-600">Recent Conversions (7d)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}