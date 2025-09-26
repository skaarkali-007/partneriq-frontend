import React, { useState } from 'react';
import api from '@/services/api'

interface PersonalInfoStepProps {
  customerId: string;
  onComplete: (data: any) => void;
  onSkip?: () => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  consents: {
    termsAndConditions: boolean;
    privacyPolicy: boolean;
    marketingCommunications: boolean;
    dataProcessing: boolean;
  };
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  customerId,
  onComplete,
  onSkip,
  initialData
}) => {
  const [formData, setFormData] = useState<PersonalInfo>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    consents: {
      termsAndConditions: false,
      privacyPolicy: false,
      marketingCommunications: false,
      dataProcessing: false
    }
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PersonalInfo] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateForm = async () => {
    try {
      const response = await api.post('/customers/onboarding/validate/1', formData);

      const result = response.data;
      
      if (result.success) {
        setErrors([]);
        return true;
      } else {
        setErrors(result.errors || ['Validation failed']);
        return false;
      }
    } catch (err) {
      setErrors(['Network error during validation']);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    
    try {
      const response = await api.put(`/customers/onboarding/${customerId}/personal-info`, formData);

      const result = response.data;
      
      if (result.success) {
        onComplete(result.data);
      } else {
        setErrors([result.message || 'Failed to save personal information']);
      }
    } catch (err) {
      setErrors(['Network error. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">
          Please provide your personal details to begin your application.
        </p>
        {onSkip && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can skip this step and complete your KYC information later from your account dashboard. 
              However, some features may be limited until your identity is verified.
            </p>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Please correct the following errors:</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
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
              required
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
              required
            />
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Address Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => handleInputChange('address.street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
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
                required
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
                required
              />
            </div>
          </div>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Consent and Legal</h3>
          
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.consents.termsAndConditions}
                onChange={(e) => handleInputChange('consents.termsAndConditions', e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the <a href="/terms" className="text-blue-600 hover:underline" target="_blank">Terms and Conditions</a> *
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.consents.privacyPolicy}
                onChange={(e) => handleInputChange('consents.privacyPolicy', e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a> *
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.consents.dataProcessing}
                onChange={(e) => handleInputChange('consents.dataProcessing', e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <span className="text-sm text-gray-700">
                I consent to the processing of my personal data for this application *
              </span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.consents.marketingCommunications}
                onChange={(e) => handleInputChange('consents.marketingCommunications', e.target.checked)}
                className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                I would like to receive marketing communications and updates (optional)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between pt-6">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 text-sm font-medium transition-colors"
            >
              Skip for now
            </button>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Continue to Document Upload'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};