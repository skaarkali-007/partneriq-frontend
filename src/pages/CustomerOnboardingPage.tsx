import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { PersonalInfoStep } from '../components/onboarding/PersonalInfoStep';
import { SimplePersonalInfoStep } from '../components/onboarding/SimplePersonalInfoStep';
import { KYCDocumentsStep } from '../components/onboarding/KYCDocumentsStep';
import { SignatureStep } from '../components/onboarding/SignatureStep';
import { CompletionStep } from '../components/onboarding/CompletionStep';
import api from '@/services/api';

interface OnboardingData {
  customerId?: string;
  currentStep: number;
  totalSteps: number;
  onboardingStatus: string;
  kycStatus?: string;
  product?: {
    id: string;
    name: string;
    description: string;
    landingPageUrl?: string;
    onboardingType: 'simple' | 'complex';
  };
}

export const CustomerOnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentStep: 1,
    totalSteps: 4,
    onboardingStatus: 'started'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trackingCode = searchParams.get('trackingCode') || searchParams.get('ref');
  const productId = searchParams.get('productId') || searchParams.get('product');

  useEffect(() => {
    if (trackingCode && productId) {
      startOnboarding();
    } else {
      setError('Missing required parameters. Please use a valid referral link.');
      setLoading(false);
    }
  }, [trackingCode, productId]);

  const startOnboarding = async () => {
    try {
      setLoading(true);
      // const response = await fetch('/api/v1/customers/onboarding/start', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     trackingCode,
      //     productId
      //   })
      // });

      const response = await api.post('/customers/onboarding/start', { trackingCode, productId } , )
      
      const result = await response.data;
      
      if (result.success) {
        setOnboardingData(result.data);
      } else {
        setError(result.message || 'Failed to start onboarding process');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = (stepData: any) => {
    setOnboardingData(prev => ({
      ...prev,
      ...stepData
    }));
  };

  const handleSkipStep = async () => {
    if (!onboardingData.customerId) return;
    
    try {
      const response = await api.post(`/customers/onboarding/${onboardingData.customerId}/skip-kyc`);
      
      if (response.data.success) {
        setOnboardingData(prev => ({
          ...prev,
          ...response.data.data
        }));
      } else {
        setError(response.data.message || 'Failed to skip KYC process');
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    }
  };

  const renderCurrentStep = () => {
    if (!onboardingData.customerId) return null;

    const isSimpleOnboarding = onboardingData.product?.onboardingType === 'simple';

    // For simple onboarding, we only have 2 steps: Personal Info + Completion
    if (isSimpleOnboarding) {
      switch (onboardingData.currentStep) {
        case 1:
          return (
            <SimplePersonalInfoStep
              customerId={onboardingData.customerId}
              onComplete={handleStepComplete}
              onSkip={handleSkipStep}
            />
          );
        case 2:
          return (
            <CompletionStep
              customerId={onboardingData.customerId}
              product={onboardingData.product}
              kycSkipped={onboardingData.kycStatus === 'skipped'}
            />
          );
        default:
          return <div>Invalid step</div>;
      }
    }

    // For complex onboarding, we have all 4 steps
    switch (onboardingData.currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            customerId={onboardingData.customerId}
            onComplete={handleStepComplete}
            onSkip={handleSkipStep}
          />
        );
      case 2:
        return (
          <KYCDocumentsStep
            customerId={onboardingData.customerId}
            onComplete={handleStepComplete}
          />
        );
      case 3:
        return (
          <SignatureStep
            customerId={onboardingData.customerId}
            onComplete={handleStepComplete}
          />
        );
      case 4:
        return (
          <CompletionStep
            customerId={onboardingData.customerId}
            product={onboardingData.product}
            kycSkipped={onboardingData.kycStatus === 'skipped'}
          />
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Starting your application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {onboardingData.product?.name || 'Financial Product'} Application
          </h1>
          <p className="text-gray-600 mb-4">
            Complete your application in just a few simple steps
          </p>
          {onboardingData.product?.landingPageUrl && (
            <div className="flex justify-center">
              <a
                href={onboardingData.product.landingPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Learn more about this product
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <OnboardingProgress
          currentStep={onboardingData.currentStep}
          totalSteps={onboardingData.product?.onboardingType === 'simple' ? 2 : 4}
          status={onboardingData.onboardingStatus}
          onboardingType={onboardingData.product?.onboardingType || 'complex'}
        />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Secure application powered by SSL encryption. 
            Your information is protected and will never be shared.
          </p>
        </div>
      </div>
    </div>
  );
};