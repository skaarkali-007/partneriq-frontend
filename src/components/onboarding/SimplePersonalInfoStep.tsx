import React, { useState } from 'react';
import api from "@/services/api"

interface SimplePersonalInfoStepProps {
  customerId: string;
  onComplete: (data: any) => void;
  onSkip?: () => void;
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface SimplePersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  consents: {
    termsAndConditions: boolean;
    privacyPolicy: boolean;
    marketingCommunications: boolean;
    dataProcessing: boolean;
  };
}

export const SimplePersonalInfoStep: React.FC<SimplePersonalInfoStepProps> = ({
  customerId,
  onComplete,
  onSkip,
  initialData
}) => {
  const [formData, setFormData] = useState<SimplePersonalInfo>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: '',
    dateOfBirth: '',
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
          ...(prev[parent as keyof SimplePersonalInfo] as any),
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

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.firstName.trim()) newErrors.push('First name is required');
    if (!formData.lastName.trim()) newErrors.push('Last name is required');
    if (!formData.email.trim()) newErrors.push('Email is required');
    if (!formData.phone.trim()) newErrors.push('Phone number is required');
    if (!formData.dateOfBirth) newErrors.push('Date of birth is required');
    if (!formData.consents.termsAndConditions) newErrors.push('You must agree to the Terms and Conditions');
    if (!formData.consents.privacyPolicy) newErrors.push('You must agree to the Privacy Policy');
    if (!formData.consents.dataProcessing) newErrors.push('You must consent to data processing');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.phone && !phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.push('Please enter a valid phone number');
    }

    // Age validation (must be 18+)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.push('You must be at least 18 years old to apply');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const response = await api.put(`/customers/onboarding/${customerId}/simple-personal-info`, formData);

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
          Please provide your basic personal details to complete your application.
        </p>
        {onSkip && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can skip this step and complete your information later from your account dashboard. 
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
          <p className="mt-1 text-xs text-gray-500">You must be at least 18 years old to apply</p>
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
                'Complete Application'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};