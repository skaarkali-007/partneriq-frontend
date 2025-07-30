import React from 'react';

interface CompletionStepProps {
  customerId: string;
  product?: {
    id: string;
    name: string;
    description: string;
  };
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  customerId,
  product
}) => {
  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Application Submitted Successfully!
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Thank you for completing your application for {product?.name || 'our financial product'}. 
        Your application has been submitted and is now being reviewed by our team.
      </p>

      {/* Application Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Application ID:</span>
            <span className="font-medium text-gray-900">{customerId.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Product:</span>
            <span className="font-medium text-gray-900">{product?.name || 'Financial Product'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Under Review
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Submitted:</span>
            <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto text-left">
        <h3 className="text-lg font-medium text-blue-900 mb-4 text-center">What Happens Next?</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Document Review</h4>
              <p className="text-sm text-blue-800">Our team will review your submitted documents and personal information.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Identity Verification</h4>
              <p className="text-sm text-blue-800">We'll verify your identity and conduct necessary background checks.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Application Decision</h4>
              <p className="text-sm text-blue-800">You'll receive an email notification with our decision within 2-3 business days.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              4
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Account Setup</h4>
              <p className="text-sm text-blue-800">If approved, we'll help you set up your account and get started.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">Email: </span>
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline ml-1">
              support@example.com
            </a>
          </div>
          
          <div className="flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-gray-600">Phone: </span>
            <a href="tel:+1-800-123-4567" className="text-blue-600 hover:underline ml-1">
              1-800-123-4567
            </a>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Customer support is available Monday-Friday, 9 AM - 6 PM EST
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-left">
            <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Please save your application ID for future reference. You may be contacted if additional information is needed.
              Do not submit multiple applications for the same product as this may delay processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};