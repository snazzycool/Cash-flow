import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User, Mail, Shield, TrendingUp, ArrowUpRight, ArrowDownRight,
  History, Award, Calendar, Loader2, Edit2, Save
} from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber, formatUSD, timeAgo } from '../lib/utils'
import { getTransactions, getGameHistory, updateUsername } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'
import type { Transaction, GameRound } from '../lib/supabase'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [games, setGames] = useState<GameRound[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [t, g] = await Promise.all([
        getTransactions(50),
        getGameHistory(50),
      ])
      setTransactions(t)
      setGames(g)
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }

    setSaving(true)
    try {
      await updateUsername(newUsername)
      toast.success('Username updated!')
      setEditing(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update username')
    } finally {
      setSaving(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARN':
      case 'GAME_WIN':
      case 'BONUS':
      case 'DAILY_BONUS':
      case 'AD_REWARD':
      case 'OFFER_REWARD':
      case 'TASK_REWARD':
      case 'WHEEL_SPIN':
      case 'REFERRAL':
      case 'DEPOSIT':
        return <ArrowUpRight className="w-4 h-4 text-primary-400" />
      case 'SPEND':
      case 'GAME_LOSS':
      case 'CONVERT_TO_CASH':
      case 'WITHDRAW':
        return <ArrowDownRight className="w-4 h-4 text-red-400" />
      default:
        return <ArrowUpRight className="w-4 h-4 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  const winRate = user?.total_wagered && user.total_wagered > 0
    ? ((user.total_won / user.total_wagered) * 100).toFixed(1)
    : '0'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-48"
                  />
                  <Button variant="primary" size="sm" onClick={handleSaveUsername} loading={saving}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
                  <button
                    onClick={() => {
                      setNewUsername(user?.username || '')
                      setEditing(true)
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                <span>{user?.email_verified ? 'Verified' : 'Unverified'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>Level {user?.level}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(user?.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-400">Coins</p>
              <p className="text-2xl font-bold text-gold-400">{formatNumber(user?.coins || 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-400">Cash</p>
              <p className="text-2xl font-bold text-primary-400">{formatUSD(user?.cash_balance || 0)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-sm">Total Earned</span>
          </div>
          <p className="text-2xl font-bold text-gold-400">{formatNumber(user?.total_earned || 0)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Won</span>
          </div>
          <p className="text-2xl font-bold text-primary-400">{formatNumber(user?.total_won || 0)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Lost</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatNumber(user?.total_lost || 0)}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Win Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{winRate}%</p>
        </Card>
      </div>

      {/* Game History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white font-display">Game History</h2>
        </div>
        {games.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No games played yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {games.map((game) => (
              <div
                key={game.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  game.win ? 'bg-primary-500/10' : 'bg-red-500/10'
                }`}
              >
                <div>
                  <p className="font-medium text-white">{game.game_type.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-400">
                    Bet: {formatNumber(game.bet_amount)} • {timeAgo(game.played_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${game.win ? 'text-primary-400' : 'text-red-400'}`}>
                    {game.win ? '+' + formatNumber(game.payout) : '-' + formatNumber(game.bet_amount)}
                  </p>
                  <span className={`badge text-xs ${game.win ? 'badge-success' : 'badge-danger'}`}>
                    {game.win ? 'Won' : 'Lost'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Transaction History */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-white font-display">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="font-medium text-white">{tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-slate-400">
                      {timeAgo(tx.created_at)}
                      {tx.description && ` • ${tx.description}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    ['EARN', 'BONUS', 'GAME_WIN', 'DEPOSIT', 'REFERRAL', 'AD_REWARD'].includes(tx.type)
                      ? 'text-primary-400'
                      : 'text-red-400'
                  }`}>
                    {['EARN', 'BONUS', 'GAME_WIN', 'DEPOSIT', 'REFERRAL', 'AD_REWARD'].includes(tx.type) ? '+' : ''}
                    {formatNumber(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
