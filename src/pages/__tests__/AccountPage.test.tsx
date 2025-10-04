import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { AccountPage } from '../AccountPage'
import authReducer from '../../store/slices/authSlice'

// Mock the DashboardLayout component
jest.mock('../../components/dashboard/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>
}))

// Mock the API service
jest.mock('../../services/api', () => ({
  default: {
    get: jest.fn()
  }
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockNavigate = jest.fn()

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

describe('AccountPage', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer
      },
      preloadedState: {
        auth: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'marketer' as const,
            status: 'active' as const,
            emailVerified: true,
            mfaEnabled: false,
            mfaSetupCompleted: false,
            kycRequired: true,
            kycCompleted: false,
            kycSkipped: false,
            createdInAlphaStage: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          token: 'test-token',
          refreshToken: 'test-refresh-token',
          isLoading: false,
          error: null,
          isAuthenticated: true
        }
      }
    })

    mockNavigate.mockClear()
  })

  const renderAccountPage = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <AccountPage />
        </BrowserRouter>
      </Provider>
    )
  }

  it('should render account page with KYC tab', async () => {
    renderAccountPage()

    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('KYC Verification')).toBeInTheDocument()
  })

  it('should navigate to KYC verification when Start KYC button is clicked', async () => {
    const api = require('../../services/api').default
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          kycStatus: 'pending'
        }
      }
    })

    renderAccountPage()

    // Click on KYC tab
    fireEvent.click(screen.getByText('KYC Verification'))

    // Wait for the KYC tab content to load
    await waitFor(() => {
      expect(screen.getByText('Identity Verification (KYC)')).toBeInTheDocument()
    })

    // Find and click the Start KYC button
    const startKYCButton = screen.getByText('Start KYC')
    expect(startKYCButton).toBeInTheDocument()

    fireEvent.click(startKYCButton)

    // Verify that navigate was called with correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('/kyc-verification', { state: { skipable: false } })
  })

  it('should show resubmit button for rejected KYC status', async () => {
    const api = require('../../services/api').default
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          kycStatus: 'rejected',
          kycRejectionReason: 'Document not clear'
        }
      }
    })

    renderAccountPage()

    // Click on KYC tab
    fireEvent.click(screen.getByText('KYC Verification'))

    // Wait for the KYC tab content to load
    await waitFor(() => {
      expect(screen.getByText('Resubmit')).toBeInTheDocument()
    })

    // Click the Resubmit button
    fireEvent.click(screen.getByText('Resubmit'))

    // Verify that navigate was called with correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('/kyc-verification', { state: { skipable: false } })
  })

  it('should not show action buttons for approved KYC status', async () => {
    const api = require('../../services/api').default
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          kycStatus: 'approved'
        }
      }
    })

    renderAccountPage()

    // Click on KYC tab
    fireEvent.click(screen.getByText('KYC Verification'))

    // Wait for the KYC tab content to load
    await waitFor(() => {
      expect(screen.getByText('Your identity has been verified successfully')).toBeInTheDocument()
    })

    // Verify no action buttons are present
    expect(screen.queryByText('Start KYC')).not.toBeInTheDocument()
    expect(screen.queryByText('Resubmit')).not.toBeInTheDocument()
  })
})