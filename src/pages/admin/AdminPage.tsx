import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, DollarSign, ArrowDownToLine, ArrowUpFromLine,
  TrendingUp, AlertTriangle, Gift, Loader2
} from 'lucide-react'
import { getAdminStats } from '../../lib/api'
import Card from '../../components/ui/Card'
import { formatNumber, formatUSD } from '../../lib/utils'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const s = await getAdminStats()
      setStats(s)
    } catch (error) {
      console.error('Error loading admin stats:', error)
      // Show demo stats
      setStats({
        totalUsers: 1250,
        activeUsers: 450,
        totalCoinsInCirculation: 50000000,
        totalCashDeposited: 25000,
        totalCashWithdrawn: 15000,
        pendingWithdrawals: 5,
        pendingTasks: 12,
        flaggedAccounts: 3,
        houseEdge: 15,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
      </div>
    )
  }

  const quickLinks = [
    { label: 'User Management', path: '/admin/users', icon: Users, color: 'from-primary-500' },
    { label: 'Withdrawals', path: '/admin/withdrawals', icon: ArrowUpFromLine, color: 'from-accent-500' },
    { label: 'Tasks', path: '/admin/tasks', icon: Gift, color: 'from-gold-500' },
    { label: 'Settings', path: '/admin/config', icon: AlertTriangle, color: 'from-red-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Admin Dashboard</h1>
        <p className="text-slate-400">Platform overview and management</p>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatNumber(stats?.totalUsers || 0)}</p>
          <p className="text-sm text-primary-400 mt-1">{formatNumber(stats?.activeUsers || 0)} active</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-gold-400" />
            </div>
            <span className="text-slate-400 text-sm">Coins in Circulation</span>
          </div>
          <p className="text-3xl font-bold text-gold-400">{formatNumber(stats?.totalCoinsInCirculation || 0)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-accent-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Deposited</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatUSD(stats?.totalCashDeposited * 100 || 0)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Withdrawn</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatUSD(stats?.totalCashWithdrawn * 100 || 0)}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, index) => {
          const Icon = link.icon
          return (
            <Link key={link.path} to={link.path}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className={`p-5 bg-gradient-to-br ${link.color}/10 hover:${link.color}/20 border border-slate-800 transition-all`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{link.label}</p>
                      {link.path === '/admin/withdrawals' && stats?.pendingWithdrawals > 0 && (
                        <p className="text-sm text-accent-400">{stats.pendingWithdrawals} pending</p>
                      )}
                      {link.path === '/admin/tasks' && stats?.pendingTasks > 0 && (
                        <p className="text-sm text-gold-400">{stats.pendingTasks} pending review</p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>
          )
        })}
      </div>

      {/* Alerts */}
      {(stats?.flaggedAccounts > 0 || stats?.withdrawals > 0) && (
        <Card className="p-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-medium text-white">Alerts</span>
          </div>
          <div className="space-y-2">
            {stats?.flaggedAccounts > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                <span className="text-red-400">Flagged accounts requiring review</span>
                <span className="font-bold text-white">{stats.flaggedAccounts}</span>
              </div>
            )}
            {stats?.pendingWithdrawals > 0 && (
              <div className="flex items-center justify-between p-3 bg-gold-500/10 rounded-lg">
                <span className="text-gold-400">Withdrawal requests pending</span>
                <span className="font-bold text-white">{stats.pendingWithdrawals}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Platform Health */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Platform Health</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">House Edge (Games)</p>
            <p className="text-2xl font-bold text-white">{stats?.houseEdge || 10}%</p>
            <p className="text-xs text-green-400 mt-1">Healthy</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Conversion Fee</p>
            <p className="text-2xl font-bold text-white">5%</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Platform Profit</p>
            <p className="text-2xl font-bold text-primary-400">
              {formatUSD(((stats?.totalCashDeposited || 0) - (stats?.totalCashWithdrawn || 0)) * 100)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
