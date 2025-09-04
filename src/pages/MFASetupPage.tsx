import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import { mfaService } from '../services/mfaService'
import { useAuth } from '../contexts/AuthContext'

export const MFASetupPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isSkipable = location.state?.skipable || false
  
  const [step, setStep] = useState<'intro' | 'setup' | 'verify'>('intro')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  // Check user role and KYC status to determine next step
  const checkKYCStatusAndNavigate = async () => {
    // If user is admin, redirect directly to admin dashboard
    if (user?.role === 'admin') {
      toast.success('Welcome to the admin dashboard!')
      navigate('/admin')
      return
    }
    
    // For marketers, check KYC status
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/kyc/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const kycData = await response.json()
        
        // If KYC is already completed, go to marketer dashboard
        if (kycData.status === 'approved' || kycData.status === 'completed') {
          toast.success('Welcome! Your account is fully verified.')
          navigate('/dashboard')
        } else {
          // If KYC not completed, go to KYC verification
          navigate('/kyc-verification')
        }
      } else {
        // If can't check KYC status, assume KYC needed for marketers
        navigate('/kyc-verification')
      }
    } catch (error) {
      // If error checking KYC status, default to marketer dashboard
      toast.success('Welcome to your dashboard!')
      navigate('/dashboard')
    }
  }

  const handleStartSetup = async () => {
    try {
      setIsLoading(true)
      const response = await mfaService.setupMfa()
      setQrCode(response.qrCode)
      setSecret(response.secret)
      // Set backup codes from setup response
      if (response.backupCodes && response.backupCodes.length > 0) {
        setBackupCodes(response.backupCodes)
      }
      setStep('setup')
    } catch (error: any) {
      console.error('MFA Setup Error:', error)
      if (error.status === 401) {
        toast.error('Please log in to set up MFA')
        navigate('/login')
      } else if (error.status === 404) {
        toast.error('MFA service not available. Please try again later.')
      } else {
        toast.error(error.message || 'Failed to setup MFA')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifySetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }

    try {
      setIsLoading(true)
      await mfaService.verifyMfaSetup(verificationCode)
      
      setStep('verify')
      toast.success('MFA setup completed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    toast.success('MFA setup complete!')
    checkKYCStatusAndNavigate()
  }

  const handleSkip = () => {
    toast('You can set up MFA later from your profile settings.', {
      icon: 'ℹ️',
    })
    checkKYCStatusAndNavigate()
  }

  const renderIntroStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Secure Your Account</h2>
        <p className="mt-2 text-gray-600">
          Set up Multi-Factor Authentication (MFA) to add an extra layer of security to your account.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Why MFA?</strong> MFA protects your account even if your password is compromised. 
              You'll need your phone to access sensitive operations.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleStartSetup}
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : 'Set Up MFA'}
        </button>
        
        {isSkipable && (
          <button
            onClick={handleSkip}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Skip for Now
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {isSkipable 
          ? 'You can set up MFA later, but some operations will require it.'
          : 'MFA is required for your account security.'
        }
      </p>
    </div>
  )

  const renderSetupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
        <p className="mt-2 text-gray-600">
          Use your authenticator app to scan this QR code
        </p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg border">
          {qrCode && <QRCodeSVG value={qrCode} size={200} />}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Manual Entry</h3>
        <p className="text-xs text-gray-600 mb-2">
          If you can't scan the QR code, enter this secret key manually:
        </p>
        <code className="text-xs bg-white px-2 py-1 rounded border font-mono break-all">
          {secret}
        </code>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter verification code from your app
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
            placeholder="000000"
          />
        </div>

        <button
          onClick={handleVerifySetup}
          disabled={isLoading || verificationCode.length !== 6}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify & Complete Setup'}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={() => setStep('intro')}
          className="text-sm text-gray-600 hover:text-gray-500"
        >
          Back
        </button>
      </div>
    </div>
  )

  const renderVerifyStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900">MFA Setup Complete!</h2>
        <p className="mt-2 text-gray-600">
          Your account is now protected with Multi-Factor Authentication.
        </p>
      </div>

      {backupCodes.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg text-left">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Save Your Backup Codes
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p className="mb-2">Store these backup codes in a safe place. You can use them to access your account if you lose your phone:</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-white p-2 rounded border">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center">{code}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleComplete}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Continue to Login
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'intro' && renderIntroStep()}
          {step === 'setup' && renderSetupStep()}
          {step === 'verify' && renderVerifyStep()}
        </div>
      </div>
    </div>
  )
}