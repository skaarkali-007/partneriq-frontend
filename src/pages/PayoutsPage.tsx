import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '../store'

import {
  fetchPayoutRequests,
  fetchPaymentMethods,
  fetchBalance,
} from '../store/slices/commissionSlice'
import { WithdrawalRequestForm } from '../components/payouts/WithdrawalRequestForm'
import { PayoutHistory } from '../components/payouts/PayoutHistory'
import { PaymentMethodManager } from '../components/payouts/PaymentMethodManager'
import { BalanceOverview } from '../components/payouts/BalanceOverview'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'

export const PayoutsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const {
    payoutRequests,
    paymentMethods,
    availableBalance,
    pendingBalance,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.commission)

  const [activeTab, setActiveTab] = useState<'withdraw' | 'history' | 'methods'>('withdraw')

  useEffect(() => {
    dispatch(fetchBalance())
    dispatch(fetchPayoutRequests())
    dispatch(fetchPaymentMethods())
  }, [dispatch])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
            <p className="text-gray-600">Manage withdrawals and payment methods</p>
          </div>
        </div>

        {/* Balance Overview */}
        <BalanceOverview
          availableBalance={availableBalance}
          pendingBalance={pendingBalance}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'withdraw'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Request Withdrawal
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payout History
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'methods'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Methods
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'withdraw' && (
          <WithdrawalRequestForm
            availableBalance={availableBalance}
            paymentMethods={paymentMethods}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'history' && (
          <PayoutHistory
            payoutRequests={payoutRequests}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'methods' && (
          <PaymentMethodManager
            paymentMethods={paymentMethods}
            isLoading={isLoading}
          />
        )}
      </div>
    </DashboardLayout>
  )
}