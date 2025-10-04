import { configureStore } from '@reduxjs/toolkit'
import authReducer, { logout, setCredentials } from '../slices/authSlice'

type TestStore = ReturnType<typeof configureStore<{
  auth: ReturnType<typeof authReducer>
}>>

describe('authSlice', () => {
  let store: TestStore

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    })
  })

  it('should handle initial state', () => {
    const state = store.getState().auth
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should handle logout', () => {
    // First set some credentials
    store.dispatch(setCredentials({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'marketer',
        status: 'active',
        emailVerified: true,
        mfaEnabled: false,
        mfaSetupCompleted: false,
        kycRequired: true,
        kycCompleted: false,
        kycSkipped: false,
        createdInAlphaStage: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      token: 'test-token',
      refreshToken: 'test-refresh-token',
    }))

    // Then logout
    store.dispatch(logout())

    const state = store.getState().auth
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should handle setCredentials', () => {
    const userData = {
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
        updatedAt: '2024-01-01T00:00:00Z',
      },
      token: 'test-token',
      refreshToken: 'test-refresh-token',
    }

    store.dispatch(setCredentials(userData))

    const state = store.getState().auth
    expect(state.user).toEqual(userData.user)
    expect(state.token).toBe(userData.token)
    expect(state.refreshToken).toBe(userData.refreshToken)
    expect(state.isAuthenticated).toBe(true)
  })
})