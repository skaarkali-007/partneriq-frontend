import React, { useState, useEffect } from 'react'
import { productService, Product } from '../../services/productService'

interface CommissionFiltersProps {
  filters: {
    status?: string
    dateFrom?: string
    dateTo?: string
    productId?: string
  }
  onFilterChange: (filters: any) => void
  onClearFilters: () => void
}

export const CommissionFilters: React.FC<CommissionFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        const activeProducts = await productService.getActiveProducts()
        setProducts(activeProducts)
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    setLocalFilters({})
    onClearFilters()
  }

  const hasActiveFilters = Object.values(filters).some(value => value)

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={localFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="clawed_back">Clawed Back</option>
          </select>
        </div>

        {/* Date From Filter */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="dateFrom"
            value={localFilters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Date To Filter */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="dateTo"
            value={localFilters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Product Filter */}
        <div>
          <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
            Product
          </label>
          <select
            id="productId"
            value={localFilters.productId || ''}
            onChange={(e) => handleFilterChange('productId', e.target.value)}
            disabled={productsLoading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
          >
            <option value="">
              {productsLoading ? 'Loading products...' : 'All products'}
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters.status && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {filters.status}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-blue-600 hover:text-blue-500"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                From: {filters.dateFrom}
                <button
                  onClick={() => handleFilterChange('dateFrom', '')}
                  className="ml-1 text-blue-600 hover:text-blue-500"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                To: {filters.dateTo}
                <button
                  onClick={() => handleFilterChange('dateTo', '')}
                  className="ml-1 text-blue-600 hover:text-blue-500"
                >
                  ×
                </button>
              </span>
            )}
            {filters.productId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Product: {filters.productId}
                <button
                  onClick={() => handleFilterChange('productId', '')}
                  className="ml-1 text-blue-600 hover:text-blue-500"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}