import React, { useState, useRef, useEffect } from 'react';

interface SignatureStepProps {
  customerId: string;
  onComplete: (data: any) => void;
}

export const SignatureStep: React.FC<SignatureStepProps> = ({
  customerId,
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasSignature) {
      setError('Please provide your signature.');
      return;
    }

    if (!agreed) {
      setError('Please confirm that you agree to the terms.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // Get signature as base64 data URL
      const signatureData = canvas.toDataURL('image/png');

      const response = await fetch(`/api/v1/customers/onboarding/${customerId}/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signatureData })
      });

      const result = await response.json();
      
      if (result.success) {
        onComplete(result.data);
      } else {
        setError(result.message || 'Failed to save signature');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Electronic Signature</h2>
        <p className="text-gray-600">
          Please review the terms below and provide your electronic signature to complete your application.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Terms and Conditions Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Application Summary</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              By signing this application, you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All information provided is true and accurate to the best of your knowledge</li>
              <li>You understand the terms and conditions of this financial product</li>
              <li>You consent to the processing of your personal data as outlined in our Privacy Policy</li>
              <li>You authorize us to verify the information provided and conduct necessary background checks</li>
              <li>You understand that providing false information may result in application rejection or account termination</li>
            </ul>
          </div>
        </div>

        {/* Signature Pad */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Your Signature</h3>
            <button
              type="button"
              onClick={clearSignature}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear Signature
            </button>
          </div>
          
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-32 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Sign above using your mouse or touch screen
            </p>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <span className="text-sm text-gray-700">
              I confirm that I have read and understood all terms and conditions, and that the signature above is my own. 
              I understand that this electronic signature has the same legal effect as a handwritten signature. *
            </span>
          </label>
        </div>

        {/* Legal Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Important Legal Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Your electronic signature will be legally binding. Please ensure all information is correct before signing.
                This application will be processed according to applicable laws and regulations.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading || !hasSignature || !agreed}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Application...
              </div>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};