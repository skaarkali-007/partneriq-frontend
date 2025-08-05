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
    const response = await this.get<ReferralLink[]>(`/links/${marketerId}`)
    return response || []
  }

  async createReferralLink(data: CreateReferralLinkRequest): Promise<ReferralLink> {
    return this.post<ReferralLink>('/links', data)
  }

  async getCustomerReferrals(marketerId: string, filters: ReferralFilters): Promise<CustomerReferral[]> {
    const queryParams = new URLSearchParams()
    
    if (filters.status && filters.status !== 'all') {
      queryParams.append('status', filters.status)
    }
    if (filters.product && filters.product !== 'all') {
      queryParams.append('product', filters.product)
    }
    if (filters.dateRange && filters.dateRange !== '0') {
      queryParams.append('days', filters.dateRange)
    }
    if (filters.search) {
      queryParams.append('search', filters.search)
    }
    if (filters.commissionStatus && filters.commissionStatus !== 'all') {
      queryParams.append('commissionStatus', filters.commissionStatus)
    }
    if (filters.source && filters.source !== 'all') {
      queryParams.append('source', filters.source)
    }

    // Use the default axios instance directly to bypass ApiService URL construction issues
    try {
      const response = await api.get(`/marketer/${marketerId}/customers?${queryParams}`)
      return response.data?.data?.referrals || []
    } catch (error) {
      console.error('Error fetching customer referrals:', error)
      throw error
    }
  }

  async getReferralStats(marketerId: string): Promise<ReferralStats> {
    return this.get<ReferralStats>(`/stats/${marketerId}`)
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