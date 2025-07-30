import React from 'react'
import { PayoutRequest } from '../../types/api'
import { formatCurrency, formatDate } from '../../utils/formatters'

interface PayoutHistoryProps {
  payoutRequests: PayoutRequest[]
  isLoading: boolean
}

const getStatusBadge = (status: PayoutRequest['status']) => {
  const statusConfig = {
    requested: { color: 'bg-yellow-100 text-yellow-800', label: 'Requested' },
    approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
    processing: { color: 'bg-purple-100 text-purple-800', label: 'Processing' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
  }

  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

const getPaymentMethodDisplay = (paymentMethod?: PayoutRequest['paymentMethod']) => {
  if (!paymentMethod) return 'N/A'

  const accountDetails = paymentMethod.accountDetails || {}

  switch (paymentMethod.methodType) {
    case 'bank_transfer':
      return `Bank Transfer - ${accountDetails.accountHolderName || accountDetails.accountName || 'Bank Account'}`
    case 'paypal':
      return `PayPal - ${accountDetails.paypalEmail || 'PayPal Account'}`
    case 'stripe':
      return `Stripe - ${accountDetails.stripeAccountId || 'Stripe Account'}`
    case 'bitcoin':
      return `Bitcoin - ${accountDetails.walletLabel || 'Bitcoin Wallet'}`
    case 'ethereum':
      return `Ethereum - ${accountDetails.walletLabel || 'Ethereum Wallet'}`
    case 'usdc':
      return `USDC - ${accountDetails.walletLabel || 'USDC Wallet'}`
    case 'usdt':
      return `USDT - ${accountDetails.walletLabel || 'USDT Wallet'}`
    default:
      return paymentMethod.methodType || 'Unknown Payment Method'
  }
}

export const PayoutHistory: React.FC<PayoutHistoryProps> = ({
  payoutRequests,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!Array.isArray(payoutRequests) || payoutRequests.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payout requests</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't made any withdrawal requests yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payout History</h3>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of your withdrawal requests
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payoutRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(request.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getPaymentMethodDisplay(request.paymentMethod)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                  {request.status === 'failed' && request.failureReason && (
                    <div className="text-xs text-red-600 mt-1">
                      {request.failureReason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(request.requestedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.completedAt ? formatDate(request.completedAt) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.transactionId || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Status Definitions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
              Requested
            </span>
            <span className="text-gray-600">Awaiting approval</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              Approved
            </span>
            <span className="text-gray-600">Ready for processing</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
              Processing
            </span>
            <span className="text-gray-600">Payment in progress</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
              Completed
            </span>
            <span className="text-gray-600">Payment sent</span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-2">
              Failed
            </span>
            <span className="text-gray-600">Payment failed</span>
          </div>
        </div>
      </div>
    </div>
  )
}