import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  landingPageUrl: string;
  commissionType: 'percentage' | 'flat';
  commissionRate?: number;
  commissionFlatAmount?: number;
  minInitialSpend: number;
}

interface Marketer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface LandingPageData {
  trackingCode: string;
  product: Product;
  marketer: Marketer;
  referralLink: {
    id: string;
    createdAt: string;
    expiresAt?: string;
    clickCount: number;
    conversionCount: number;
  };
}

export const LandingPage: React.FC = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [landingData, setLandingData] = useState<LandingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      if (!trackingCode) {
        setError('Invalid tracking code');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/v1/landing/data/${trackingCode}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to load landing page data');
        }

        setLandingData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, [trackingCode]);

  const handleStartOnboarding = () => {
    if (landingData) {
      const sessionId = searchParams.get('session');
      const params = new URLSearchParams({
        trackingCode: landingData.trackingCode,
        productId: landingData.product.id
      });
      
      if (sessionId) {
        params.append('session', sessionId);
      }
      
      navigate(`/onboarding?${params.toString()}`);
    }
  };

  const handleExternalRedirect = () => {
    if (landingData?.product.landingPageUrl) {
      window.open(landingData.product.landingPageUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <h2 className="font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!landingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const { product, marketer } = landingData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img src="/partner-iq-logo.svg" alt="Partner IQ" width="200" height="53" />
            </div>
            <div className="text-sm text-gray-500">
              Referred by: {marketer.firstName} {marketer.lastName}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Product Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-blue-100 text-lg">{product.category}</p>
            </div>
          </div>

          {/* Product Details */}
          <div className="px-6 py-8">
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Key Information */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Minimum Investment</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${product.minInitialSpend.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Commission Structure</h3>
                <p className="text-lg text-gray-700">
                  {product.commissionType === 'percentage' 
                    ? `${(product.commissionRate! * 100).toFixed(2)}% of initial spend`
                    : `$${product.commissionFlatAmount?.toLocaleString()} flat rate`
                  }
                </p>
              </div>
            </div>

            {/* Referral Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>You've been referred by {marketer.firstName} {marketer.lastName}</strong>
                    <br />
                    Complete your application through this link to ensure proper attribution.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleStartOnboarding}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Application Process
              </button>
              
              <button
                onClick={handleExternalRedirect}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Learn More on Product Site
              </button>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 text-xs text-gray-500 border-t pt-4">
              <p>
                * This is a referral link. The referring marketer may earn a commission if you complete an investment.
                All investments carry risk and you should carefully consider your financial situation before investing.
                Please read all terms and conditions before proceeding.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 Partner IQ. All rights reserved.
            </p>
            <div className="mt-2 space-x-4">
              <a href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              <a href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
              <a href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};