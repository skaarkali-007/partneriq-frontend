import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { AppDispatch } from '../../store'
import { addPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '../../store/slices/commissionSlice'
import { PaymentMethod } from '../../types/api'
import toast from 'react-hot-toast'

interface PaymentMethodManagerProps {
  paymentMethods: PaymentMethod[]
  isLoading: boolean
}

const bankTransferSchema = yup.object({
  methodType: yup.string().oneOf(['bank_transfer']).required(),
  accountName: yup.string().required('Account name is required'),
  accountNumber: yup.string().required('Account number is required'),
  routingNumber: yup.string().required('Routing number is required'),
  isDefault: yup.boolean().default(false),
})

const paypalSchema = yup.object({
  methodType: yup.string().oneOf(['paypal']).required(),
  paypalEmail: yup.string().email('Invalid email').required('PayPal email is required'),
  isDefault: yup.boolean().default(false),
})

const cryptoWalletSchema = yup.object({
  methodType: yup.string().oneOf(['bitcoin', 'ethereum', 'usdc', 'usdt']).required(),
  walletAddress: yup.string().required('Wallet address is required').min(26, 'Invalid wallet address'),
  walletLabel: yup.string().optional(),
  network: yup.string().optional(),
  isDefault: yup.boolean().default(false),
})

type BankTransferFormData = {
  methodType: 'bank_transfer'
  accountName: string
  accountNumber: string
  routingNumber: string
  isDefault: boolean
}

type PayPalFormData = {
  methodType: 'paypal'
  paypalEmail: string
  isDefault: boolean
}

type CryptoWalletFormData = {
  methodType: 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'
  walletAddress: string
  walletLabel?: string
  network?: string
  isDefault: boolean
}

export const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  paymentMethods,
  isLoading,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMethodType, setSelectedMethodType] = useState<'bank_transfer' | 'paypal' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'>('bank_transfer')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const bankForm = useForm<BankTransferFormData>({
    resolver: yupResolver(bankTransferSchema),
    defaultValues: {
      methodType: 'bank_transfer',
      isDefault: false,
    },
  })

  const paypalForm = useForm<PayPalFormData>({
    resolver: yupResolver(paypalSchema),
    defaultValues: {
      methodType: 'paypal',
      isDefault: false,
    },
  })

  const cryptoForm = useForm<CryptoWalletFormData>({
    resolver: yupResolver(cryptoWalletSchema),
    defaultValues: {
      methodType: 'bitcoin',
      isDefault: false,
    },
  })

  const onSubmitBankTransfer = async (data: BankTransferFormData) => {
    try {
      setIsSubmitting(true)
      
      if (editingMethod) {
        // Update existing payment method
        await dispatch(updatePaymentMethod({
          id: editingMethod.id,
          data: {
            accountDetails: {
              accountHolderName: data.accountName,
              accountNumber: data.accountNumber,
              routingNumber: data.routingNumber,
            },
            isDefault: data.isDefault,
          }
        })).unwrap()
        
        toast.success('Bank transfer method updated successfully!')
        setEditingMethod(null)
      } else {
        // Add new payment method
        await dispatch(addPaymentMethod({
          methodType: 'bank_transfer',
          accountDetails: {
            accountHolderName: data.accountName,
            accountNumber: data.accountNumber,
            routingNumber: data.routingNumber,
          },
          isDefault: data.isDefault,
        })).unwrap()
        
        toast.success('Bank transfer method added successfully!')
        setShowAddForm(false)
      }
      
      bankForm.reset()
    } catch (error) {
      toast.error(error as string || `Failed to ${editingMethod ? 'update' : 'add'} payment method`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitPayPal = async (data: PayPalFormData) => {
    try {
      setIsSubmitting(true)
      
      if (editingMethod) {
        // Update existing payment method
        await dispatch(updatePaymentMethod({
          id: editingMethod.id,
          data: {
            accountDetails: {
              paypalEmail: data.paypalEmail,
            },
            isDefault: data.isDefault,
          }
        })).unwrap()
        
        toast.success('PayPal method updated successfully!')
        setEditingMethod(null)
      } else {
        // Add new payment method
        await dispatch(addPaymentMethod({
          methodType: 'paypal',
          accountDetails: {
            paypalEmail: data.paypalEmail,
          },
          isDefault: data.isDefault,
        })).unwrap()
        
        toast.success('PayPal method added successfully!')
        setShowAddForm(false)
      }
      
      paypalForm.reset()
    } catch (error) {
      toast.error(error as string || `Failed to ${editingMethod ? 'update' : 'add'} payment method`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmitCryptoWallet = async (data: CryptoWalletFormData) => {
    try {
      setIsSubmitting(true)
      
      if (editingMethod) {
        // Update existing payment method
        await dispatch(updatePaymentMethod({
          id: editingMethod.id,
          data: {
            accountDetails: {
              walletAddress: data.walletAddress,
              walletLabel: data.walletLabel,
              network: data.network,
            },
            isDefault: data.isDefault,
          }
        })).unwrap()
        
        const cryptoName = data.methodType.toUpperCase()
        toast.success(`${cryptoName} wallet updated successfully!`)
        setEditingMethod(null)
      } else {
        // Add new payment method
        await dispatch(addPaymentMethod({
          methodType: data.methodType,
          accountDetails: {
            walletAddress: data.walletAddress,
            walletLabel: data.walletLabel,
            network: data.network,
          },
          isDefault: data.isDefault,
        })).unwrap()
        
        const cryptoName = data.methodType.toUpperCase()
        toast.success(`${cryptoName} wallet added successfully!`)
        setShowAddForm(false)
      }
      
      cryptoForm.reset()
    } catch (error) {
      toast.error(error as string || `Failed to ${editingMethod ? 'update' : 'add'} payment method`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingMethod(method)
    setShowAddForm(false)
    
    // Pre-populate the appropriate form based on method type
    const accountDetails = method.accountDetails || {}
    
    if (method.methodType === 'bank_transfer') {
      bankForm.reset({
        methodType: 'bank_transfer',
        accountName: accountDetails.accountHolderName || '',
        accountNumber: accountDetails.accountNumber || '',
        routingNumber: accountDetails.routingNumber || '',
        isDefault: method.isDefault
      })
    } else if (method.methodType === 'paypal') {
      paypalForm.reset({
        methodType: 'paypal',
        paypalEmail: accountDetails.paypalEmail || '',
        isDefault: method.isDefault
      })
    } else if (['bitcoin', 'ethereum', 'usdc', 'usdt'].includes(method.methodType)) {
      cryptoForm.reset({
        methodType: method.methodType as 'bitcoin' | 'ethereum' | 'usdc' | 'usdt',
        walletAddress: accountDetails.walletAddress || '',
        walletLabel: accountDetails.walletLabel || '',
        network: accountDetails.network || '',
        isDefault: method.isDefault
      })
    }
    
    if (['bank_transfer', 'paypal', 'bitcoin', 'ethereum', 'usdc', 'usdt'].includes(method.methodType)) {
      setSelectedMethodType(method.methodType as 'bank_transfer' | 'paypal' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt')
    }
  }

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (showDeleteConfirm === methodId) {
      try {
        setIsSubmitting(true)
        await dispatch(deletePaymentMethod(methodId)).unwrap()
        toast.success('Payment method deleted successfully!')
        setShowDeleteConfirm(null)
      } catch (error) {
        toast.error(error as string || 'Failed to delete payment method')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setShowDeleteConfirm(methodId)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(null)
  }

  const getPaymentMethodIcon = (methodType: PaymentMethod['methodType']) => {
    switch (methodType) {
      case 'bank_transfer':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )
      case 'paypal':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.926-.79l.04-.207 1.118-7.086.072-.39a.927.927 0 0 1 .926-.79h.584c3.843 0 6.85-1.562 7.73-6.08.368-1.897.174-3.48-.77-4.346z"/>
            </svg>
          </div>
        )
      case 'bitcoin':
        return (
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 font-bold text-lg">₿</span>
          </div>
        )
      case 'ethereum':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 font-bold text-lg">Ξ</span>
          </div>
        )
      case 'usdc':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-bold text-xs">USDC</span>
          </div>
        )
      case 'usdt':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 font-bold text-xs">USDT</span>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        )
    }
  }

  const getPaymentMethodDisplay = (method: PaymentMethod) => {
    // Add safety check for accountDetails
    const accountDetails = method.accountDetails || {}
    
    switch (method.methodType) {
      case 'bank_transfer':
        return {
          title: 'Bank Transfer',
          subtitle: accountDetails.accountName || 'Bank Account',
          details: accountDetails.accountNumber ? `****${accountDetails.accountNumber.slice(-4)}` : '',
        }
      case 'paypal':
        return {
          title: 'PayPal',
          subtitle: accountDetails.paypalEmail || 'PayPal Account',
          details: '',
        }
      case 'bitcoin':
        return {
          title: 'Bitcoin',
          subtitle: accountDetails.walletLabel || 'Bitcoin Wallet',
          details: accountDetails.walletAddress ? `${accountDetails.walletAddress.slice(0, 6)}...${accountDetails.walletAddress.slice(-4)}` : '',
        }
      case 'ethereum':
        return {
          title: 'Ethereum',
          subtitle: accountDetails.walletLabel || 'Ethereum Wallet',
          details: accountDetails.walletAddress ? `${accountDetails.walletAddress.slice(0, 6)}...${accountDetails.walletAddress.slice(-4)}` : '',
        }
      case 'usdc':
        return {
          title: 'USDC',
          subtitle: accountDetails.walletLabel || 'USDC Wallet',
          details: accountDetails.walletAddress ? `${accountDetails.walletAddress.slice(0, 6)}...${accountDetails.walletAddress.slice(-4)}` : '',
        }
      case 'usdt':
        return {
          title: 'USDT',
          subtitle: accountDetails.walletLabel || 'USDT Wallet',
          details: accountDetails.walletAddress ? `${accountDetails.walletAddress.slice(0, 6)}...${accountDetails.walletAddress.slice(-4)}` : '',
        }
      default:
        return {
          title: method.methodType,
          subtitle: '',
          details: '',
        }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Existing Payment Methods */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add New Method
          </button>
        </div>

        {!Array.isArray(paymentMethods) || paymentMethods.length === 0 ? (
          <div className="text-center py-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
            <p className="mt-1 text-sm text-gray-500">Add a payment method to receive withdrawals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => {
              const display = getPaymentMethodDisplay(method)
              return (
                <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    {getPaymentMethodIcon(method.methodType)}
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">{display.title}</h4>
                        {method.isDefault && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                        {method.isVerified ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Verified
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Verification
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{display.subtitle}</p>
                      {display.details && (
                        <p className="text-xs text-gray-400">{display.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEditPaymentMethod(method)}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Edit
                    </button>
                    {showDeleteConfirm === method.id ? (
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={isSubmitting}
                          className="text-xs text-red-600 hover:text-red-500 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button 
                          onClick={cancelDelete}
                          className="text-xs text-gray-600 hover:text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        className="text-sm text-red-600 hover:text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Payment Method Form */}
      {(showAddForm || editingMethod) && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </h3>
            <button
              onClick={() => {
                setShowAddForm(false)
                setEditingMethod(null)
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Method Type Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedMethodType('bank_transfer')}
                className={`p-4 border-2 rounded-lg text-left ${
                  selectedMethodType === 'bank_transfer'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Bank Transfer</h4>
                    <p className="text-xs text-gray-500">Direct deposit</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedMethodType('paypal')}
                className={`p-4 border-2 rounded-lg text-left ${
                  selectedMethodType === 'paypal'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.926-.79l.04-.207 1.118-7.086.072-.39a.927.927 0 0 1 .926-.79h.584c3.843 0 6.85-1.562 7.73-6.08.368-1.897.174-3.48-.77-4.346z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">PayPal</h4>
                    <p className="text-xs text-gray-500">PayPal account</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethodType('bitcoin')}
                className={`p-4 border-2 rounded-lg text-left ${
                  selectedMethodType === 'bitcoin'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-orange-600 font-bold text-lg">₿</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Bitcoin</h4>
                    <p className="text-xs text-gray-500">BTC wallet</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethodType('ethereum')}
                className={`p-4 border-2 rounded-lg text-left ${
                  selectedMethodType === 'ethereum'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold text-lg">Ξ</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Ethereum</h4>
                    <p className="text-xs text-gray-500">ETH wallet</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethodType('usdc')}
                className={`p-4 border-2 rounded-lg text-left ${
                  selectedMethodType === 'usdc'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-xs">USDC</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">USDC</h4>
                    <p className="text-xs text-gray-500">USD Coin</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethodType('usdt')}
                className={`p-4 border-2 rounded-lg text-left ${
                  selectedMethodType === 'usdt'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 font-bold text-xs">USDT</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">USDT</h4>
                    <p className="text-xs text-gray-500">Tether USD</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Bank Transfer Form */}
          {selectedMethodType === 'bank_transfer' && (
            <form onSubmit={bankForm.handleSubmit(onSubmitBankTransfer)} className="space-y-4">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  {...bankForm.register('accountName')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {bankForm.formState.errors.accountName && (
                  <p className="mt-2 text-sm text-red-600">{bankForm.formState.errors.accountName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  type="text"
                  {...bankForm.register('accountNumber')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {bankForm.formState.errors.accountNumber && (
                  <p className="mt-2 text-sm text-red-600">{bankForm.formState.errors.accountNumber.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">
                  Routing Number
                </label>
                <input
                  type="text"
                  {...bankForm.register('routingNumber')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {bankForm.formState.errors.routingNumber && (
                  <p className="mt-2 text-sm text-red-600">{bankForm.formState.errors.routingNumber.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...bankForm.register('isDefault')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default payment method
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingMethod(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (editingMethod ? 'Updating...' : 'Adding...') : (editingMethod ? 'Update Bank Transfer' : 'Add Bank Transfer')}
                </button>
              </div>
            </form>
          )}

          {/* PayPal Form */}
          {selectedMethodType === 'paypal' && (
            <form onSubmit={paypalForm.handleSubmit(onSubmitPayPal)} className="space-y-4">
              <div>
                <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700">
                  PayPal Email Address
                </label>
                <input
                  type="email"
                  {...paypalForm.register('paypalEmail')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {paypalForm.formState.errors.paypalEmail && (
                  <p className="mt-2 text-sm text-red-600">{paypalForm.formState.errors.paypalEmail.message}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...paypalForm.register('isDefault')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default payment method
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingMethod(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (editingMethod ? 'Updating...' : 'Adding...') : (editingMethod ? 'Update PayPal' : 'Add PayPal')}
                </button>
              </div>
            </form>
          )}

          {/* Cryptocurrency Wallet Forms */}
          {['bitcoin', 'ethereum', 'usdc', 'usdt'].includes(selectedMethodType) && (
            <form onSubmit={cryptoForm.handleSubmit(onSubmitCryptoWallet)} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important: Cryptocurrency Wallet Security
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Please ensure you provide a valid {selectedMethodType.toUpperCase()} wallet address that you control. 
                        Double-check the address before submitting as cryptocurrency transactions are irreversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">
                  {selectedMethodType.toUpperCase()} Wallet Address *
                </label>
                <input
                  type="text"
                  {...cryptoForm.register('walletAddress')}
                  placeholder={`Enter your ${selectedMethodType.toUpperCase()} wallet address`}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                />
                {cryptoForm.formState.errors.walletAddress && (
                  <p className="mt-2 text-sm text-red-600">{cryptoForm.formState.errors.walletAddress.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  This should be a valid {selectedMethodType.toUpperCase()} address that you control
                </p>
              </div>

              <div>
                <label htmlFor="walletLabel" className="block text-sm font-medium text-gray-700">
                  Wallet Label (Optional)
                </label>
                <input
                  type="text"
                  {...cryptoForm.register('walletLabel')}
                  placeholder={`My ${selectedMethodType.toUpperCase()} Wallet`}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A friendly name to help you identify this wallet
                </p>
              </div>

              {(selectedMethodType === 'ethereum' || selectedMethodType === 'usdc' || selectedMethodType === 'usdt') && (
                <div>
                  <label htmlFor="network" className="block text-sm font-medium text-gray-700">
                    Network (Optional)
                  </label>
                  <select
                    {...cryptoForm.register('network')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select network (default: Ethereum Mainnet)</option>
                    <option value="ethereum">Ethereum Mainnet</option>
                    <option value="polygon">Polygon</option>
                    <option value="bsc">Binance Smart Chain</option>
                    <option value="arbitrum">Arbitrum</option>
                    <option value="optimism">Optimism</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Specify the blockchain network for this wallet address
                  </p>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...cryptoForm.register('isDefault')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Set as default payment method
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (editingMethod ? 'Updating...' : 'Adding...') : (editingMethod ? `Update ${selectedMethodType.toUpperCase()} Wallet` : `Add ${selectedMethodType.toUpperCase()} Wallet`)}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}