import { ApiService } from './api'
import { Commission, CommissionSummary, CommissionFilters, PaginatedResponse } from '../types/api'

export interface CommissionCalculationRequest {
  customerId: string
  productId: string
  initialSpendAmount: number
  trackingCode: string
}

export interface CommissionClawbackRequest {
  commissionId: string
  reason: string
  amount?: number
}

class CommissionService extends ApiService {
  constructor() {
    super('/commissions')
  }

  async getCommissions(filters?: CommissionFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Commission>> {
    // Use the new marketer commission details endpoint
    const response = await fetch('/api/v1/marketer/commission-details', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commissions')
    }
    
    const result = await response.json()
    
    // Transform the data to match the expected format
    const rawCommissions = result.data || []
    const commissions = rawCommissions.map((c: any) => ({
      id: c.customerId,
      productName: c.productName,
      customerId: c.customerName,
      customerEmail: c.customerEmail,
      trackingCode: 'N/A', // Not available in current data
      initialSpendAmount: c.initialSpend,
      commissionAmount: c.commissionEarned,
      commissionRate: c.commissionEarned / c.initialSpend || 0,
      status: c.commissionPaid ? 'paid' : c.commissionStatus,
      conversionDate: c.createdAt,
      approvalDate: c.commissionPaidDate,
      createdAt: c.createdAt
    }))
    
    // Apply client-side filtering if needed
    let filteredCommissions = commissions
    
    if (filters?.status) {
      filteredCommissions = filteredCommissions.filter((c: any) => 
        filters.status === 'paid' ? c.commissionPaid : c.commissionStatus === filters.status
      )
    }
    
    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filteredCommissions = filteredCommissions.filter((c: any) => 
        new Date(c.createdAt) >= fromDate
      )
    }
    
    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo)
      filteredCommissions = filteredCommissions.filter((c: any) => 
        new Date(c.createdAt) <= toDate
      )
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCommissions = filteredCommissions.slice(startIndex, endIndex)
    
    return {
      items: paginatedCommissions,
      page,
      limit,
      total: filteredCommissions.length,
      totalPages: Math.ceil(filteredCommissions.length / limit)
    }
  }

  async getCommissionSummary(): Promise<CommissionSummary> {
    // Use the new marketer dashboard endpoint
    const response = await fetch('/api/v1/marketer/dashboard', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commission summary')
    }
    
    const result = await response.json()
    
    // Transform the commission summary data to match expected format
    const commissionSummary = result.data?.commissionSummary || {}
    
    return {
      totalEarned: commissionSummary.totalCommissionEarned || 0,
      pendingCommissions: commissionSummary.pendingCommission || 0,
      approvedCommissions: 0,
      paidCommissions: 0,
      availableBalance: commissionSummary.totalCommissionEarned || 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      conversionRate: 0,
      totalReferrals: 0,
      successfulReferrals: 0
    }
  }

  async calculateCommission(data: CommissionCalculationRequest): Promise<Commission> {
    return this.post<Commission>('/calculate', data)
  }

  async approveCommission(commissionId: string): Promise<Commission> {
    return this.put<Commission>(`/${commissionId}/approve`)
  }

  async rejectCommission(commissionId: string, reason: string): Promise<Commission> {
    return this.put<Commission>(`/${commissionId}/reject`, { reason })
  }

  async processClawback(data: CommissionClawbackRequest): Promise<void> {
    return this.post<void>('/clawback', data)
  }

  async getCommissionDetails(commissionId: string): Promise<Commission> {
    return this.get<Commission>(`/${commissionId}`)
  }

  async updateCommissionStatus(commissionId: string, status: Commission['status']): Promise<Commission> {
    return this.put<Commission>(`/${commissionId}/status`, { status })
  }

  async getCommissionAnalytics(): Promise<any> {
    // Get commission details first
    const response = await fetch('/api/v1/marketer/commission-details', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch commission analytics')
    }
    
    const result = await response.json()
    const commissions = result.data || []
    
    // Calculate analytics from commission data
    const totalCommissions = commissions.length
    const statusBreakdown = {
      pending: commissions.filter((c: any) => c.commissionStatus === 'pending').length,
      approved: commissions.filter((c: any) => c.commissionStatus === 'approved').length,
      paid: commissions.filter((c: any) => c.commissionPaid).length,
      clawed_back: commissions.filter((c: any) => c.commissionStatus === 'clawed_back').length
    }
    
    // Group by month for trend analysis
    const monthlyData: { [key: string]: { amount: number; count: number } } = {}
    commissions.forEach((c: any) => {
      const date = new Date(c.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 }
      }
      
      monthlyData[monthKey].amount += c.commissionEarned || 0
      monthlyData[monthKey].count += 1
    })
    
    const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count
    }))
    
    // Calculate conversion metrics
    const totalAmount = commissions.reduce((sum: number, c: any) => sum + (c.commissionEarned || 0), 0)
    const averageCommissionAmount = totalCommissions > 0 ? totalAmount / totalCommissions : 0
    
    // Group by product
    const productData: { [key: string]: { amount: number; count: number } } = {}
    commissions.forEach((c: any) => {
      const productName = c.productName || 'Unknown Product'
      
      if (!productData[productName]) {
        productData[productName] = { amount: 0, count: 0 }
      }
      
      productData[productName].amount += c.commissionEarned || 0
      productData[productName].count += 1
    })
    
    const topProducts = Object.entries(productData)
      .map(([productName, data]) => ({
        productId: productName,
        productName,
        totalCommissions: data.amount,
        count: data.count
      }))
      .sort((a, b) => b.totalCommissions - a.totalCommissions)
      .slice(0, 5)
    
    return {
      totalCommissions,
      monthlyTrend,
      statusBreakdown,
      topProducts,
      conversionMetrics: {
        averageCommissionAmount,
        conversionRate: 0, // Would need additional data to calculate
        totalCustomers: commissions.length // Assuming 1 commission per customer
      }
    }
  }
}

export const commissionService = new CommissionService()