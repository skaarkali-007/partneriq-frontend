import React, { useState } from 'react';
import { AlertCircle, Mail, X, RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const AccountStatusBanner: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Don't show banner if user is active, dismissed, or doesn't exist
  if (!user || user.status === 'active' || isDismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setResendMessage('');

      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        const error = await response.json();
        setResendMessage(error.message || 'Failed to send verification email');
      }
    } catch (error) {
      setResendMessage('Network error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getBannerContent = () => {
    switch (user.status) {
      case 'pending':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          title: 'Email Verification Required',
          message: !user.emailVerified 
            ? 'Please verify your email address to fully activate your account.'
            : 'Your account is pending approval. We\'ll notify you once it\'s activated.',
          showResend: !user.emailVerified
        };
      case 'suspended':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: 'Account Suspended',
          message: 'Your account has been temporarily suspended. Please contact support for assistance.',
          showResend: false
        };
      case 'revoked':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: 'Account Revoked',
          message: 'Your account access has been revoked. Please contact support for more information.',
          showResend: false
        };
      default:
        return null;
    }
  };

  const bannerContent = getBannerContent();
  if (!bannerContent) return null;

  return (
    <div className={`border-b ${bannerContent.bgColor} ${bannerContent.textColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center">
              <AlertCircle className={`h-5 w-5 ${bannerContent.iconColor} mr-2`} />
              <div className="flex-1">
                <p className="font-medium">{bannerContent.title}</p>
                <p className="text-sm mt-1">{bannerContent.message}</p>
                {resendMessage && (
                  <p className={`text-sm mt-1 ${
                    resendMessage.includes('sent') ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {bannerContent.showResend && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-1" />
                  )}
                  {isResending ? 'Sending...' : 'Resend Email'}
                </button>
              )}
              
              <button
                onClick={() => setIsDismissed(true)}
                className={`p-1 rounded-md ${bannerContent.textColor} hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatusBanner;