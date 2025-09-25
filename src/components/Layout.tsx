import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../store/slices/authSlice'
import { AppDispatch } from '../store'
import AccountStatusBanner from './AccountStatusBanner'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/partner-iq-logo.svg" alt="Partner IQ" width="60" height="16" />
            </Link>
            
            <nav className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'marketer' && (
                    <>
                      <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                        Dashboard
                      </Link>
                      <Link to="/referrals" className="text-gray-600 hover:text-gray-900">
                        Referrals
                      </Link>
                      <Link to="/commissions" className="text-gray-600 hover:text-gray-900">
                        Commissions
                      </Link>
                      <Link to="/payouts" className="text-gray-600 hover:text-gray-900">
                        Payouts
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="text-gray-600 hover:text-gray-900">
                      Admin
                    </Link>
                  )}
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Welcome, {user?.firstName || user?.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      {isAuthenticated && <AccountStatusBanner />}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}