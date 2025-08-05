import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { AppDispatch, RootState } from '../../store'
import { loginUser, clearError } from '../../store/slices/authSlice'
import { 
  ShieldCheckIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  mfaCode: yup.string().when('requiresMfa', {
    is: true,
    then: (schema) => schema.required('MFA code is required').length(6, 'MFA code must be 6 digits'),
    otherwise: (schema) => schema.notRequired()
  })
})

type AdminLoginFormData = yup.InferType<typeof schema>

export const AdminLoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoading, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  
  const [showPassword, setShowPassword] = useState(false)
  const [requiresMfa, setRequiresMfa] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null)
  const [sessionInfo, setSessionInfo] = useState({
    ipAddress: '',
    userAgent: '',
    timestamp: new Date()
  })

  const from = location.state?.from?.pathname || '/admin'
  const maxAttempts = 3
  const lockoutDuration = 15 * 60 * 1000 // 15 minutes

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<AdminLoginFormData>({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    // Get session info
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setSessionInfo(prev => ({
          ...prev,
          ipAddress: data.ip,
          userAgent: navigator.userAgent
        }))
      })
      .catch(() => {
        setSessionInfo(prev => ({
          ...prev,
          ipAddress: 'Unknown'
        }))
      })

    // Check for existing lockout
    const lockoutData = localStorage.getItem('adminLoginLockout')
    if (lockoutData) {
      const lockout = JSON.parse(lockoutData)
      const lockoutEnd = new Date(lockout.until)
      if (new Date() < lockoutEnd) {
        setIsLocked(true)
        setLockoutTime(lockoutEnd)
        setLoginAttempts(lockout.attempts)
      } else {
        localStorage.removeItem('adminLoginLockout')
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      // Clear any lockout on successful login
      localStorage.removeItem('adminLoginLockout')
      navigate(from, { replace: true })
    } else if (isAuthenticated && user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      dispatch(clearError())
    }
  }, [isAuthenticated, user, navigate, from, dispatch])

  useEffect(() => {
    if (error) {
      const attempts = loginAttempts + 1
      setLoginAttempts(attempts)
      
      if (attempts >= maxAttempts) {
        const lockoutUntil = new Date(Date.now() + lockoutDuration)
        setIsLocked(true)
        setLockoutTime(lockoutUntil)
        localStorage.setItem('adminLoginLockout', JSON.stringify({
          attempts,
          until: lockoutUntil.toISOString()
        }))
        toast.error(`Too many failed attempts. Account locked for 15 minutes.`)
      } else {
        toast.error(`${error} (${maxAttempts - attempts} attempts remaining)`)
      }
      
      dispatch(clearError())
    }
  }, [error, dispatch, loginAttempts])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLocked && lockoutTime) {
      interval = setInterval(() => {
        if (new Date() >= lockoutTime) {
          setIsLocked(false)
          setLockoutTime(null)
          setLoginAttempts(0)
          localStorage.removeItem('adminLoginLockout')
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLocked, lockoutTime])

  const onSubmit = async (data: AdminLoginFormData) => {
    if (isLocked) {
      toast.error('Account is locked. Please wait before trying again.')
      return
    }

    try {
      const result = await dispatch(loginUser({
        email: data.email,
        password: data.password,
        mfaCode: data.mfaCode
      })).unwrap()

      if (result.requiresMfa && !data.mfaCode) {
        setRequiresMfa(true)
        toast('Please enter your MFA code to continue', { icon: 'ℹ️' })
        return
      }

      if (result.user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.')
        return
      }

      // Log successful admin login
      try {
        await fetch('/api/v1/admin/login-log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.tokens.accessToken}`
          },
          body: JSON.stringify({
            ipAddress: sessionInfo.ipAddress,
            userAgent: sessionInfo.userAgent,
            timestamp: new Date().toISOString()
          })
        })
      } catch (logError) {
        console.warn('Failed to log admin login:', logError)
      }

      toast.success('Admin login successful!')
      navigate(from, { replace: true })
    } catch (error: any) {
      if (error.message?.includes('MFA')) {
        setRequiresMfa(true)
        setError('mfaCode', { message: error.message })
      }
    }
  }

  const getRemainingLockoutTime = () => {
    if (!lockoutTime) return ''
    const remaining = Math.ceil((lockoutTime.getTime() - Date.now()) / 1000)
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2">
            Admin Portal
          </h2>
          <p className="text-blue-200">
            Secure access for administrators only
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Security Notice</p>
              <p>This is a restricted area. All access attempts are logged and monitored.</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                disabled={isLocked}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLocked}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  disabled={isLocked}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            {/* MFA Code Field */}
            {requiresMfa && (
              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium text-white mb-2">
                  MFA Code
                </label>
                <input
                  {...register('mfaCode')}
                  type="text"
                  maxLength={6}
                  disabled={isLocked}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-center text-lg tracking-widest"
                  placeholder="000000"
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, '')
                    clearErrors('mfaCode')
                  }}
                />
                {errors.mfaCode && (
                  <p className="mt-2 text-sm text-red-300">{errors.mfaCode.message}</p>
                )}
                <p className="mt-2 text-sm text-blue-200">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Lockout Warning */}
            {isLocked && (
              <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
                <div className="flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-red-400 mr-3" />
                  <div className="text-sm text-red-200">
                    <p className="font-medium">Account Locked</p>
                    <p>Too many failed attempts. Try again in {getRemainingLockoutTime()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && loginAttempts < maxAttempts && !isLocked && (
              <div className="bg-orange-900/50 border border-orange-600 rounded-lg p-3">
                <p className="text-sm text-orange-200">
                  {maxAttempts - loginAttempts} login attempts remaining
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                'Sign In to Admin Portal'
              )}
            </button>
          </form>

          {/* Session Info */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center text-xs text-white/60">
              <ComputerDesktopIcon className="h-4 w-4 mr-2" />
              <div>
                <p>IP: {sessionInfo.ipAddress}</p>
                <p>Session: {sessionInfo.timestamp.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Back to Regular Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
            >
              ← Back to regular login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-white/60">
          <p>© 2024 Partner IQ. All rights reserved.</p>
          <p className="mt-1">Unauthorized access is prohibited and will be prosecuted.</p>
        </div>
      </div>
    </div>
  )
}