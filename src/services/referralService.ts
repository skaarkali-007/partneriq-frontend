import { ApiService } from './api'
import api from './api'
import { ReferralLink, CustomerReferral, ReferralStats, ReferralFilters } from '../types/api'

export interface CreateReferralLinkRequest {
  marketerId: string
  productId: string
  expiresAt?: string
}

export interface ReferralLinksResponse {
  links: ReferralLink[]
}

export interface CustomerReferralsResponse {
  referrals: CustomerReferral[]
  total: number
}

class ReferralService extends ApiService {
  constructor() {
    super('/tracking')
  }

  async getReferralLinks(marketerId: string): Promise<ReferralLink[]> {
    // Use the dashboard endpoint to get referral links data
    try {
      const response = await api.get(`/marketer/dashboard`)
      const dashboardData = response.data?.data || {}
      const referralLinks = dashboardData.referralLinks || []
      
      // Transform the referral links data to match ReferralLink interface
      const links: ReferralLink[] = referralLinks.map((link: any) => ({
        id: link.id,
        marketerId: marketerId,
        productId: link.product !== 'N/A' ? link.product : '',
        productName: link.product !== 'N/A' ? link.product : 'Unknown Product',
        trackingCode: link.trackingCode,
        url: link.url,
        clickCount: link.clickCount || 0,
        conversionCount: link.conversionCount || 0,
        isActive: true,
        createdAt: link.createdAt,
        expiresAt: undefined,
        lastClickAt: undefined,
        metadata: {}
      }))
      
      return links
    } catch (error) {
      console.error('Error fetching referral links:', error)
      throw error
    }
  }

  async createReferralLink(data: CreateReferralLinkRequest): Promise<ReferralLink> {
    return this.post<ReferralLink>('/links', data)
  }

  async getCustomerReferrals(marketerId: string, _filters: ReferralFilters): Promise<CustomerReferral[]> {
    // Use the dashboard endpoint to get customer referrals data
    try {
      const response = await api.get(`/marketer/dashboard`)
      const dashboardData = response.data?.data || {}
      const recentCustomers = dashboardData.recentCustomers || []
      
      // Transform the recent customers data to match CustomerReferral interface
      const referrals: CustomerReferral[] = recentCustomers.map((customer: any) => ({
        id: customer.id,
        marketerId: marketerId,
        customerEmail: customer.email !== 'N/A' ? customer.email : '',
        customerName: customer.name !== 'N/A' ? customer.name : '',
        productName: customer.product !== 'N/A' ? customer.product : '',
        productId: customer.product !== 'N/A' ? customer.product : '',
        trackingCode: '', // Not available in current data
        status: customer.status === 'completed' ? 'converted' : 
                customer.status === 'started' ? 'pending' : 
                customer.status === 'rejected' ? 'rejected' : 'pending',
        source: 'referral_link', // Default source
        referredAt: customer.createdAt,
        convertedAt: customer.status === 'completed' ? customer.createdAt : undefined,
        initialSpend: customer.commissionEarned > 0 ? customer.commissionEarned * 10 : undefined, // Estimate based on commission
        commissionAmount: customer.commissionEarned || 0,
        commissionStatus: customer.commissionEarned > 0 ? 'approved' : 'pending',
        lastActivityAt: customer.createdAt,
        notes: '',
        metadata: {}
      }))
      
      return referrals
    } catch (error) {
      console.error('Error fetching customer referrals:', error)
      throw error
    }
  }

  async getReferralStats(_marketerId: string): Promise<ReferralStats> {
    // Use the dashboard endpoint to get performance metrics
    try {
      const response = await api.get(`/marketer/dashboard`)
      const dashboardData = response.data?.data || {}
      const performanceMetrics = dashboardData.performanceMetrics || {}
      const commissionSummary = dashboardData.commissionSummary || {}
      
      // Transform the performance metrics to match ReferralStats interface
      const stats: ReferralStats = {
        totalClicks: performanceMetrics.totalClicks || 0,
        totalConversions: performanceMetrics.totalConversions || 0,
        conversionRate: (performanceMetrics.conversionRate || 0) / 100, // Convert percentage to decimal
        totalCommissions: commissionSummary.totalEarned || 0,
        pendingCommissions: commissionSummary.pendingAmount || 0,
        approvedCommissions: commissionSummary.approvedAmount || 0,
        paidCommissions: commissionSummary.paidAmount || 0,


      }
      
      return stats
    } catch (error) {
      console.error('Error fetching referral stats:', error)
      throw error
    }
  }

  async updateReferralLink(id: string, data: Partial<ReferralLink>): Promise<ReferralLink> {
    return this.put<ReferralLink>(`/links/${id}`, data)
  }

  async deleteReferralLink(id: string): Promise<void> {
    return this.delete<void>(`/links/${id}`)
  }

  async trackClick(trackingCode: string, data: any): Promise<void> {
    return this.post<void>('/clicks', { trackingCode, ...data })
  }

  async trackConversion(trackingCode: string, data: any): Promise<void> {
    return this.post<void>('/conversions', { trackingCode, ...data })
  }
}

export const referralService = new ReferralService()