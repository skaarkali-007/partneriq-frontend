import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, BarChart3, Target, User } from 'lucide-react';

interface ConsentTypes {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentBannerProps {
  onConsentGiven?: (consent: ConsentTypes) => void;
  onShowPreferences?: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onConsentGiven,
  onShowPreferences: _onShowPreferences
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentTypes>({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = localStorage.getItem('cookie-consent');
    if (!existingConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsent: ConsentTypes = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    recordConsent(allConsent);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: ConsentTypes = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    recordConsent(necessaryOnly);
  };

  const handleCustomConsent = () => {
    recordConsent(consent);
  };

  const recordConsent = async (consentData: ConsentTypes) => {
    try {
      const response = await fetch('/api/v1/consent/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentTypes: consentData,
          consentMethod: 'banner',
          dataProcessingPurposes: getDataProcessingPurposes(consentData)
        }),
      });

      if (response.ok) {
        localStorage.setItem('cookie-consent', JSON.stringify(consentData));
        setIsVisible(false);
        onConsentGiven?.(consentData);
      }
    } catch (error) {
      console.error('Failed to record consent:', error);
    }
  };

  const getDataProcessingPurposes = (consentData: ConsentTypes): string[] => {
    const purposes = ['account_management', 'service_provision', 'security', 'legal_compliance'];
    
    if (consentData.analytics) {
      purposes.push('analytics');
    }
    if (consentData.marketing) {
      purposes.push('marketing', 'communication');
    }
    if (consentData.preferences) {
      purposes.push('personalization');
    }
    
    return purposes;
  };

  const handleConsentChange = (type: keyof ConsentTypes, value: boolean) => {
    if (type === 'necessary') return; // Cannot change necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [type]: value
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4">
        {!showDetails ? (
          // Simple banner view
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Cookie Consent</h3>
              </div>
              <p className="text-sm text-gray-600">
                We use cookies to enhance your experience, analyze site usage, and assist in marketing efforts. 
                By continuing to use our site, you consent to our use of cookies.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 inline mr-1" />
                Customize
              </button>
              <button
                onClick={handleAcceptNecessary}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Accept Necessary
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed preferences view
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Cookie Preferences</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Necessary Cookies */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-gray-900">Necessary</h4>
                  </div>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    Always Active
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Essential for the website to function properly. These cannot be disabled.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Analytics</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.analytics}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Help us understand how visitors interact with our website.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Marketing</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.marketing}
                      onChange={(e) => handleConsentChange('marketing', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Used to deliver personalized advertisements and track campaign effectiveness.
                </p>
              </div>

              {/* Preferences Cookies */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    <h4 className="font-medium text-gray-900">Preferences</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent.preferences}
                      onChange={(e) => handleConsentChange('preferences', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Remember your preferences and settings for a personalized experience.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-gray-200">
              <button
                onClick={handleAcceptNecessary}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Accept Necessary Only
              </button>
              <button
                onClick={handleCustomConsent}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;