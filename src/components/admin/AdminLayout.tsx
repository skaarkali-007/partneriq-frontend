import React, { useEffect, useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { AppDispatch } from '../../store'
import { 
  HomeIcon, 
  UsersIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, requiresMFA: false },
  { name: 'Users', href: '/admin/users', icon: UsersIcon, requiresMFA: true },
  { name: 'Customer Applications', href: '/admin/customer-applications', icon: DocumentTextIcon, requiresMFA: true },
  { name: 'Products', href: '/admin/products', icon: CubeIcon, requiresMFA: false },
  { name: 'Commissions', href: '/admin/commissions', icon: CurrencyDollarIcon, requiresMFA: false },
  { name: 'Payouts', href: '/admin/payouts', icon: DocumentTextIcon, requiresMFA: true },
  { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon, requiresMFA: false },
  { name: 'Activity Logs', href: '/admin/activity', icon: ClockIcon, requiresMFA: false },
]

interface AdminSession {
  loginTime: Date
  lastActivity: Date
  sessionId: string
}

export const AdminLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<AdminSession | null>(null)

  const [showSecurityAlert, setShowSecurityAlert] = useState(false)

  useEffect(() => {
    // Verify admin access
    if (!isAuthenticated || !user || user.role !== 'admin') {
      navigate('/login')
      return
    }

    // Initialize session tracking
    const sessionId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionInfo({
      loginTime: new Date(),
      lastActivity: new Date(),
      sessionId
    })

    // Check MFA status
    if (!user.mfaEnabled) {
      setShowSecurityAlert(true)
    }

    // Set up session activity tracking
    const activityInterval = setInterval(() => {
      setSessionInfo(prev => prev ? { ...prev, lastActivity: new Date() } : null)
    }, 60000) // Update every minute

    return () => clearInterval(activityInterval)
  }, [isAuthenticated, user, navigate])

  const handleLogout = async () => {
    try {
      // Log admin logout
      const token = localStorage.getItem('accessToken')
      if (token) {
        await fetch('/api/v1/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout logging failed:', error)
    } finally {
      dispatch(logout())
      navigate('/login')
    }
  }

  const formatSessionTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`
    }
    return `${minutes}m ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Security Alert Banner */}
      {showSecurityAlert && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                MFA is not enabled for your admin account. Enable it for enhanced security.
              </span>
            </div>
            <button
              onClick={() => setShowSecurityAlert(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/admin' && location.pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                    {item.requiresMFA && (
                      <ShieldCheckIcon className="w-3 h-3 ml-auto text-orange-500" title="Requires MFA" />
                    )}
                  </Link>
                )
              })}
            </nav>
            
            {/* Session Info */}
            {sessionInfo && (
              <div className="px-4 py-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <div className="flex items-center mb-1">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    Session: {formatSessionTime(sessionInfo.loginTime)}
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                    Active
                  </div>
                </div>
              </div>
            )}
            
            {/* User info */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center relative">
                      <span className="text-sm font-medium text-white">
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
                      </span>
                      {user?.mfaEnabled && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" 
                             title="MFA Enabled" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {/* Top bar with breadcrumbs and security status */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Admin</span>
                {location.pathname !== '/admin' && (
                  <>
                    <span>/</span>
                    <span className="text-gray-900 capitalize">
                      {location.pathname.split('/').pop()?.replace('-', ' ')}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {user?.mfaEnabled ? (
                  <div className="flex items-center text-green-600 text-sm">
                    <ShieldCheckIcon className="w-4 h-4 mr-1" />
                    MFA Active
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600 text-sm">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    MFA Disabled
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}