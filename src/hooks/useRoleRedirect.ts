import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook to redirect users to their appropriate dashboard based on their role
 * @param requiredRole - The role required for the current page
 * @param currentPath - The current path (optional, for logging purposes)
 */
export const useRoleRedirect = (requiredRole?: 'admin' | 'marketer', currentPath?: string) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Don't redirect while loading or if not authenticated
    if (isLoading || !isAuthenticated || !user) {
      return
    }

    // If no specific role is required, no need to redirect
    if (!requiredRole) {
      return
    }

    // If user has the required role, no need to redirect
    if (user.role === requiredRole) {
      return
    }

    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard'
    
    console.log(`Redirecting ${user.role} user from ${currentPath || 'unknown'} to ${redirectPath}`)
    navigate(redirectPath, { replace: true })
  }, [user, isAuthenticated, isLoading, requiredRole, currentPath, navigate])
}

/**
 * Get the appropriate dashboard path for a user role
 * @param role - The user role
 * @returns The dashboard path for the role
 */
export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'marketer':
      return '/dashboard'
    default:
      return '/login'
  }
}

/**
 * Check if a path is appropriate for a user role
 * @param path - The path to check
 * @param role - The user role
 * @returns Whether the path is appropriate for the role
 */
export const isPathAppropriateForRole = (path: string, role: string): boolean => {
  const adminPaths = ['/admin']
  const marketerPaths = ['/dashboard', '/referrals', '/commissions', '/payouts', '/account']
  
  if (role === 'admin') {
    return adminPaths.some(adminPath => path.startsWith(adminPath))
  } else if (role === 'marketer') {
    return marketerPaths.some(marketerPath => path.startsWith(marketerPath))
  }
  
  return false
}