import { Outlet, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Wallet,
  Gift,
  Gamepad2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Trophy,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '../../store'
import { formatNumber } from '../../lib/utils'
import NotificationDropdown from '../notifications/NotificationDropdown'
import { getNotifications } from '../../lib/api'

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/earn', icon: Gift, label: 'Earn' },
  { path: '/games', icon: Gamepad2, label: 'Games' },
  { path: '/deposit', icon: ArrowDownToLine, label: 'Deposit' },
  { path: '/withdraw', icon: ArrowUpFromLine, label: 'Withdraw' },
  { path: '/referral', icon: Users, label: 'Referrals' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
]

export default function Layout() {
  const { user, signOut, isAdmin } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const notifications = await getNotifications()
          setUnreadCount(notifications.filter((n: { read: boolean }) => !n.read).length)
        } catch (error) {
          console.error('Error fetching notifications:', error)
        }
      }
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold font-display neon-text">CoinQuest</span>
            </Link>
          </div>

          {/* User balance */}
          <div className="p-4 border-b border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Coins</span>
                <span className="font-bold text-gold-400">
                  {formatNumber(user?.coins || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Cash</span>
                <span className="font-bold text-primary-400">
                  ${((user?.cash_balance || 0) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Admin Panel</span>
                </Link>
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-slate-800">
            <Link
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-slate-500">Level {user?.level}</p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all mt-1"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title (visible on desktop) */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-white font-display">
                {navItems.find((item) => item.path === location.pathname)?.label || 'CoinQuest'}
              </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Balance display (mobile) */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gold-500/20 px-3 py-1.5 rounded-full">
                  <div className="coin-icon">C</div>
                  <span className="text-sm font-bold text-gold-400">
                    {formatNumber(user?.coins || 0)}
                  </span>
                </div>
              </div>

              {/* Notifications */}
              <NotificationDropdown unreadCount={unreadCount} />

              {/* Profile (desktop) */}
              <Link
                to="/profile"
                className="hidden lg:flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-medium text-white">{user?.username}</p>
                  <p className="text-xs text-slate-400">Level {user?.level}</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
