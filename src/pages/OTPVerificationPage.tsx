import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { sendEmailOTP, verifyEmailOTP } from '../services/authService'
import { toast } from 'react-hot-toast'

export const OTPVerificationPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email) {
      toast.error('Email not found. Please register again.')
      navigate('/register')
      return
    }

    // Auto-focus first input
    inputRefs.current[0]?.focus()

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, navigate])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    
    setOtp(newOtp)
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerifyOTP = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    try {
      setIsVerifying(true)
      await verifyEmailOTP(email, otpString)
      toast.success('Email verified successfully!')
      
      // Check if this is a new registration
      const isNewRegistration = location.state?.isNewRegistration
      if (isNewRegistration) {
        // For new registrations, redirect to login with a message about MFA
        toast.success('Please log in to continue with MFA setup.')
        navigate('/login', { state: { emailVerified: true, showMFASetup: true } })
      } else {
        navigate('/login')
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired OTP')
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      setIsResending(true)
      await sendEmailOTP(email)
      toast.success('New OTP sent to your email')
      setTimeLeft(600) // Reset timer
      setOtp(['', '', '', '', '', '']) // Clear current OTP
      inputRefs.current[0]?.focus()
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="font-semibold text-gray-900">{email}</p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter verification code
              </label>
              <div className="flex justify-center space-x-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-600">
                  Code expires in <span className="font-semibold text-red-600">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-semibold">
                  Code has expired. Please request a new one.
                </p>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOTP}
              disabled={isVerifying || otp.join('').length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={isResending || timeLeft > 0}
                className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 'Resend verification code'}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-500">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}