import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { AppDispatch, RootState } from '../store'
import { registerUser, clearError } from '../store/slices/authSlice'
import { sendEmailOTP } from '../services/authService'
import PartnerIQLogo from '../components/common/PartnerIQLogo'


const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
})

type RegisterFormData = yup.InferType<typeof schema>

export const RegisterPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleBasicInfoSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data
      
      // Complete registration immediately with basic info
      const completeRegistrationData = {
        ...registerData,
        role: 'marketer'
      }

      const result = await dispatch(registerUser(completeRegistrationData)).unwrap()
      
      // Check if we're in alpha stage
      const isAlphaStage = import.meta.env.VITE_STAGE === 'alpha'
      
      // Check if email verification is required (backend automatically sends OTP)
      if (result.emailVerificationRequired && !isAlphaStage) {
        toast.success('Registration successful! Please check your email for the 6-digit verification code.')
        navigate('/verify-otp', { state: { email: registerData.email, isNewRegistration: true } })
      } else if (isAlphaStage) {
        // In alpha stage, redirect to MFA setup
        toast.success('Registration successful! Let\'s set up MFA for your account security.')
        navigate('/mfa-setup', { state: { skipable: true } })
      } else {
        // Fallback: manually send OTP if not sent by backend
        try {
          await sendEmailOTP(registerData.email)
          toast.success('Registration successful! Please check your email for the verification code.')
          navigate('/verify-otp', { state: { email: registerData.email, isNewRegistration: true } })
        } catch (error) {
          toast.success('Registration successful! Please check your email for verification.')
          navigate('/login')
        }
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.')
    }
  }



  const renderProgressIndicator = () => (
    <div className="mb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Platform</h1>
        <p className="text-gray-600">
          Create your marketer account and start earning commissions today
        </p>
      </div>
    </div>
  )

  const renderBasicInfoStep = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Marketer Account</h2>
        <p className="text-gray-600 mb-4">
          {import.meta.env.VITE_STAGE === 'alpha' 
            ? 'Create your account to get started. Your account will be activated immediately, then we\'ll help you set up MFA for security (alpha stage).'
            : 'Create your account to get started. After registration, you\'ll need to verify your email address to activate your account.'
          }
        </p>
        
        {/* Registration Steps */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Registration Process:</h3>
          {import.meta.env.VITE_STAGE === 'alpha' ? (
            <ol className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Fill out your basic information
              </li>
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Set up MFA for enhanced security (recommended)
              </li>
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                Start earning commissions! (Alpha stage - email verification skipped)
              </li>
            </ol>
          ) : (
            <ol className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Fill out your basic information
              </li>
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Verify your email with the 6-digit code we'll send
              </li>
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                Set up MFA for enhanced security (optional but recommended)
              </li>
              <li className="flex items-center">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">4</span>
                Start earning commissions!
              </li>
            </ol>
          )}
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(handleBasicInfoSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              {...register('firstName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="First name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              {...register('lastName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Last name"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="relative">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.828 14.828L16.243 16.243" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="relative">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.828 14.828L16.243 16.243" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="flex justify-center hover:opacity-80 transition-opacity">
            <PartnerIQLogo size="lg" clickable={false} />
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {renderBasicInfoStep()}
        </div>
      </div>
    </div>
  )
}