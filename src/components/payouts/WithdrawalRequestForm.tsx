import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { AppDispatch } from '../../store'
import { createPayoutRequest, fetchBalance, fetchPayoutRequests } from '../../store/slices/commissionSlice'
import { PaymentMethod } from '../../types/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface WithdrawalRequestFormProps {
  availableBalance: number
  paymentMethods: PaymentMethod[]
  isLoading: boolean
}

const createSchema = (availableBalance: number) => yup.object({
  amount: yup
    .number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .test('min-amount', 'Minimum withdrawal amount is $50', value => (value || 0) >= 50)
    .test('max-amount', `Amount exceeds available balance of $${availableBalance.toFixed(2)}`, value => (value || 0) <= availableBalance),
  paymentMethodId: yup.string().required('Please select a payment method'),
})

type WithdrawalFormData = {
  amount: number
  paymentMethodId: string
}

export const WithdrawalRequestForm: React.FC<WithdrawalRequestFormProps> = ({
  availableBalance,
  paymentMethods,
  isLoading,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<WithdrawalFormData>({
    resolver: yupResolver(createSchema(availableBalance)),
    defaultValues: {
      amount: 0,
      paymentMethodId: '',
    },
  })

  const watchedAmount = watch('amount')

  const onSubmit = async (data: WithdrawalFormData) => {
    try {
      setIsSubmitting(true)
      await dispatch(createPayoutRequest({
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
      })).unwrap()
      
      // Refresh balance and payout requests after successful submission
      dispatch(fetchBalance())
      dispatch(fetchPayoutRequests())
      
      toast.success('Withdrawal request submitted successfully!')
      reset()
    } catch (error) {
      console.error('Withdrawal request error:', error)
      toast.error(error as string || 'Failed to submit withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMaxAmount = () => {
    setValue('amount', availableBalance)
  }

  const availablePaymentMethods = Array.isArray(paymentMethods) 
    ? paymentMethods
    : []

  if (availablePaymentMethods.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No verified payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to add and verify a payment method before requesting withdrawals.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Payment Method
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Request Withdrawal</h3>
        <p className="mt-1 text-sm text-gray-500">
          Available balance: <span className="font-medium text-green-600">{formatCurrency(availableBalance)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Withdrawal Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="50"
              max={availableBalance}
              {...register('amount')}
              className={`block w-full pl-7 pr-20 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="button"
                onClick={handleMaxAmount}
                className="mr-3 text-sm text-blue-600 hover:text-blue-500"
              >
                Max
              </button>
            </div>
          </div>
          {errors.amount && (
            <p className="mt-2 text-sm text-red-600">{errors.amount.message}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Minimum withdrawal amount is $50.00
          </p>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label htmlFor="paymentMethodId" className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            {...register('paymentMethodId')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.paymentMethodId ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a payment method</option>
            
            {/* Payment methods */}
            {availablePaymentMethods.map((method) => {
              const accountDetails = method.accountDetails || {}
              let displayText = ''
              
              switch (method.methodType) {
                case 'bank_transfer':
                  displayText = `🏦 Bank Transfer - ${accountDetails.accountName || 'Bank Account'}`
                  break
                case 'paypal':
                  displayText = `💳 PayPal - ${accountDetails.paypalEmail || 'PayPal Account'}`
                  break
                case 'stripe':
                  displayText = `💰 Stripe - ${accountDetails.stripeAccountId || 'Stripe Account'}`
                  break
                case 'bitcoin':
                  displayText = `₿ Bitcoin - ${accountDetails.walletLabel || 'Bitcoin Wallet'}`
                  break
                case 'ethereum':
                  displayText = `Ξ Ethereum - ${accountDetails.walletLabel || 'Ethereum Wallet'}`
                  break
                case 'usdc':
                  displayText = `💵 USDC - ${accountDetails.walletLabel || 'USDC Wallet'}`
                  break
                case 'usdt':
                  displayText = `💵 USDT - ${accountDetails.walletLabel || 'USDT Wallet'}`
                  break
                default:
                  displayText = `${method.methodType} - Payment Method`
              }
              
              return (
                <option key={method.id} value={method.id}>
                  {displayText}{method.isDefault ? ' (Default)' : ''}
                </option>
              )
            })}
          </select>
          {errors.paymentMethodId && (
            <p className="mt-2 text-sm text-red-600">{errors.paymentMethodId.message}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Select your preferred payment method for withdrawal.
          </p>
        </div>

        {/* Processing Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Processing Information</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Withdrawal requests are processed within 5 business days</li>
                  <li>You will receive an email confirmation once processed</li>
                  <li>Processing fees may apply depending on your payment method</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {watchedAmount && watchedAmount > 0 && (
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Withdrawal Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Withdrawal Amount:</span>
                <span className="font-medium">{formatCurrency(watchedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">You will receive:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(watchedAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isLoading || availableBalance < 50}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Submit Withdrawal Request'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}