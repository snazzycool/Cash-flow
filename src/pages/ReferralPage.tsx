import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Copy, Share2, Award, TrendingUp, Gift, Loader2, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber, formatUSD } from '../lib/utils'
import { getReferralStats, getReferralLeaderboard, getAllConfigs } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import toast from 'react-hot-toast'

export default function ReferralPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<Record<string, number>>({})
  const [stats, setStats] = useState<{
    referrals: any[]
    commissions: any[]
    totalCommission: number
    totalReferrals: number
  } | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [c, s, l] = await Promise.all([
        getAllConfigs(),
        getReferralStats(),
        getReferralLeaderboard(50),
      ])
      setConfigs(c)
      setStats(s)
      setLeaderboard(l || [])
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referral_code || '')
    toast.success('Referral code copied!')
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/signup?ref=${user?.referral_code}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
  }

  const shareLink = async () => {
    const link = `${window.location.origin}/signup?ref=${user?.referral_code}`
    const text = `Join CoinQuest and start earning! Use my referral code: ${user?.referral_code}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'CoinQuest', text, url: link })
      } catch (error) {
        // User cancelled share
      }
    } else {
      copyReferralLink()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  const referralLink = `${window.location.origin}/signup?ref=${user?.referral_code}`

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Referral Program</h1>
          <p className="text-slate-400">Invite friends and earn lifetime commissions</p>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-slate-400">Total Referrals</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats?.totalReferrals || 0}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gold-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-gold-400" />
            </div>
            <span className="text-slate-400">Total Commission</span>
          </div>
          <p className="text-3xl font-bold text-gold-400">{formatNumber(stats?.totalCommission || 0)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-accent-400" />
            </div>
            <span className="text-slate-400">Signup Bonus</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatNumber(configs.referral_signup_bonus || 500)}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400">Commission Rate</span>
          </div>
          <p className="text-3xl font-bold text-white">{configs.referral_commission_percent || 10}%</p>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Your Referral Link</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Your Code</p>
              <p className="text-2xl font-mono font-bold text-white">{user?.referral_code}</p>
            </div>
            <Button variant="outline" onClick={copyReferralCode}>
              <Copy className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 p-4 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
              <p className="text-sm text-slate-400 mb-1">Share Link</p>
              <p className="text-white truncate">{referralLink}</p>
            </div>
            <Button variant="outline" onClick={copyReferralLink}>
              <Copy className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={shareLink}>
              <Share2 className="w-5 h-5" />
              Share Link
            </Button>
          </div>
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="font-medium text-white mb-2">Share Your Link</h3>
            <p className="text-sm text-slate-400">
              Send your unique referral link to friends via social media, email, or any platform.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="font-medium text-white mb-2">Friend Signs Up</h3>
            <p className="text-sm text-slate-400">
              When they sign up using your link, you both get bonus coins!
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="font-medium text-white mb-2">Earn Lifetime</h3>
            <p className="text-sm text-slate-400">
              Get 10% commission on everything your referrals earn from tasks, forever!
            </p>
          </div>
        </div>
      </Card>

      {/* Referral History */}
      {stats?.referrals && stats.referrals.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">Your Referrals</h2>
          <div className="space-y-3">
            {stats.referrals.map((referral: any) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {referral.referred?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{referral.referred?.username || 'User'}</p>
                    <p className="text-xs text-slate-400">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gold-400 font-medium">+{formatNumber(referral.total_commission)} coins</p>
                  <p className="text-xs text-slate-400">Total commission</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Top Referrers</h2>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No leaderboard data yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry: any, index: number) => {
              const isCurrentUser = entry.referrer_id === user?.id
              return (
                <div
                  key={entry.referrer_id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < 3 ? 'bg-gold-500/20 text-gold-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      <span className="font-bold">{index + 1}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {entry.profiles?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-medium text-white">
                      {isCurrentUser ? 'You' : entry.profiles?.username || 'User'}
                    </span>
                  </div>
                  <p className="text-gold-400 font-medium">{formatNumber(entry.total_commission)}</p>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
