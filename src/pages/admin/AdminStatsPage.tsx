import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, DollarSign, Users, Loader2 } from 'lucide-react'
import { getAdminStats } from '../../lib/api'
import Card from '../../components/ui/Card'
import { formatNumber, formatUSD } from '../../lib/utils'

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const s = await getAdminStats()
      setStats(s)
    } catch (error) {
      console.error('Error loading stats:', error)
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Statistics</h1>
        <p className="text-slate-400">Platform performance metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary-400" />
            <span className="text-slate-400 text-sm">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatNumber(stats?.totalUsers || 0)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-slate-400 text-sm">Platform Profit</span>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {formatUSD(((stats?.totalCashDeposited || 0) - (stats?.totalCashWithdrawn || 0)) * 100)}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-gold-400" />
            <span className="text-slate-400 text-sm">Net Deposits</span>
          </div>
          <p className="text-3xl font-bold text-gold-400">{formatUSD((((stats?.totalCashDeposited || 0) - (stats?.totalCashWithdrawn || 0)) * 100))}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-accent-400" />
            <span className="text-slate-400 text-sm">Pending Items</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {(stats?.pendingWithdrawals || 0) + (stats?.pendingTasks || 0)}
          </p>
        </Card>
      </div>

      {/* Revenue Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-6">Revenue Overview</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-xl">
            <p className="text-sm text-primary-300 mb-1">Total Deposited</p>
            <p className="text-3xl font-bold text-white">{formatUSD((stats?.totalCashDeposited || 0) * 100)}</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl">
            <p className="text-sm text-red-300 mb-1">Total Withdrawn</p>
            <p className="text-3xl font-bold text-white">{formatUSD((stats?.totalCashWithdrawn || 0) * 100)}</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl">
            <p className="text-sm text-green-300 mb-1">Net Revenue</p>
            <p className="text-3xl font-bold text-white">
              {formatUSD(((stats?.totalCashDeposited || 0) - (stats?.totalCashWithdrawn || 0)) * 100)}
            </p>
          </div>
        </div>
      </Card>

      {/* Game Statistics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Game Statistics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">House Edge</p>
            <p className="text-2xl font-bold text-white">{stats?.houseEdge || 10}%</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Total Coins in Circulation</p>
            <p className="text-2xl font-bold text-gold-400">{formatNumber(stats?.totalCoinsInCirculation || 0)}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Active Users (7d)</p>
            <p className="text-2xl font-bold text-primary-400">{formatNumber(stats?.activeUsers || 0)}</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Flagged Accounts</p>
            <p className="text-2xl font-bold text-red-400">{stats?.flaggedAccounts || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
