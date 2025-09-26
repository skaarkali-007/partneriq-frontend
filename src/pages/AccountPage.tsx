import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import toast from 'react-hot-toast'
import api from '../services/api'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

interface KYCStatus {
  status: 'pending' | 'approved' | 'rejected' | 'not_submitted'
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export const AccountPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'security' | 'preferences'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Profile state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  })

  // KYC state
  const [kycStatus, setKycStatus] = useState<KYCStatus>({
    status: 'not_submitted'
  })

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch user profile data including KYC status
      const response = await api.get('/profile')

      if (response.data && response.data.success && response.data.data) {
        const profile = response.data.data
        
        // Update profile data
        setProfileData(prev => ({
          ...prev,
          firstName: profile.firstName || prev.firstName,
          lastName: profile.lastName || prev.lastName,
          phoneNumber: profile.phone || '',
          address: profile.address ? {
            street: profile.address.street || '',
            city: profile.address.city || '',
            state: profile.address.state || '',
            zipCode: profile.address.postalCode || '',
            country: profile.address.country || 'US'
          } : prev.address
        }))
        
        // Update KYC status
        setKycStatus({
          status: profile.kycStatus === 'pending' ? 'not_submitted' : 
                 profile.kycStatus === 'in_review' ? 'pending' :
                 profile.kycStatus === 'approved' ? 'approved' : 
                 profile.kycStatus === 'rejected' ? 'rejected' : 'not_submitted',
          submittedAt: profile.kycSubmittedAt,
          reviewedAt: profile.kycApprovedAt || profile.kycRejectedAt,
          rejectionReason: profile.kycRejectionReason
        })
      }
    } catch (error: any) {
      // Handle 404 error gracefully - profile doesn't exist yet
      if (error.response?.status === 404) {
        console.log('Profile not found - user may need to complete onboarding')
        // Keep default values for new users
      } else {
        console.error('Failed to load account data:', error)
        // Only show error toast for non-404 errors
        if (error.response?.status !== 404) {
          toast.error('Failed to load account information')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setIsSaving(true)
      
      // Prepare profile data for update
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phoneNumber,
        address: {
          street: profileData.address.street,
          city: profileData.address.city,
          state: profileData.address.state,
          postalCode: profileData.address.zipCode,
          country: profileData.address.country
        }
      }
      
      // Try to update existing profile, or create if it doesn't exist
      try {
        await api.put('/profile', updateData)
        toast.success('Profile updated successfully!')
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Profile doesn't exist, create it
          await api.post('/profile', updateData)
          toast.success('Profile created successfully!')
        } else {
          throw error
        }
      }
      
      // Reload account data to reflect changes
      await loadAccountData()
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Update your personal details and contact information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={profileData.email}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          Email address cannot be changed. Contact support if you need to update it.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={profileData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={profileData.address.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={profileData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={profileData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={profileData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={profileData.address.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProfileUpdate}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )

  const renderKYCTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Identity Verification (KYC)</h3>
        <p className="mt-1 text-sm text-gray-500">
          Verify your identity to unlock all platform features and start earning commissions.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              kycStatus.status === 'approved' 
                ? 'bg-green-100' 
                : kycStatus.status === 'rejected'
                ? 'bg-red-100'
                : kycStatus.status === 'pending'
                ? 'bg-yellow-100'
                : 'bg-gray-100'
            }`}>
              {kycStatus.status === 'approved' ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : kycStatus.status === 'rejected' ? (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : kycStatus.status === 'pending' ? (
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">
                KYC Status: {kycStatus.status === 'not_submitted' ? 'Not Submitted' : 
                           kycStatus.status === 'pending' ? 'Under Review' :
                           kycStatus.status === 'approved' ? 'Approved' : 'Rejected'}
              </h4>
              <p className="text-sm text-gray-500">
                {kycStatus.status === 'not_submitted' && 'Complete your identity verification to start earning commissions'}
                {kycStatus.status === 'pending' && 'Your documents are being reviewed by our compliance team'}
                {kycStatus.status === 'approved' && 'Your identity has been verified successfully'}
                {kycStatus.status === 'rejected' && 'Your submission was rejected. Please resubmit with correct documents'}
              </p>
            </div>
          </div>
          <div>
            {kycStatus.status === 'not_submitted' && (
              <button
                onClick={() => navigate('/kyc-verification', { state: { skipable: false } })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Start KYC
              </button>
            )}
            {kycStatus.status === 'rejected' && (
              <button
                onClick={() => navigate('/kyc-verification', { state: { skipable: false } })}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Resubmit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Why is KYC required?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Identity verification helps us comply with financial regulations and ensures the security 
                of our platform. Once approved, you'll be able to earn and withdraw commissions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account information, security settings, and preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', name: 'Profile', icon: '👤' },
              { id: 'kyc', name: 'KYC Verification', icon: '🆔' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'kyc' && renderKYCTab()}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}