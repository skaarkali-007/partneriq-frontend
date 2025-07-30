import React, { useEffect, useState } from 'react'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface Product {
  _id: string
  name: string
  description: string
  category: string
  commissionType: 'percentage' | 'flat'
  commissionRate?: number
  commissionFlatAmount?: number
  minInitialSpend: number
  status: 'active' | 'inactive'
  landingPageUrl: string
  tags: string[]
  materialCount: number
  createdAt: string
  updatedAt: string
}

interface ProductListResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [filters])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString())
      })

      const response = await fetch(`/api/v1/admin/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data: { data: ProductListResponse } = await response.json()
      setProducts(data.data.products)
      setPagination(data.data.pagination)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        throw new Error('Failed to create product')
      }

      fetchProducts()
      setShowCreateModal(false)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      fetchProducts()
      setEditingProduct(null)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      fetchProducts()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const formatCommission = (product: Product) => {
    if (product.commissionType === 'percentage') {
      return `${((product.commissionRate || 0) * 100).toFixed(2)}%`
    } else {
      return `$${product.commissionFlatAmount?.toFixed(2) || '0.00'}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading products: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage financial products and commission structures</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
            >
              <option value="">All Categories</option>
              <option value="investment">Investment</option>
              <option value="real-estate">Real Estate</option>
              <option value="insurance">Insurance</option>
              <option value="loans">Loans</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', category: '', status: '', page: 1, limit: 20 })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min Spend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materials
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs" title={product.description}>
                      {product.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900 capitalize">{product.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{formatCommission(product)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">${product.minInitialSpend.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={product.status} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{product.materialCount}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedProductId(product._id)
                        setShowPerformanceModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Performance"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No products found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      {(showCreateModal || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          onSave={(productData) => {
            if (editingProduct) {
              updateProduct(editingProduct._id, productData)
            } else {
              createProduct(productData)
            }
          }}
          onClose={() => {
            setShowCreateModal(false)
            setEditingProduct(null)
          }}
        />
      )}

      {/* Performance Modal */}
      {showPerformanceModal && selectedProductId && (
        <ProductPerformanceModal
          productId={selectedProductId}
          onClose={() => {
            setShowPerformanceModal(false)
            setSelectedProductId(null)
          }}
        />
      )}
    </div>
  )
}

// Product Form Modal Component
const ProductFormModal: React.FC<{
  product?: Product | null
  onSave: (data: Partial<Product>) => void
  onClose: () => void
}> = ({ product, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    commissionType: product?.commissionType || 'percentage' as 'percentage' | 'flat',
    commissionRate: product?.commissionRate || 0,
    commissionFlatAmount: product?.commissionFlatAmount || 0,
    minInitialSpend: product?.minInitialSpend || 0,
    status: product?.status || 'active' as 'active' | 'inactive',
    landingPageUrl: product?.landingPageUrl || '',
    tags: product?.tags?.join(', ') || '',
    onboardingType: (product as any)?.onboardingType || 'simple' as 'simple' | 'complex'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData: any = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    }

    if (formData.commissionType === 'percentage') {
      submitData.commissionRate = formData.commissionRate / 100 // Convert percentage to decimal
      delete submitData.commissionFlatAmount
    } else {
      submitData.commissionFlatAmount = formData.commissionFlatAmount
      delete submitData.commissionRate
    }

    onSave(submitData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {product ? 'Edit Product' : 'Create Product'}
            </h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select Category</option>
                  <option value="investment">Investment</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="insurance">Insurance</option>
                  <option value="loans">Loans</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.commissionType}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionType: e.target.value as 'percentage' | 'flat' }))}
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
              </div>
              {formData.commissionType === 'percentage' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.commissionFlatAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, commissionFlatAmount: parseFloat(e.target.value) }))}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Initial Spend ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.minInitialSpend}
                  onChange={(e) => setFormData(prev => ({ ...prev, minInitialSpend: parseFloat(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page URL</label>
                <input
                  type="url"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.landingPageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, landingPageUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Type</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.onboardingType}
                  onChange={(e) => setFormData(prev => ({ ...prev, onboardingType: e.target.value as 'simple' | 'complex' }))}
                >
                  <option value="simple">Simple (Basic Info Only)</option>
                  <option value="complex">Complex (Full KYC)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Simple: Only personal info required. Complex: Full KYC with documents and signatures.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., high-yield, beginner-friendly, premium"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {product ? 'Update' : 'Create'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Product Performance Modal Component
const ProductPerformanceModal: React.FC<{
  productId: string
  onClose: () => void
}> = ({ productId, onClose }) => {
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformance()
  }, [productId])

  const fetchPerformance = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/admin/products/${productId}/performance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch performance data')
      }

      const data = await response.json()
      setPerformance(data.data)
    } catch (err) {
      console.error('Error fetching performance:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Product Performance</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : performance ? (
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    ${performance.stats.totalCommissions?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-blue-600">Total Commissions</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {performance.stats.totalConversions || 0}
                  </div>
                  <div className="text-sm text-green-600">Total Conversions</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    ${performance.stats.avgCommissionAmount?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-purple-600">Avg Commission</div>
                </div>
              </div>

              {/* Top Marketers */}
              {performance.topMarketers && performance.topMarketers.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Top Performing Marketers</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {performance.topMarketers.slice(0, 5).map((marketer: any) => (
                        <div key={marketer.marketerId} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{marketer.marketerName}</span>
                            <span className="text-sm text-gray-500 ml-2">({marketer.marketerEmail})</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${marketer.totalCommissions.toFixed(2)}</div>
                            <div className="text-sm text-gray-500">{marketer.totalConversions} conversions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No performance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}