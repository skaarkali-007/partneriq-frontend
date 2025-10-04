import { ApiService } from './api'
import { User } from '../store/slices/authSlice'

export interface LoginCredentials {
  email: string
  password: string
  mfaCode?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse {
  user: User
  tokens: AuthTokens
  requiresMfa: boolean
}

export interface RegisterResponse {
  user: User
  message: string
  emailVerificationRequired: boolean
  tokens?: AuthTokens
}

export interface RefreshTokenResponse {
  tokens: AuthTokens
}



class AuthService extends ApiService {
  constructor() {
    super('/auth')
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.post<LoginResponse>('/login', credentials)
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    return this.post<RegisterResponse>('/register', userData)
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.post<RefreshTokenResponse>('/refresh', { refreshToken })
  }

  async logout(): Promise<void> {
    return this.post<void>('/logout')
  }

  async getProfile(): Promise<User> {
    return this.get<User>('/me')
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    return this.put<User>('/me', profileData)
  }

  async verifyEmail(token: string): Promise<void> {
    return this.post<void>('/verify-email', { token })
  }

  async resendVerificationEmail(): Promise<void> {
    return this.post<void>('/resend-verification')
  }

  async forgotPassword(email: string): Promise<void> {
    return this.post<void>('/forgot-password', { email })
  }

  async resetPassword(token: string, password: string): Promise<void> {
    return this.post<void>('/reset-password', { token, password })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.post<void>('/change-password', { currentPassword, newPassword })
  }

  async skipKYC(): Promise<void> {
    return this.post<void>('/skip-kyc')
  }

}

export const authService = new AuthService()

// Email OTP functions (standalone functions for now)
export const sendEmailOTP = async (email: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/send-email-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to send OTP')
  }
  
  return response.json()
}

export const verifyEmailOTP = async (email: string, otp: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, otp }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to verify OTP')
  }
  
  return response.json()
}

export const verifyEmail = async (token: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email/${token}`, {
    method: 'GET',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to verify email')
  }
  
  return response.json()
}

export const resendVerificationEmail = async (email: string) => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to resend verification email')
  }
  
  return response.json()
}