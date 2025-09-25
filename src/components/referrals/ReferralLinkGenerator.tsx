import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store'
import { ReferralLink } from '../../types/api'
import { createReferralLink, updateLinkStats } from '../../store/slices/referralSlice'
import { productService, Product } from '../../services/productService'

interface ReferralLinkGeneratorProps {
  referralLinks: ReferralLink[]
  onCreateLink?: (productId: string, options?: LinkGenerationOptions) => Promise<void>
  isLoading?: boolean
}

interface LinkGenerationOptions {
  expiryDays?: number
  campaignTag?: string
  customAlias?: string
}

export const ReferralLinkGenerator: React.FC<ReferralLinkGeneratorProps> = ({
  referralLinks,
  onCreateLink,
  isLoading: propIsLoading,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isCreatingLink, realTimeEnabled } = useSelector((state: RootState) => state.referral)
  
  const [selectedProduct, setSelectedProduct] = useState('')
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [linkOptions, setLinkOptions] = useState<LinkGenerationOptions>({
    expiryDays: 30,
    campaignTag: '',
    customAlias: ''
  })
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  const isLoading = propIsLoading || isCreatingLink

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        setProductsError(null)
        const activeProducts = await productService.getActiveProducts()
        console.log("activeProducts:", activeProducts)
        setProducts(activeProducts)
      } catch (error: any) {
        console.error('Failed to fetch products:', error)
        setProductsError(error.message || 'Failed to load products')
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Real-time updates simulation - TEMPORARILY DISABLED
  useEffect(() => {
    // Temporarily disabled to prevent page refresh issues
    return
    
    if (!realTimeEnabled) return

    const interval = setInterval(() => {
      // Simulate real-time click updates
      referralLinks.forEach(link => {
        if (Math.random() < 0.1) { // 10% chance of update
          const newClicks = (link.clickCount || 0) + Math.floor(Math.random() * 3)
          const newConversions = (link.conversionCount || 0) + (Math.random() < 0.05 ? 1 : 0)
          dispatch(updateLinkStats({
            linkId: link.id,
            clicks: newClicks,
            conversions: newConversions
          }))
        }
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [realTimeEnabled, dispatch])

  const handleCreateLink = async () => {
    if (!selectedProduct) return
    
    console.log('Creating referral link for product:', selectedProduct)
    console.log('Available products:', products)
    
    try {
      if (onCreateLink) {
        await onCreateLink(selectedProduct, linkOptions)
      } else {
        await dispatch(createReferralLink(selectedProduct)).unwrap()
      }
      setSelectedProduct('')
      // Reset options after creation
      setLinkOptions({
        expiryDays: 30,
        campaignTag: '',
        customAlias: ''
      })
    } catch (error) {
      console.error('Failed to create referral link:', error)
    }
  }

  const handleBulkCreate = async () => {
    if (selectedProducts.length === 0) return
    
    try {
      for (const productId of selectedProducts) {
        if (onCreateLink) {
          await onCreateLink(productId, linkOptions)
        } else {
          await dispatch(createReferralLink(productId)).unwrap()
        }
      }
      setSelectedProducts([])
      setBulkMode(false)
    } catch (error) {
      console.error('Failed to create bulk referral links:', error)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleToggleLinkStatus = async (linkId: string, isActive: boolean) => {
    // In real implementation, this would call API to toggle link status
    console.log(`Toggling link ${linkId} to ${isActive ? 'active' : 'inactive'}`)
  }

  const handleDeleteLink = async (linkId: string) => {
    if (window.confirm('Are you sure you want to delete this referral link?')) {
      // In real implementation, this would call API to delete link
      console.log(`Deleting link ${linkId}`)
    }
  }

  const handleCopyLink = async (link: ReferralLink) => {
    try {
      await navigator.clipboard.writeText(link.linkUrl)
      setCopiedLinkId(link.id)
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getConversionRate = (link: ReferralLink) => {
    if (!link.clickCount || link.clickCount === 0) return '0%'
    return `${((link.conversionCount / link.clickCount) * 100).toFixed(1)}%`
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Generate Referral Links
        </h3>
        
        {/* Real-time Status Indicator */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {realTimeEnabled ? 'Live updates enabled' : 'Live updates disabled'}
            </span>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>

        {/* Link Generator Form */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Product
              </label>
              <select
                id="product-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                disabled={productsLoading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              >
                <option value="">
                  {productsLoading ? 'Loading products...' : 'Choose a product...'}
                </option>
                {products && products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.category})
                  </option>
                ))}
              </select>
              {productsError && (
                <p className="mt-1 text-sm text-red-600">{productsError}</p>
              )}
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleCreateLink}
                disabled={!selectedProduct || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                Generate Link
              </button>
              {showAdvanced && (
                <button
                  onClick={() => {
                    // Bulk create links for all products
                    if (products) {
                      products.forEach(product => {
                        if (onCreateLink) {
                          onCreateLink(product.id)
                        } else {
                          dispatch(createReferralLink(product.id))
                        }
                      })
                    }
                  }}
                  disabled={isLoading || productsLoading}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Bulk Create
                </button>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-900">Advanced Options</h5>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Bulk Mode</label>
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      bulkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        bulkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bulk Product Selection */}
              {bulkMode && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Products for Bulk Creation
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products && products.map((product) => (
                      <label key={product.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{product.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Expiry (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={linkOptions.expiryDays}
                    onChange={(e) => setLinkOptions(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., summer2024"
                    value={linkOptions.campaignTag}
                    onChange={(e) => setLinkOptions(prev => ({ ...prev, campaignTag: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Alias
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., my-special-link"
                    value={linkOptions.customAlias}
                    onChange={(e) => setLinkOptions(prev => ({ ...prev, customAlias: e.target.value }))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Bulk Actions */}
              {bulkMode && (
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setSelectedProducts(products.map(p => p.id))}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleBulkCreate}
                    disabled={selectedProducts.length === 0 || isLoading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Create {selectedProducts.length} Links
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing Links */}
        {referralLinks.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Your Referral Links</h4>
            <div className="space-y-4">
              {referralLinks.map((link) => (
                <div
                  key={link.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {(link.productId as any)?.name || `Product ${link.productId}`}
                        </h5>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                          link.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {/* Metadata - Responsive Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                        <div className="truncate">
                          <span className="font-medium">Code:</span> {link.trackingCode}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Created:</span> {formatDate(link.createdAt)}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Expires:</span> {link.expiresAt ? formatDate(link.expiresAt) : 'Never'}
                        </div>
                      </div>
                      
                      {/* Stats - Responsive Grid */}
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div className="text-center sm:text-left">
                          <div className="text-blue-600 font-medium">{link.clickCount || 0}</div>
                          <div className="text-xs text-gray-500">clicks</div>
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-green-600 font-medium">{link.conversionCount || 0}</div>
                          <div className="text-xs text-gray-500">conversions</div>
                        </div>
                        <div className="text-center sm:text-left">
                          <div className="text-purple-600 font-medium">{getConversionRate(link)}</div>
                          <div className="text-xs text-gray-500">rate</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Responsive Layout */}
                    <div className="flex sm:flex-col gap-2 sm:gap-1 flex-wrap sm:flex-nowrap sm:ml-4">
                      <button
                        onClick={() => handleToggleLinkStatus(link.id, !link.isActive)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                          link.isActive 
                            ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }`}
                        title={link.isActive ? 'Deactivate link' : 'Activate link'}
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.isActive ? "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                        </svg>
                        <span className="hidden sm:inline">{link.isActive ? 'Pause' : 'Resume'}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('Viewing analytics for link:', link.id)
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 whitespace-nowrap"
                        title="View analytics"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="hidden sm:inline">Analytics</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('Viewing promotional materials for product:', link.productId)
                        }}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 whitespace-nowrap"
                        title="View promotional materials"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Materials</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 whitespace-nowrap"
                        title="Delete link"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Link URL Section */}
                  <div className="border-t border-gray-100 pt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Referral Link</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={link.linkUrl}
                        readOnly
                        className="flex-1 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 focus:outline-none min-w-0"
                      />
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
                      >
                        {copiedLinkId === link.id ? (
                          <>
                            <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {referralLinks.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referral links yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first referral link.</p>
          </div>
        )}
      </div>
    </div>
  )
}