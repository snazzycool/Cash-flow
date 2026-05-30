import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import EarnPage from './pages/EarnPage'
import GamesPage from './pages/GamesPage'
import GamePlayPage from './pages/GamePlayPage'
import DepositPage from './pages/DepositPage'
import WithdrawPage from './pages/WithdrawPage'
import ReferralPage from './pages/ReferralPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/admin/AdminPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage'
import AdminTasksPage from './pages/admin/AdminTasksPage'
import AdminConfigPage from './pages/admin/AdminConfigPage'
import AdminStatsPage from './pages/admin/AdminStatsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, Initialized } = useAuthStore()

  if (loading && !Initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.banned) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Account Banned</h1>
          <p className="text-slate-400 mb-4">
            Your account has been banned for: {user.banned_reason || 'Violation of terms'}
          </p>
          <p className="text-slate-500 text-sm">
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-slate-800 text-white border border-slate-700',
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/earn" element={<EarnPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameType" element={<GamePlayPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }>
          <Route index element={<AdminPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="config" element={<AdminConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
