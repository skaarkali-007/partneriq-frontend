import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { CommissionsPage } from './pages/CommissionsPage'
import { PayoutsPage } from './pages/PayoutsPage'
import { CustomerOnboardingPage } from './pages/CustomerOnboardingPage'
import { LandingPage } from './pages/LandingPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { UserManagementPage } from './pages/admin/UserManagementPage'
import { CustomerApplicationsPage } from './pages/admin/CustomerApplicationsPage'
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage'
import { ProductManagementPage } from './pages/admin/ProductManagementPage'
import { CommissionManagementPage } from './pages/admin/CommissionManagementPage'
import { PayoutManagementPage } from './pages/admin/PayoutManagementPage'
import { OTPVerificationPage } from './pages/OTPVerificationPage'
import { MFASetupPage } from './pages/MFASetupPage'
import { KYCVerificationPage } from './pages/KYCVerificationPage'
import { AccountPage } from './pages/AccountPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/mfa-setup" element={<MFASetupPage />} />
      <Route path="/kyc-verification" element={
        <ProtectedRoute requiredRole="marketer">
          <KYCVerificationPage />
        </ProtectedRoute>
      } />
      <Route path="/onboarding" element={<CustomerOnboardingPage />} />
      <Route path="/landing/:trackingCode" element={<LandingPage />} />
      
      {/* Protected routes for marketers */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiredRole="marketer">
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/referrals" 
        element={
          <ProtectedRoute requiredRole="marketer">
            <ReferralsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/commissions" 
        element={
          <ProtectedRoute requiredRole="marketer">
            <CommissionsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payouts" 
        element={
          <ProtectedRoute requiredRole="marketer">
            <PayoutsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/account" 
        element={
          <ProtectedRoute requiredRole="marketer">
            <AccountPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="customer-applications" element={<CustomerApplicationsPage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="commissions" element={<CommissionManagementPage />} />
        <Route path="payouts" element={<PayoutManagementPage />} />
        <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
        <Route path="activity" element={<ActivityLogsPage />} />
      </Route>
      
      {/* Catch-all route for 404s */}
      <Route path="*" element={<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
          <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
          <a href="/" className="text-blue-600 hover:text-blue-800 underline">Go back to home</a>
        </div>
      </div>} />
    </Routes>
  )
}

export default App