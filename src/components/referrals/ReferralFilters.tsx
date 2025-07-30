import React, { useState, useEffect } from 'react'
import { ReferralFilters as ReferralFiltersType } from '../../types/api'

export interface ExtendedReferralFilters extends ReferralFiltersType {
  minSpend?: string
  maxSpend?: string
}

interface ReferralFiltersProps {
  filters: ExtendedReferralFilters
  onFiltersChange: (filters: Partial<ExtendedReferralFilters>) => void
  totalCount?: number
  filteredCount?: number
}

interface AdvancedFilters {
  commissionStatus: string
  source: string
  minSpend: string
  maxSpend: string
  dateFrom: string
  dateTo: string
}

export const ReferralFilters: React.FC<ReferralFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount = 0,
  filteredCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    commissionStatus: filters.commissionStatus || 'all',
    source: filters.source || 'all',
    minSpend: filters.minSpend || '',
    maxSpend: filters.maxSpend || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
  })

  // Sync advanced filters with props
  useEffect(() => {
    setAdvancedFilters({
      commissionStatus: filters.commissionStatus || 'all',
      source: filters.source || 'all',
      minSpend: filters.minSpend || '',
      maxSpend: filters.maxSpend || '',
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
    })
  }, [filters])
  const [searchDebounce, setSearchDebounce] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ search: searchDebounce })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchDebounce, onFiltersChange])

  const handleAdvancedFilterChange = (key: keyof AdvancedFilters, value: string) => {
    setAdvancedFilters(prev => ({ ...prev, [key]: value }))
    // Apply advanced filters immediately
    onFiltersChange({ [key]: value })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.product !== 'all') count++
    if (filters.dateRange !== '30') count++
    if (filters.search) count++
    if (advancedFilters.commissionStatus !== 'all') count++
    if (advancedFilters.source !== 'all') count++
    if (advancedFilters.minSpend) count++
    if (advancedFilters.maxSpend) count++
    if (advancedFilters.dateFrom) count++
    if (advancedFilters.dateTo) count++
    return count
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Filter Referrals
            </h3>
            {totalCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {filteredCount} of {totalCount} referrals
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => onFiltersChange({ status: e.target.value as 'pending' | 'converted' | 'expired' | 'all' })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="onboarding">Onboarding</option>
              <option value="converted">Converted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label htmlFor="product-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <select
              id="product-filter"
              value={filters.product}
              onChange={(e) => onFiltersChange({ product: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Products</option>
              <option value="investment">Investment Portfolio A</option>
              <option value="realestate">Real Estate Fund B</option>
              <option value="crypto">Crypto Trading Package</option>
              <option value="retirement">Retirement Planning Service</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              id="date-filter"
              value={filters.dateRange}
              onChange={(e) => onFiltersChange({ dateRange: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="0">All time</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                id="search-filter"
                placeholder="Search by email..."
                value={searchDebounce}
                onChange={(e) => setSearchDebounce(e.target.value)}
                className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchDebounce && (
                <button
                  onClick={() => setSearchDebounce('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Advanced Filters</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Commission Status Filter */}
              <div>
                <label htmlFor="commission-status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Status
                </label>
                <select
                  id="commission-status-filter"
                  value={advancedFilters.commissionStatus}
                  onChange={(e) => handleAdvancedFilterChange('commissionStatus', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Commission Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Source
                </label>
                <select
                  id="source-filter"
                  value={advancedFilters.source}
                  onChange={(e) => handleAdvancedFilterChange('source', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="cookie">Cookie</option>
                  <option value="portal">Portal</option>
                  <option value="direct">Direct</option>
                </select>
              </div>

              {/* Min Spend Filter */}
              <div>
                <label htmlFor="min-spend-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Min Spend ($)
                </label>
                <input
                  type="number"
                  id="min-spend-filter"
                  placeholder="0"
                  value={advancedFilters.minSpend}
                  onChange={(e) => handleAdvancedFilterChange('minSpend', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Max Spend Filter */}
              <div>
                <label htmlFor="max-spend-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Spend ($)
                </label>
                <input
                  type="number"
                  id="max-spend-filter"
                  placeholder="No limit"
                  value={advancedFilters.maxSpend}
                  onChange={(e) => handleAdvancedFilterChange('maxSpend', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Custom Date Range</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date-from-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    id="date-from-filter"
                    value={advancedFilters.dateFrom}
                    onChange={(e) => handleAdvancedFilterChange('dateFrom', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="date-to-filter" className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    id="date-to-filter"
                    value={advancedFilters.dateTo}
                    onChange={(e) => handleAdvancedFilterChange('dateTo', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter Presets */}
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Presets</h5>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onFiltersChange({ status: 'converted' })
                    handleAdvancedFilterChange('commissionStatus', 'pending')
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                >
                  Converted & Pending Commission
                </button>
                <button
                  onClick={() => {
                    onFiltersChange({ status: 'pending' })
                    onFiltersChange({ dateRange: '7' })
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Recent Pending
                </button>
                <button
                  onClick={() => {
                    handleAdvancedFilterChange('minSpend', '5000')
                    onFiltersChange({ status: 'converted' })
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200"
                >
                  High Value Conversions
                </button>
                <button
                  onClick={() => {
                    onFiltersChange({ status: 'pending' })
                    onFiltersChange({ dateRange: '30' })
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  Stale Referrals
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onFiltersChange({
              status: 'all',
              product: 'all',
              dateRange: '30',
              search: '',
            })}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}