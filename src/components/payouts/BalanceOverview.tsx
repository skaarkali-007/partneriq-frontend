import React from 'react'
import { formatCurrency } from '../../utils/formatters'

interface BalanceOverviewProps {
  availableBalance: number
  pendingBalance: number
}

export const BalanceOverview: React.FC<BalanceOverviewProps> = ({
  availableBalance,
  pendingBalance,
}) => {
  // Add safety checks for undefined/null values
  const safeAvailableBalance = typeof availableBalance === 'number' ? availableBalance : 0
  const safePendingBalance = typeof pendingBalance === 'number' ? pendingBalance : 0
  const totalBalance = safeAvailableBalance + safePendingBalance

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Balance */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-blue-200 truncate">Total Balance</dt>
              <dd className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Available Balance */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Available for Withdrawal</dt>
              <dd className="text-lg font-semibold text-gray-900">{formatCurrency(safeAvailableBalance)}</dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs text-gray-500">
            Ready to withdraw • Minimum: $50.00
          </div>
        </div>
      </div>

      {/* Pending Balance */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Pending Clearance</dt>
              <dd className="text-lg font-semibold text-gray-900">{formatCurrency(safePendingBalance)}</dd>
            </dl>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-xs text-gray-500">
            Awaiting clearance period completion
          </div>
        </div>
      </div>
    </div>
  )
}