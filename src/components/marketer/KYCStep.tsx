import React, { useState } from 'react';

interface KYCStepProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface KYCData {
  businessInfo: {
    businessName: string;
    businessType: 'individual' | 'llc' | 'corporation' | 'partnership';
    taxId: string;
    yearsInBusiness: number;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  identityVerification: {
    idType: 'drivers_license' | 'passport' | 'state_id';
    idNumber: string;
    idFrontFile: File | null;
    idBackFile: File | null;
    selfieFile: File | null;
  };
  financialInfo: {
    bankAccountType: 'checking' | 'savings' | 'business';
    routingNumber: string;
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
  };
  experience: {
    marketingExperience: number;
    financialServicesExperience: number;
    previousAffiliatePrograms: string[];
    estimatedMonthlyVolume: string;
  };
}

export const KYCStep: React.FC<KYCStepProps> = ({ onComplete, onBack }) => {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [kycData, setKycData] = useState<KYCData>({
    businessInfo: {
      businessName: '',
      businessType: 'individual',
      taxId: '',
      yearsInBusiness: 0,
      businessAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      }
    },
    identityVerification: {
      idType: 'drivers_license',
      idNumber: '',
      idFrontFile: null,
      idBackFile: null,
      selfieFile: null
    },
    financialInfo: {
      bankAccountType: 'checking',
      routingNumber: '',
      accountNumber: '',
      accountHolderName: '',
      bankName: ''
    },
    experience: {
      marketingExperience: 0,
      financialServicesExperience: 0,
      previousAffiliatePrograms: [],
      estimatedMonthlyVolume: ''
    }
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (section: keyof KYCData, field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setKycData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [parent]: {
            ...(prev[section] as any)[parent],
            [child]: value
          }
        }
      }));
    } else {
      setKycData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setKycData(prev => ({
      ...prev,
      identityVerification: {
        ...prev.identityVerification,
        [field]: file
      }
    }));
  };

  const validateCurrentStep = () => {
    const newErrors: string[] = [];

    switch (currentSubStep) {
      case 1: // Business Information
        if (!kycData.businessInfo.businessName.trim()) newErrors.push('Business name is required');
        if (!kycData.businessInfo.taxId.trim()) newErrors.push('Tax ID is required');
        if (!kycData.businessInfo.businessAddress.street.trim()) newErrors.push('Street address is required');
        if (!kycData.businessInfo.businessAddress.city.trim()) newErrors.push('City is required');
        if (!kycData.businessInfo.businessAddress.state.trim()) newErrors.push('State is required');
        if (!kycData.businessInfo.businessAddress.zipCode.trim()) newErrors.push('ZIP code is required');
        break;

      case 2: // Identity Verification
        if (!kycData.identityVerification.idNumber.trim()) newErrors.push('ID number is required');
        if (!kycData.identityVerification.idFrontFile) newErrors.push('Front of ID is required');
        if (kycData.identityVerification.idType === 'drivers_license' && !kycData.identityVerification.idBackFile) {
          newErrors.push('Back of driver\'s license is required');
        }
        if (!kycData.identityVerification.selfieFile) newErrors.push('Selfie verification is required');
        break;

      case 3: // Financial Information
        if (!kycData.financialInfo.routingNumber.trim()) newErrors.push('Routing number is required');
        if (!kycData.financialInfo.accountNumber.trim()) newErrors.push('Account number is required');
        if (!kycData.financialInfo.accountHolderName.trim()) newErrors.push('Account holder name is required');
        if (!kycData.financialInfo.bankName.trim()) newErrors.push('Bank name is required');
        break;

      case 4: // Experience
        if (!kycData.experience.estimatedMonthlyVolume) newErrors.push('Estimated monthly volume is required');
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentSubStep < 4) {
        setCurrentSubStep(currentSubStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add KYC data
      formData.append('kycData', JSON.stringify({
        businessInfo: kycData.businessInfo,
        financialInfo: kycData.financialInfo,
        experience: kycData.experience,
        identityVerification: {
          idType: kycData.identityVerification.idType,
          idNumber: kycData.identityVerification.idNumber
        }
      }));

      // Add files
      if (kycData.identityVerification.idFrontFile) {
        formData.append('idFront', kycData.identityVerification.idFrontFile);
      }
      if (kycData.identityVerification.idBackFile) {
        formData.append('idBack', kycData.identityVerification.idBackFile);
      }
      if (kycData.identityVerification.selfieFile) {
        formData.append('selfie', kycData.identityVerification.selfieFile);
      }

      const response = await fetch('/api/v1/auth/marketer/kyc', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        onComplete(result.data);
      } else {
        setErrors([result.message || 'Failed to submit KYC information']);
      }
    } catch (err) {
      setErrors(['Network error. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const renderBusinessInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              value={kycData.businessInfo.businessName}
              onChange={(e) => handleInputChange('businessInfo', 'businessName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your business or legal name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type *
            </label>
            <select
              value={kycData.businessInfo.businessType}
              onChange={(e) => handleInputChange('businessInfo', 'businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="individual">Individual/Sole Proprietor</option>
              <option value="llc">LLC</option>
              <option value="corporation">Corporation</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID (SSN/EIN) *
            </label>
            <input
              type="text"
              value={kycData.businessInfo.taxId}
              onChange={(e) => handleInputChange('businessInfo', 'taxId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="XXX-XX-XXXX or XX-XXXXXXX"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years in Business
            </label>
            <input
              type="number"
              min="0"
              value={kycData.businessInfo.yearsInBusiness}
              onChange={(e) => handleInputChange('businessInfo', 'yearsInBusiness', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Business Address</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                value={kycData.businessInfo.businessAddress.street}
                onChange={(e) => handleInputChange('businessInfo', 'businessAddress.street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={kycData.businessInfo.businessAddress.city}
                  onChange={(e) => handleInputChange('businessInfo', 'businessAddress.city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={kycData.businessInfo.businessAddress.state}
                  onChange={(e) => handleInputChange('businessInfo', 'businessAddress.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={kycData.businessInfo.businessAddress.zipCode}
                  onChange={(e) => handleInputChange('businessInfo', 'businessAddress.zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIdentityVerification = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Identity Verification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Type *
            </label>
            <select
              value={kycData.identityVerification.idType}
              onChange={(e) => handleInputChange('identityVerification', 'idType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="drivers_license">Driver's License</option>
              <option value="passport">Passport</option>
              <option value="state_id">State ID</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number *
            </label>
            <input
              type="text"
              value={kycData.identityVerification.idNumber}
              onChange={(e) => handleInputChange('identityVerification', 'idNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Front of ID *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('idFrontFile', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Upload a clear photo of the front of your ID</p>
          </div>
          
          {kycData.identityVerification.idType === 'drivers_license' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Back of Driver's License *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('idBackFile', e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Upload a clear photo of the back of your driver's license</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selfie Verification *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('selfieFile', e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Take a selfie holding your ID next to your face</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          This information is required for commission payments and is encrypted and stored securely.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              value={kycData.financialInfo.bankAccountType}
              onChange={(e) => handleInputChange('financialInfo', 'bankAccountType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="business">Business</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              value={kycData.financialInfo.bankName}
              onChange={(e) => handleInputChange('financialInfo', 'bankName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Routing Number *
            </label>
            <input
              type="text"
              value={kycData.financialInfo.routingNumber}
              onChange={(e) => handleInputChange('financialInfo', 'routingNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="9-digit routing number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              value={kycData.financialInfo.accountNumber}
              onChange={(e) => handleInputChange('financialInfo', 'accountNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Holder Name *
          </label>
          <input
            type="text"
            value={kycData.financialInfo.accountHolderName}
            onChange={(e) => handleInputChange('financialInfo', 'accountHolderName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Name as it appears on the account"
          />
        </div>
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Marketing Experience</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Marketing Experience
            </label>
            <input
              type="number"
              min="0"
              value={kycData.experience.marketingExperience}
              onChange={(e) => handleInputChange('experience', 'marketingExperience', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years in Financial Services
            </label>
            <input
              type="number"
              min="0"
              value={kycData.experience.financialServicesExperience}
              onChange={(e) => handleInputChange('experience', 'financialServicesExperience', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Monthly Volume *
          </label>
          <select
            value={kycData.experience.estimatedMonthlyVolume}
            onChange={(e) => handleInputChange('experience', 'estimatedMonthlyVolume', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select estimated monthly volume</option>
            <option value="0-10000">$0 - $10,000</option>
            <option value="10000-50000">$10,000 - $50,000</option>
            <option value="50000-100000">$50,000 - $100,000</option>
            <option value="100000-500000">$100,000 - $500,000</option>
            <option value="500000+">$500,000+</option>
          </select>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previous Affiliate Programs
          </label>
          <textarea
            rows={3}
            value={kycData.experience.previousAffiliatePrograms.join('\n')}
            onChange={(e) => handleInputChange('experience', 'previousAffiliatePrograms', e.target.value.split('\n').filter(p => p.trim()))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="List any previous affiliate programs you've participated in (one per line)"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Verification</h2>
        <p className="text-gray-600">
          Step {currentSubStep} of 4: Complete your Know Your Customer verification
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">KYC Progress</span>
          <span className="text-sm font-medium text-gray-700">{currentSubStep} of 4</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentSubStep / 4) * 100}%` }}
          ></div>
        </div>
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

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-6">
        {currentSubStep === 1 && renderBusinessInfo()}
        {currentSubStep === 2 && renderIdentityVerification()}
        {currentSubStep === 3 && renderFinancialInfo()}
        {currentSubStep === 4 && renderExperience()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={currentSubStep === 1 ? onBack : () => setCurrentSubStep(currentSubStep - 1)}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        
        <button
          onClick={handleNext}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : currentSubStep === 4 ? (
            'Complete KYC'
          ) : (
            'Next'
          )}
        </button>
      </div>
    </div>
  );
};