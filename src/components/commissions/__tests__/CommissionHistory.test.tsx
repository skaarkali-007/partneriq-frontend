import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { CommissionHistory } from '../CommissionHistory'
import { Commission } from '../../../types/api'

// Mock the formatters
vi.mock('../../../utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}))

const mockCommissions: Commission[] = [
  {
    id: '1',
    marketerId: 'marketer1',
    customerId: 'customer1',
    productId: 'product1',
    trackingCode: 'ABC123',
    initialSpendAmount: 1000,
    commissionRate: 0.05,
    commissionAmount: 50,
    status: 'approved',
    conversionDate: '2024-01-15T10:00:00Z',
    approvalDate: '2024-01-20T10:00:00Z',
    clearancePeriodDays: 30,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
]

const mockPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 1,
  itemsPerPage: 20,
}

describe('CommissionHistory', () => {
  it('renders commission data correctly', () => {
    render(
      <CommissionHistory
        commissions={mockCommissions}
        isLoading={false}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByText('Investment Fund A')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <CommissionHistory
        commissions={[]}
        isLoading={true}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />
    )

    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows empty state when no commissions', () => {
    render(
      <CommissionHistory
        commissions={[]}
        isLoading={false}
        pagination={mockPagination}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByText('No commissions found')).toBeInTheDocument()
  })
})