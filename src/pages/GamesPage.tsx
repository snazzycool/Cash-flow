import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dice1, CircleDollarSign, TrendingUp, ArrowRight, Shield, Percent } from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber } from '../lib/utils'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const games = [
  {
    id: 'dice',
    name: 'Dice Roll',
    description: 'Guess if the dice will roll over or under your target. Adjust your risk for bigger rewards.',
    icon: Dice1,
    rtp: 95,
    minBet: 100,
    maxBet: 100000,
    color: 'from-primary-500 to-primary-400',
    features: ['Adjustable risk', '95% RTP', 'Provably fair'],
  },
  {
    id: 'coin-flip',
    name: 'Coin Flip',
    description: 'Simple heads or tails. Pick a side and double your bet with this classic game.',
    icon: CircleDollarSign,
    rtp: 99,
    minBet: 100,
    maxBet: 50000,
    color: 'from-gold-500 to-gold-400',
    features: ['1.98x payout', '99% RTP', 'Instant result'],
  },
  {
    id: 'pick-card',
    name: 'Pick a Card',
    description: 'Pick one of 52 cards. Find an ace for 10x payout, face cards pay 3x.',
    icon: CircleDollarSign,
    rtp: 90,
    minBet: 100,
    maxBet: 25000,
    color: 'from-accent-500 to-accent-400',
    features: ['Up to 10x payout', '90% RTP', 'Easy to play'],
  },
  {
    id: 'lucky-wheel',
    name: 'Lucky Wheel',
    description: 'Spin the wheel of fortune! Multiple segments with varying multipliers.',
    icon: CircleDollarSign,
    rtp: 85,
    minBet: 100,
    maxBet: 50000,
    color: 'from-pink-500 to-pink-400',
    features: ['Up to 10x multiplier', 'Exciting spin', '85% RTP'],
  },
  {
    id: 'crash',
    name: 'Crash',
    description: 'Watch the multiplier rise and cash out before it crashes. How long will you wait?',
    icon: TrendingUp,
    rtp: 97,
    minBet: 100,
    maxBet: 100000,
    color: 'from-red-500 to-red-400',
    features: ['Unlimited potential', 'Auto cashout', 'Thrilling'],
    comingSoon: true,
  },
]

export default function GamesPage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Games</h1>
          <p className="text-slate-400">Provably fair games - verify every outcome</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
            <span className="text-sm text-slate-400">Balance:</span>
            <span className="text-gold-400 font-bold">{formatNumber(user?.coins || 0)}</span>
          </div>
          <Link to="/deposit">
            <Button variant="accent" size="sm">
              Buy Coins
            </Button>
          </Link>
        </div>
      </div>

      {/* Provably Fair Banner */}
      <Card className="p-4 bg-gradient-to-r from-primary-600/20 to-accent-600/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-500/20">
            <Shield className="w-6 h-6 text-primary-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">All games are provably fair</p>
            <p className="text-sm text-slate-400">Server seeds are pre-committed. You can verify every outcome.</p>
          </div>
        </div>
      </Card>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game, index) => {
          const Icon = game.icon
          const isComingSoon = game.comingSoon

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative overflow-hidden h-full ${isComingSoon ? 'opacity-75' : ''}`}>
                {/* Game Header */}
                <div className={`h-32 bg-gradient-to-br ${game.color} p-6 relative`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative flex items-center justify-between h-full">
                    <Icon className="w-16 h-16 text-white/90" />
                    {isComingSoon && (
                      <span className="px-3 py-1 bg-slate-900/80 rounded-full text-sm font-medium text-white">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Game Body */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{game.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Percent className="w-4 h-4 text-primary-400" />
                      <span className="text-sm text-slate-400">{game.rtp}% RTP</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Min: {formatNumber(game.minBet)}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {game.features.map((feature, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Play Button */}
                  <Link to={isComingSoon ? '#' : `/games/${game.id}`}>
                    <Button
                      variant={isComingSoon ? 'ghost' : 'primary'}
                      className="w-full"
                      disabled={isComingSoon}
                    >
                      {isComingSoon ? 'Coming Soon' : 'Play Now'}
                      {!isComingSoon && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Game History Link */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Want to see your game history?</p>
            <p className="text-sm text-slate-400">Review all your past games and outcomes</p>
          </div>
          <Link to="/profile">
            <Button variant="outline">
              View History
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
