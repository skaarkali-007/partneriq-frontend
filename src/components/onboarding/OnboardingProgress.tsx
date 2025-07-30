import React from 'react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  status: string;
  onboardingType?: 'simple' | 'complex';
}

const complexSteps = [
  { number: 1, title: 'Personal Information', description: 'Basic details and contact info' },
  { number: 2, title: 'Document Upload', description: 'Identity verification documents' },
  { number: 3, title: 'Electronic Signature', description: 'Sign your application' },
  { number: 4, title: 'Complete', description: 'Application submitted' }
];

const simpleSteps = [
  { number: 1, title: 'Personal Information', description: 'Basic details and contact info' },
  { number: 2, title: 'Complete', description: 'Application submitted' }
];

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  status,
  onboardingType = 'complex'
}) => {
  const steps = onboardingType === 'simple' ? simpleSteps : complexSteps;
  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (stepNumber: number, stepStatus: string) => {
    if (stepStatus === 'completed') {
      return (
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (stepStatus === 'current') {
      return (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">{stepNumber}</span>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-gray-600 text-sm font-medium">{stepNumber}</span>
        </div>
      );
    }
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {currentStep} of {totalSteps} steps
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.number);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {getStepIcon(step.number, stepStatus)}
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    stepStatus === 'current' ? 'text-blue-600' :
                    stepStatus === 'completed' ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-24">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step.number < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Message */}
      {status === 'rejected' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">
              Your application has been rejected. Please contact support for assistance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};