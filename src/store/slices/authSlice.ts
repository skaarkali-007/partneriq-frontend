import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService, LoginCredentials, RegisterData } from '../../services/authService'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'marketer' | 'admin'
  status: 'pending' | 'active' | 'suspended' | 'revoked'
  emailVerified: boolean
  lastLogin?: string
  mfaEnabled: boolean
  mfaSetupCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('token'),
}

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed')
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const refreshToken = state.auth.refreshToken

      if (!refreshToken) {
        return rejectWithValue('No refresh token available')
      }

      const response = await authService.refreshToken(refreshToken)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed')
    }
  }
)

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getProfile()
      return user
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authService.logout()
    } catch (error: any) {
      // Even if logout fails on server, we should clear local state
      console.warn('Logout request failed:', error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },
    clearError: (state) => {
      state.error = null
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string; refreshToken: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        if (!action.payload.requiresMfa) {
          state.user = action.payload.user
          state.token = action.payload.tokens.accessToken
          state.refreshToken = action.payload.tokens.refreshToken
          state.isAuthenticated = true
          localStorage.setItem('token', action.payload.tokens.accessToken)
          localStorage.setItem('refreshToken', action.payload.tokens.refreshToken)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        // Registration typically requires email verification, so no immediate login
        state.user = action.payload.user
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.tokens.accessToken
        state.refreshToken = action.payload.tokens.refreshToken
        localStorage.setItem('token', action.payload.tokens.accessToken)
        localStorage.setItem('refreshToken', action.payload.tokens.refreshToken)
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })
      // Fetch profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        if (action.payload === 'Failed to fetch profile') {
          state.user = null
          state.token = null
          state.refreshToken = null
          state.isAuthenticated = false
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
        }
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })
  },
})

export const { logout, clearError, setCredentials } = authSlice.actions
export default authSlice.reducer