import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store'
import { fetchUserProfile, refreshToken } from '../store/slices/authSlice'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, isLoading, user, error, token } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // If we have a token but no user data, fetch the user profile
    if (token && !user && isAuthenticated && !isLoading) {
      dispatch(fetchUserProfile())
    }
  }, [dispatch, token, user, isAuthenticated, isLoading])

  useEffect(() => {
    // Set up token refresh interval
    if (isAuthenticated && token) {
      const refreshInterval = setInterval(() => {
        dispatch(refreshToken())
      }, 14 * 60 * 1000) // Refresh every 14 minutes (tokens expire in 15 minutes)

      return () => clearInterval(refreshInterval)
    }
  }, [dispatch, isAuthenticated, token])

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    error,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}