import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Loader2, TrendingUp, Users, Gift } from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber } from '../lib/utils'
import { getTopEarners, getTopWinners, getReferralLeaderboard } from '../lib/api'
import Card from '../components/ui/Card'
import type { Profile } from '../lib/supabase'

type LeaderboardType = 'earners' | 'winners' | 'referrers'

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [type, setType] = useState<LeaderboardType>('earners')
  const [earners, setEarners] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [referrers, setReferrers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [e, w, r] = await Promise.all([
        getTopEarners(50),
        getTopWinners(50),
        getReferralLeaderboard(50),
      ])
      setEarners(e || [])
      setWinners(w || [])
      setReferrers(r || [])
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getData = () => {
    switch (type) {
      case 'earners':
        return earners
      case 'winners':
        return winners
      case 'referrers':
        return referrers
    }
  }

  const tabs = [
    { id: 'earners' as const, label: 'Top Earners', icon: Gift, color: 'text-gold-400' },
    { id: 'winners' as const, label: 'Top Winners', icon: TrendingUp, color: 'text-primary-400' },
    { id: 'referrers' as const, label: 'Top Referrers', icon: Users, color: 'text-accent-400' },
  ]

  const data = getData()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Leaderboard</h1>
        <p className="text-slate-400">See who's on top</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setType(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                type === tab.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${type !== tab.id ? tab.color : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Leaderboard */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No data yet</p>
            <p className="text-sm">Be the first to appear here!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.map((entry, index) => {
              const isCurrentUser = entry.id === user?.id || entry.referrer_id === user?.id

              let username: string
              let avatarUrl: string
              let value: number

              if (type === 'referrers') {
                username = entry.profiles?.username || 'User'
                avatarUrl = entry.profiles?.avatar_url
                value = entry.total_commission
              } else {
                username = (entry as Profile).username || 'User'
                avatarUrl = (entry as Profile).avatar_url
                value = type === 'earners' ? (entry as Profile).total_earned : (entry as Profile).total_won
              }

              return (
                <motion.div
                  key={entry.id || entry.referrer_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center gap-4 p-4 ${
                    isCurrentUser ? 'bg-primary-500/10' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    index === 0 ? 'bg-gold-500/20 text-gold-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-amber-600/20 text-amber-500' :
                    'text-slate-500'
                  }`}>
                    {index < 3 ? (
                      <Medal className="w-5 h-5" />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {isCurrentUser ? 'You' : username}
                    </p>
                    <p className="text-sm text-slate-400">
                      Level {(entry as Profile).level || 1}
                    </p>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      index === 0 ? 'text-gold-400' :
                      index === 1 ? 'text-slate-300' :
                      index === 2 ? 'text-amber-500' :
                      'text-white'
                    }`}>
                      {formatNumber(value)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {type === 'earners' ? 'coins earned' :
                       type === 'winners' ? 'coins won' :
                       'commission'}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Your Position */}
      {(() => {
        let yourEntry: any = null
        let yourIndex: number = -1

        if (type === 'earners') {
          yourIndex = earners.findIndex(e => e.id === user?.id)
          yourEntry = earners[yourIndex]
        } else if (type === 'winners') {
          yourIndex = winners.findIndex(e => e.id === user?.id)
          yourEntry = winners[yourIndex]
        } else {
          yourIndex = referrers.findIndex(e => e.referrer_id === user?.id)
          yourEntry = referrers[yourIndex]
        }

        if (yourIndex === -1) return null

        return (
          <Card className="p-4 bg-primary-500/10 border border-primary-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Your Position</p>
                <p className="text-lg font-bold text-white">
                  #{yourIndex + 1} on the leaderboard
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">
                  {type === 'earners' ? 'Total earned' :
                   type === 'winners' ? 'Total won' : 'Total commission'}
                </p>
                <p className="text-lg font-bold text-primary-400">
                  {formatNumber(
                    type === 'referrers'
                      ? yourEntry?.total_commission
                      : type === 'earners'
                        ? yourEntry?.total_earned
                        : yourEntry?.total_won
                  )}
                </p>
              </div>
            </div>
          </Card>
        )
      })()}
    </div>
  )
}
