import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Target, User, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface ConsentTypes {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface ConsentRecord {
  id: string;
  consentTypes: ConsentTypes;
  consentTimestamp: string;
  consentMethod: string;
  consentVersion: string;
  isWithdrawn: boolean;
}

const ConsentPreferences: React.FC = () => {
  const [currentConsent, setCurrentConsent] = useState<ConsentRecord | null>(null);
  const [consentHistory, setConsentHistory] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [consent, setConsent] = useState<ConsentTypes>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    loadConsentData();
  }, []);

  const loadConsentData = async () => {
    try {
      setLoading(true);
      
      // Load current consent
      const currentResponse = await fetch('/api/v1/consent/current', {
        credentials: 'include'
      });
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData.success && currentData.data) {
          setCurrentConsent(currentData.data);
          setConsent(currentData.data.consentTypes);
        }
      }

      // Load consent history
      const historyResponse = await fetch('/api/v1/consent/history', {
        credentials: 'include'
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        if (historyData.success) {
          setConsentHistory(historyData.data);
        }
      }
    } catch (error) {
      console.error('Failed to load consent data:', error);
      setMessage({ type: 'error', text: 'Failed to load consent preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (type: keyof ConsentTypes, value: boolean) => {
    if (type === 'necessary') return; // Cannot change necessary cookies
    
    setConsent(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/v1/consent/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          consentTypes: consent,
          consentMethod: 'settings',
          dataProcessingPurposes: getDataProcessingPurposes(consent)
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Consent preferences saved successfully' });
        await loadConsentData(); // Reload data
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save consent preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save consent preferences' });
    } finally {
      setSaving(false);
    }
  };

  const withdrawConsent = async () => {
    if (!confirm('Are you sure you want to withdraw all consent? This may limit your experience on our platform.')) {
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/v1/consent/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: 'User requested withdrawal via settings'
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Consent withdrawn successfully' });
        await loadConsentData(); // Reload data
      } else {
        throw new Error('Failed to withdraw consent');
      }
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      setMessage({ type: 'error', text: 'Failed to withdraw consent' });
    } finally {
      setSaving(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading consent preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Consent Preferences</h1>
        <p className="text-gray-600">
          Manage your data processing consent and privacy preferences. You can change these settings at any time.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Current Consent Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Consent Status</h2>
        
        {currentConsent ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Last updated: {formatDate(currentConsent.consentTimestamp)} via {currentConsent.consentMethod}
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

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Preferences
              </button>
              
              <button
                onClick={withdrawConsent}
                disabled={saving}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Withdraw All Consent
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No consent record found. Please accept cookies to continue using our services.
          </div>
        )}
      </div>

      {/* Consent History */}
      {consentHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consent History</h2>
          
          <div className="space-y-3">
            {consentHistory.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(record.consentTimestamp)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Method: {record.consentMethod} | Version: {record.consentVersion}
                    {record.isWithdrawn && ' | Withdrawn'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {record.consentTypes.analytics && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Analytics</span>
                  )}
                  {record.consentTypes.marketing && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Marketing</span>
                  )}
                  {record.consentTypes.preferences && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Preferences</span>
                  )}
                  {record.isWithdrawn && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Withdrawn</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">About Your Data</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Necessary cookies</strong> are essential for the website to function and cannot be switched off. 
            They are usually only set in response to actions made by you which amount to a request for services.
          </p>
          <p>
            <strong>Analytics cookies</strong> help us understand how visitors interact with our website by 
            collecting and reporting information anonymously.
          </p>
          <p>
            <strong>Marketing cookies</strong> are used to track visitors across websites to display 
            relevant and engaging advertisements.
          </p>
          <p>
            <strong>Preference cookies</strong> enable the website to remember information that changes 
            the way the website behaves or looks for you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentPreferences;