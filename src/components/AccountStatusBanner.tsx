import React, { useState } from 'react';
import { AlertCircle, Mail, X, RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';

const AccountStatusBanner: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Check if we should show email verification banner
  const isAlphaStage = import.meta.env.VITE_STAGE === 'alpha';
  // Show banner for users with unverified emails who were created in alpha stage OR current non-alpha users
  const shouldShowEmailVerificationBanner = user && !user.emailVerified && (user.createdInAlphaStage || !isAlphaStage);
  
  // Don't show banner if user doesn't exist, is dismissed, or conditions don't match
  if (!user || isDismissed) {
    return null;
  }
  
  // Don't show banner if user is active and email is verified, unless they need email verification
  if (user.status === 'active' && user.emailVerified && !shouldShowEmailVerificationBanner) {
    return null;
  }
  
  // Don't show banner if user is active and we're in alpha stage and they weren't created in alpha stage
  if (user.status === 'active' && isAlphaStage && !user.createdInAlphaStage && user.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setResendMessage('');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-email-otp`, {
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

  const handleVerifyEmail = () => {
    navigate('/verify-otp', { state: { email: user.email } });
  };

  const getBannerContent = () => {
    // Handle email verification for active users (non-alpha stage)
    if (shouldShowEmailVerificationBanner) {
      return {
        bgColor: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        title: 'Email Verification Recommended',
        message: 'Please verify your email address to ensure account security and receive important notifications.',
        showResend: true
      };
    }

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
                <>
                  <button
                    onClick={handleVerifyEmail}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                      shouldShowEmailVerificationBanner 
                        ? 'text-blue-800 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500' 
                        : 'text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Verify Email
                  </button>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                      shouldShowEmailVerificationBanner 
                        ? 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50 focus:ring-blue-500' 
                        : 'border-yellow-300 text-yellow-700 bg-white hover:bg-yellow-50 focus:ring-yellow-500'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isResending ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                </>
              )}
              
              <button
                onClick={() => setIsDismissed(true)}
                className={`p-1 rounded-md ${bannerContent.textColor} hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  shouldShowEmailVerificationBanner 
                    ? 'focus:ring-offset-blue-50 focus:ring-blue-600' 
                    : 'focus:ring-offset-yellow-50 focus:ring-yellow-600'
                }`}
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