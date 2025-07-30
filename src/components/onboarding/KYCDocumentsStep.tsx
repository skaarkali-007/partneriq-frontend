import React, { useState, useRef } from 'react';

interface KYCDocumentsStepProps {
  customerId: string;
  onComplete: (data: any) => void;
}

interface DocumentUpload {
  file: File;
  type: 'government_id' | 'proof_of_address' | 'income_verification' | 'other';
  preview?: string;
}

const documentTypes = [
  { value: 'government_id', label: 'Government ID (Driver\'s License, Passport, etc.)' },
  { value: 'proof_of_address', label: 'Proof of Address (Utility Bill, Bank Statement, etc.)' },
  { value: 'income_verification', label: 'Income Verification (Pay Stub, Tax Return, etc.)' },
  { value: 'other', label: 'Other Supporting Document' }
];

export const KYCDocumentsStep: React.FC<KYCDocumentsStepProps> = ({
  customerId,
  onComplete
}) => {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setError(`${file.name} is not a supported file type. Please upload images, PDFs, or Word documents.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Please upload files smaller than 10MB.`);
        return false;
      }
      
      return true;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newDocument: DocumentUpload = {
          file,
          type: 'government_id', // Default type
          preview: file.type.startsWith('image/') ? e.target?.result as string : undefined
        };
        
        setDocuments(prev => [...prev, newDocument]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const updateDocumentType = (index: number, type: DocumentUpload['type']) => {
    setDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, type } : doc
    ));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (documents.length === 0) {
      setError('Please upload at least one document.');
      return;
    }

    // Check if we have at least a government ID
    const hasGovernmentId = documents.some(doc => doc.type === 'government_id');
    if (!hasGovernmentId) {
      setError('Please upload at least one government-issued ID document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      documents.forEach((doc, index) => {
        formData.append('documents', doc.file);
        formData.append(`documentTypes[${index}]`, doc.type);
      });

      const response = await fetch(`/api/v1/customers/onboarding/${customerId}/kyc-documents`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        onComplete(result.data);
      } else {
        setError(result.message || 'Failed to upload documents');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else {
      return '📎';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Upload</h2>
        <p className="text-gray-600">
          Please upload the required documents for identity verification. All documents must be clear and legible.
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
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drag and drop your documents here
              </p>
              <p className="text-gray-600 mt-1">
                or <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline font-medium"
                >
                  browse files
                </button>
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, PDF, DOC, DOCX (max 10MB each)
            </p>
          </div>
        </div>

        {/* Required Documents Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Required Documents:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Government-issued photo ID (Driver's License, Passport, State ID)</li>
            <li>• Proof of address (Utility bill, Bank statement, Lease agreement)</li>
            <li>• Income verification (Pay stub, Tax return, Bank statements) - if applicable</li>
          </ul>
        </div>

        {/* Uploaded Documents */}
        {documents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
            
            {documents.map((doc, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {doc.preview ? (
                      <img 
                        src={doc.preview} 
                        alt="Document preview" 
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-2xl">
                        {getFileIcon(doc.file.type)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{doc.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Type
                        </label>
                        <select
                          value={doc.type}
                          onChange={(e) => updateDocumentType(index, e.target.value as DocumentUpload['type'])}
                          className="w-full max-w-xs px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {documentTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading || documents.length === 0}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              'Continue to Signature'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};