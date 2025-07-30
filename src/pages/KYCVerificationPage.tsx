import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import toast from 'react-hot-toast'

interface KYCFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  phoneNumber: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  idDocument: File | null
  proofOfAddress: File | null
}

export const KYCVerificationPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const [step, setStep] = useState<'info' | 'documents' | 'review' | 'complete'>('info')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<KYCFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dateOfBirth: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    idDocument: null,
    proofOfAddress: null
  })

  const idDocumentRef = useRef<HTMLInputElement>(null)
  const proofOfAddressRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleFileChange = (field: 'idDocument' | 'proofOfAddress', file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }))
  }

  const validatePersonalInfo = () => {
    const { firstName, lastName, dateOfBirth, phoneNumber, address } = formData
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your full name')
      return false
    }
    
    if (!dateOfBirth) {
      toast.error('Please enter your date of birth')
      return false
    }
    
    // Check if user is at least 18 years old
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      toast.error('You must be at least 18 years old to use this platform')
      return false
    }
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return false
    }
    
    if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zipCode.trim()) {
      toast.error('Please complete your address information')
      return false
    }
    
    return true
  }

  const validateDocuments = () => {
    if (!formData.idDocument) {
      toast.error('Please upload a government-issued ID')
      return false
    }
    
    if (!formData.proofOfAddress) {
      toast.error('Please upload proof of address')
      return false
    }
    
    return true
  }

  const handleNextStep = () => {
    if (step === 'info' && validatePersonalInfo()) {
      setStep('documents')
    } else if (step === 'documents' && validateDocuments()) {
      setStep('review')
    }
  }

  const handleSubmitKYC = async () => {
    try {
      setIsLoading(true)
      
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('firstName', formData.firstName)
      submitData.append('lastName', formData.lastName)
      submitData.append('dateOfBirth', formData.dateOfBirth)
      submitData.append('phoneNumber', formData.phoneNumber)
      submitData.append('address', JSON.stringify(formData.address))
      
      if (formData.idDocument) {
        submitData.append('idDocument', formData.idDocument)
      }
      if (formData.proofOfAddress) {
        submitData.append('proofOfAddress', formData.proofOfAddress)
      }

      // Submit KYC information to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/kyc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      })

      if (!response.ok) {
        throw new Error('Failed to submit KYC information')
      }

      setStep('complete')
      toast.success('KYC information submitted successfully!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit KYC information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    toast.success('Welcome to the platform! Your account is now fully set up.')
    navigate('/dashboard')
  }

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="mt-2 text-gray-600">
          Please provide your personal details for identity verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address *
        </label>
        <input
          type="text"
          value={formData.address.street}
          onChange={(e) => handleInputChange('address.street', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => handleInputChange('address.city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            value={formData.address.state}
            onChange={(e) => handleInputChange('address.state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="State"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.address.zipCode}
            onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            value={formData.address.country}
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

      <div className="flex justify-end">
        <button
          onClick={handleNextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Next: Upload Documents
        </button>
      </div>
    </div>
  ) 
 const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
        <p className="mt-2 text-gray-600">
          Please upload the required documents for identity verification
        </p>
      </div>

      <div className="space-y-6">
        {/* ID Document Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <label htmlFor="id-document" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Government-Issued ID *
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Upload your driver's license, passport, or state ID
                </span>
                <span className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200">
                  Choose File
                </span>
              </label>
              <input
                ref={idDocumentRef}
                id="id-document"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
            {formData.idDocument && (
              <div className="mt-2 text-sm text-green-600">
                ✓ {formData.idDocument.name}
              </div>
            )}
          </div>
        </div>

        {/* Proof of Address Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M9 12h30m-30 8h30m-30 8h30M9 12l3-9h24l3 9M9 12v24a3 3 0 003 3h24a3 3 0 003-3V12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <label htmlFor="proof-of-address" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Proof of Address *
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  Upload a utility bill, bank statement, or lease agreement (within 3 months)
                </span>
                <span className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200">
                  Choose File
                </span>
              </label>
              <input
                ref={proofOfAddressRef}
                id="proof-of-address"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange('proofOfAddress', e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
            {formData.proofOfAddress && (
              <div className="mt-2 text-sm text-green-600">
                ✓ {formData.proofOfAddress.name}
              </div>
            )}
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
                Document Requirements
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Documents must be clear and readable</li>
                  <li>All four corners of the document must be visible</li>
                  <li>File formats: JPG, PNG, or PDF</li>
                  <li>Maximum file size: 10MB per document</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep('info')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Review Information
        </button>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
        <p className="mt-2 text-gray-600">
          Please review all information before submitting
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Name:</span>
              <span className="ml-2 text-gray-900">{formData.firstName} {formData.lastName}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Date of Birth:</span>
              <span className="ml-2 text-gray-900">{formData.dateOfBirth}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500">Phone:</span>
              <span className="ml-2 text-gray-900">{formData.phoneNumber}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-500">Address:</span>
              <span className="ml-2 text-gray-900">
                {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.zipCode}, {formData.address.country}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-500">Government ID:</span>
              <span className="ml-2 text-gray-900">{formData.idDocument?.name}</span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-500">Proof of Address:</span>
              <span className="ml-2 text-gray-900">{formData.proofOfAddress?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Important Notice
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                By submitting this information, you confirm that all details are accurate and true. 
                Our compliance team will review your documents within 1-2 business days.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep('documents')}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          onClick={handleSubmitKYC}
          disabled={isLoading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </div>
          ) : (
            'Submit KYC Information'
          )}
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900">KYC Submitted Successfully!</h2>
        <p className="mt-2 text-gray-600">
          Your identity verification documents have been submitted for review.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-left">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-center">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
              Our compliance team will review your documents
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
              You'll receive an email notification within 1-2 business days
            </li>
            <li className="flex items-center">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
              Once approved, you can start earning commissions!
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={handleComplete}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Continue to Dashboard
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['info', 'documents', 'review', 'complete'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName 
                    ? 'bg-blue-600 text-white' 
                    : index < ['info', 'documents', 'review', 'complete'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index < ['info', 'documents', 'review', 'complete'].indexOf(step) ? '✓' : index + 1}
                </div>
                {index < 3 && (
                  <div className={`w-12 h-0.5 ${
                    index < ['info', 'documents', 'review', 'complete'].indexOf(step)
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">
              Step {['info', 'documents', 'review', 'complete'].indexOf(step) + 1} of 4: KYC Verification
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {step === 'info' && renderPersonalInfoStep()}
          {step === 'documents' && renderDocumentsStep()}
          {step === 'review' && renderReviewStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  )
}