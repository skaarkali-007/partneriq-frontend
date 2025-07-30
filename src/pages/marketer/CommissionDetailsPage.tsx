import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CommissionDetail {
  customerId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  initialSpend: number;
  commissionEarned: number;
  commissionStatus: 'pending' | 'approved' | 'paid' | 'disputed';
  commissionPaid: boolean;
  commissionPaidDate?: string;
  onboardingStatus: string;
  createdAt: string;
}

interface CommissionSummary {
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  totalCustomers: number;
  averageCommissionPerCustomer: number;
}

export const CommissionDetailsPage: React.FC = () => {
  const [commissionDetails, setCommissionDetails] = useState<CommissionDetail[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      
      // Fetch commission details
      const detailsResponse = await fetch('/api/v1/marketer/commission-details', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch commission details');
      }
      
      const detailsResult = await detailsResponse.json();
      setCommissionDetails(detailsResult.data || []);
      
      // Fetch dashboard data for summary
      const dashboardResponse = await fetch('/api/v1/marketer/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (dashboardResponse.ok) {
        const dashboardResult = await dashboardResponse.json();
        setCommissionSummary(dashboardResult.data.commissionSummary);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, paid: boolean) => {
    if (paid) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Approved
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Disputed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const filteredAndSortedDetails = commissionDetails
    .filter(detail => {
      if (filter === 'all') return true;
      if (filter === 'paid') return detail.commissionPaid;
      if (filter === 'pending') return !detail.commissionPaid;
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'amount':
          aValue = a.commissionEarned;
          bValue = b.commissionEarned;
          break;
        case 'customer':
          aValue = a.customerName.toLowerCase();
          bValue = b.customerName.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCommissionData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Details</h1>
          <p className="text-gray-600">Track your earnings and commission payments</p>
        </div>
        <Link
          to="/marketer/dashboard"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Commission Summary Cards */}
      {commissionSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(commissionSummary.totalCommissionEarned)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(commissionSummary.totalCommissionPaid)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(commissionSummary.pendingCommission)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {commissionSummary.totalCustomers}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
  
    {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'paid')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Commissions</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort by
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'customer')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="customer">Customer</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchCommissionData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Commission Details Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Commission History</h2>
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedDetails.length} of {commissionDetails.length} commissions
          </p>
        </div>

        {filteredAndSortedDetails.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't earned any commissions yet. Start referring customers to earn your first commission!"
                : `No ${filter} commissions found. Try adjusting your filters.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initial Spend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedDetails.map((detail) => (
                  <tr key={detail.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {detail.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {detail.customerEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{detail.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(detail.initialSpend)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(detail.commissionEarned)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(detail.commissionStatus, detail.commissionPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(detail.createdAt)}
                      {detail.commissionPaidDate && (
                        <div className="text-xs text-green-600">
                          Paid: {formatDate(detail.commissionPaidDate)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {filteredAndSortedDetails.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-600">
              Total shown: {filteredAndSortedDetails.length} commissions
            </div>
            <div className="font-medium text-gray-900">
              Total commission: {formatCurrency(
                filteredAndSortedDetails.reduce((sum, detail) => sum + detail.commissionEarned, 0)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};