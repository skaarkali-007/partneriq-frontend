import { ApiService } from './api'
import { PayoutRequest, PaymentMethod, PayoutFilters, PaginatedResponse } from '../types/api'

export interface PayoutRequestData {
  amount: number
  paymentMethodId: string
}

export interface PaymentMethodData {
  methodType: 'bank_transfer' | 'paypal' | 'stripe' | 'bitcoin' | 'ethereum' | 'usdc' | 'usdt'
  accountDetails: Record<string, any>
  isDefault: boolean
}

export interface BalanceResponse {
  availableBalance: number
  pendingBalance: number
  totalEarned: number
  lastPayoutDate?: string
}

class PayoutService extends ApiService {
  constructor() {
    super('/payouts')
  }

  async getPayoutRequests(filters?: PayoutFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<PayoutRequest>> {
    const queryParams = new URLSearchParams()
    queryParams.append('page', page.toString())
    queryParams.append('limit', limit.toString())
    
    if (filters?.status) {
      queryParams.append('status', filters.status)
    }
    if (filters?.dateFrom) {
      queryParams.append('dateFrom', filters.dateFrom)
    }
    if (filters?.dateTo) {
      queryParams.append('dateTo', filters.dateTo)
    }
    if (filters?.minAmount) {
      queryParams.append('minAmount', filters.minAmount.toString())
    }
    if (filters?.maxAmount) {
      queryParams.append('maxAmount', filters.maxAmount.toString())
    }

    return this.get<PaginatedResponse<PayoutRequest>>(`?${queryParams}`)
  }

  async createPayoutRequest(data: PayoutRequestData): Promise<PayoutRequest> {
    return this.post<PayoutRequest>('/request', data)
  }

  async getBalance(): Promise<BalanceResponse> {
    return this.get<BalanceResponse>('/balance')
  }

  async approvePayoutRequest(payoutId: string): Promise<PayoutRequest> {
    return this.put<PayoutRequest>(`/${payoutId}/approve`)
  }

  async processPayoutRequest(payoutId: string): Promise<PayoutRequest> {
    return this.post<PayoutRequest>(`/${payoutId}/process`)
  }

  async cancelPayoutRequest(payoutId: string): Promise<PayoutRequest> {
    return this.put<PayoutRequest>(`/${payoutId}/cancel`)
  }

  async getPayoutDetails(payoutId: string): Promise<PayoutRequest> {
    return this.get<PayoutRequest>(`/${payoutId}`)
  }
}

class PaymentMethodService extends ApiService {
  constructor() {
    super('/payment-methods')
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return this.get<PaymentMethod[]>('')
  }

  async addPaymentMethod(data: PaymentMethodData): Promise<PaymentMethod> {
    return this.post<PaymentMethod>('', data)
  }

  async updatePaymentMethod(id: string, data: Partial<PaymentMethodData>): Promise<PaymentMethod> {
    return this.put<PaymentMethod>(`/${id}`, data)
  }

  async deletePaymentMethod(id: string): Promise<void> {
    return this.delete<void>(`/${id}`)
  }

  async verifyPaymentMethod(id: string): Promise<PaymentMethod> {
    return this.post<PaymentMethod>(`/${id}/verify`)
  }

  async setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
    return this.put<PaymentMethod>(`/${id}/default`)
  }
}

export const payoutService = new PayoutService()
export const paymentMethodService = new PaymentMethodService()