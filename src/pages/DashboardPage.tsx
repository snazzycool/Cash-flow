import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Gift,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  TrendingUp,
  Calendar,
  Video,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber, formatUSD } from '../lib/utils'
import { claimDailyBonus, watchAd, spinLuckyWheel, getDailyBonusStatus, getAdWatchStatus, getAllConfigs } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'
import Confetti from 'react-confetti'

interface QuickStatProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  color: string
}

function QuickStat({ icon: Icon, label, value, trend, trendUp, color }: QuickStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trendUp ? (
                <ArrowUpRight className="w-4 h-4 text-primary-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${trendUp ? 'text-primary-400' : 'text-red-400'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg bg-slate-800`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<Record<string, number>>({})
  const [dailyBonusLoading, setDailyBonusLoading] = useState(false)
  const [adLoading, setAdLoading] = useState(false)
  const [wheelLoading, setWheelLoading] = useState(false)
  const [showWheelResult, setShowWheelResult] = useState(false)
  const [wheelResult, setWheelResult] = useState<{ prize: number; type: string } | null>(null)
  const [dailyClaimed, setDailyClaimed] = useState(false)
  const [adsWatched, setAdsWatched] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadConfigs()
    loadStatus()
  }, [user])

  const loadConfigs = async () => {
    try {
      const c = await getAllConfigs()
      setConfigs(c)
    } catch (error) {
      console.error('Error loading configs:', error)
    }
  }

  const loadStatus = async () => {
    try {
      const [dailyStatus, adStatus] = await Promise.all([
        getDailyBonusStatus(),
        getAdWatchStatus(),
      ])

      if (dailyStatus) {
        const lastClaim = new Date(dailyStatus.claimed_at)
        const now = new Date()
        const hoursDiff = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
        setDailyClaimed(hoursDiff < 24)
      }

      setAdsWatched(adStatus?.length || 0)
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  const handleDailyBonus = async () => {
    setDailyBonusLoading(true)
    try {
      const result = await claimDailyBonus()
      toast.success(`Claimed ${result.coins_awarded} coins! Streak: ${result.streak_count} days`)
      setDailyClaimed(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to claim daily bonus')
    } finally {
      setDailyBonusLoading(false)
    }
  }

  const handleWatchAd = async () => {
    setAdLoading(true)
    try {
      const result = await watchAd()
      toast.success(`Earned ${result.coins_awarded} coins!`)
      setAdsWatched((prev) => prev + 1)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to watch ad')
    } finally {
      setAdLoading(false)
    }
  }

  const handleSpinWheel = async () => {
    setWheelLoading(true)
    try {
      const result = await spinLuckyWheel()
      setWheelResult({ prize: result.prize_amount, type: result.prize_type })
      setShowWheelResult(true)
      if (result.prize_amount > 0) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to spin wheel')
    } finally {
      setWheelLoading(false)
    }
  }

  const quickGames = [
    { name: 'Dice', path: '/games/dice', icon: Target, color: 'from-primary-500 to-primary-400' },
    { name: 'Coin Flip', path: '/games/coin-flip', icon: Zap, color: 'from-gold-500 to-gold-400' },
    { name: 'Pick Card', path: '/games/pick-card', icon: Play, color: 'from-accent-500 to-accent-400' },
    { name: 'Lucky Wheel', path: '/games/lucky-wheel', icon: Gift, color: 'from-pink-500 to-pink-400' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600/20 via-accent-600/20 to-gold-600/20 border border-slate-800 rounded-2xl p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-white">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-slate-400 mt-2">
              You have {formatNumber(user?.coins || 0)} coins ready to play
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="gold"
              onClick={handleDailyBonus}
              loading={dailyBonusLoading}
              disabled={dailyClaimed}
            >
              <Gift className="w-5 h-5" />
              {dailyClaimed ? 'Claimed Today' : 'Daily Bonus'}
            </Button>
            <Button
              variant="accent"
              onClick={handleWatchAd}
              loading={adLoading}
              disabled={adsWatched >= (configs.max_daily_ads || 10)}
            >
              <Video className="w-5 h-5" />
              Watch Ad ({adsWatched}/{configs.max_daily_ads || 10})
            </Button>
            <Button
              variant="primary"
              onClick={handleSpinWheel}
              loading={wheelLoading}
            >
              <Trophy className="w-5 h-5" />
              Free Spin
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat
          icon={Gift}
          label="Total Coins"
          value={formatNumber(user?.coins || 0)}
          color="text-gold-400"
        />
        <QuickStat
          icon={TrendingUp}
          label="Cash Balance"
          value={formatUSD(user?.cash_balance || 0)}
          color="text-primary-400"
        />
        <QuickStat
          icon={Trophy}
          label="Level"
          value={`Level ${user?.level || 1}`}
          color="text-accent-400"
        />
        <QuickStat
          icon={Calendar}
          label="Daily Streak"
          value={`${user?.streak || 0} days`}
          color="text-blue-400"
        />
      </div>

      {/* Quick Games */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white font-display">Quick Games</h2>
          <Link to="/games" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            View all games
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickGames.map((game) => {
            const Icon = game.icon
            return (
              <Link key={game.name} to={game.path}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden bg-gradient-to-br ${game.color} rounded-xl p-4 text-center`}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative">
                    <Icon className="w-8 h-8 mx-auto mb-2 text-white" />
                    <p className="font-semibold text-white">{game.name}</p>
                  </div>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </Card>

      {/* Earn Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white font-display">Ways to Earn</h2>
          <Link to="/earn" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            View all
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            to="/earn"
            className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center">
              <Video className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <p className="font-medium text-white">Watch Ads</p>
              <p className="text-sm text-slate-400">{configs.ad_reward_min}-{configs.ad_reward_max} coins per ad</p>
            </div>
          </Link>

          <Link
            to="/earn"
            className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">Complete Tasks</p>
              <p className="text-sm text-slate-400">Earn coins by doing simple tasks</p>
            </div>
          </Link>

          <Link
            to="/referral"
            className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <p className="font-medium text-white">Referral Program</p>
              <p className="text-sm text-slate-400">10% lifetime commission</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Recent Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">Your Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Total Earned</span>
              <span className="text-gold-400 font-medium">{formatNumber(user?.total_earned || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Total Wagered</span>
              <span className="text-white font-medium">{formatNumber(user?.total_wagered || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400">Total Won</span>
              <span className="text-primary-400 font-medium">{formatNumber(user?.total_won || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">Total Lost</span>
              <span className="text-red-400 font-medium">{formatNumber(user?.total_lost || 0)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/deposit"
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <span className="text-white">Buy Coins</span>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              to="/withdraw"
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <span className="text-white">Withdraw Cash</span>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <span className="text-white">View Leaderboard</span>
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Wheel Result Modal */}
      <Modal
        isOpen={showWheelResult}
        onClose={() => {
          setShowWheelResult(false)
          setWheelResult(null)
          window.location.reload()
        }}
        title="Spin Result"
      >
        <div className="text-center py-8">
          {wheelResult?.prize ? (
            <>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <Gift className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">You Won!</h3>
              <p className="text-4xl font-bold text-gold-400">
                {wheelResult.prize} coins
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-4xl">😔</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Prize</h3>
              <p className="text-slate-400">Better luck next time!</p>
            </>
          )}
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => {
              setShowWheelResult(false)
              setWheelResult(null)
              window.location.reload()
            }}
          >
            Continue
          </Button>
        </div>
      </Modal>
    </div>
  )
}
