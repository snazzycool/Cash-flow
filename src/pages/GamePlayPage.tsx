import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dice1, CircleDollarSign, ArrowLeft,
  History, ChevronDown, ChevronUp, Play, AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber } from '../lib/utils'
import { playGame, getGameHistory } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'
import type { GameRound } from '../lib/supabase'

const gameConfig: Record<string, {
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  minBet: number
  maxBet: number
}> = {
  dice: { name: 'Dice Roll', icon: Dice1, color: 'from-primary-500', minBet: 100, maxBet: 100000 },
  'coin-flip': { name: 'Coin Flip', icon: CircleDollarSign, color: 'from-gold-500', minBet: 100, maxBet: 50000 },
  'pick-card': { name: 'Pick a Card', icon: CircleDollarSign, color: 'from-accent-500', minBet: 100, maxBet: 25000 },
  'lucky-wheel': { name: 'Lucky Wheel', icon: CircleDollarSign, color: 'from-pink-500', minBet: 100, maxBet: 50000 },
}

export default function GamePlayPage() {
  const { gameType } = useParams<{ gameType: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const config = gameConfig[gameType || '']

  const [betAmount, setBetAmount] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GameRound | null>(null)
  const [history, setHistory] = useState<GameRound[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Dice specific
  const [target, setTarget] = useState(50)
  const [overUnder, setOverUnder] = useState<'over' | 'under'>('over')

  // Coin flip specific
  const [coinChoice, setCoinChoice] = useState<'heads' | 'tails'>('heads')

  // Pick card specific
  const [selectedCard, setSelectedCard] = useState<number | null>(null)

  useEffect(() => {
    if (config) {
      loadHistory()
    }
  }, [gameType])

  const loadHistory = async () => {
    try {
      const h = await getGameHistory(10)
      setHistory(h.filter((g: GameRound) => g.game_type === gameType?.toUpperCase().replace('-', '_')))
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const handlePlay = async () => {
    if (betAmount > (user?.coins || 0)) {
      toast.error('Insufficient balance')
      return
    }

    if (betAmount < (config?.minBet || 100)) {
      toast.error(`Minimum bet is ${formatNumber(config?.minBet || 100)}`)
      return
    }

    setLoading(true)
    setResult(null)

    try {
      let params: any = {}

      switch (gameType) {
        case 'dice':
          params = { overUnder, target }
          break
        case 'coin-flip':
          params = { choice: coinChoice }
          break
        case 'pick-card':
          if (selectedCard === null) {
            toast.error('Please select a card')
            setLoading(false)
            return
          }
          params = { cardIndex: selectedCard }
          break
        case 'lucky-wheel':
          params = {}
          break
      }

      const r = await playGame(
        gameType?.toUpperCase().replace('-', '_') as any,
        betAmount,
        params
      )
      setResult(r)
      loadHistory()

      if (r.win) {
        toast.success(`You won ${formatNumber(r.payout)} coins!`)
      } else {
        toast.error('You lost. Better luck next time!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to play game')
    } finally {
      setLoading(false)
    }
  }

  if (!config) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <p className="text-white text-lg">Game not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/games')}>
          Back to Games
        </Button>
      </div>
    )
  }

  const Icon = config.icon

  const calculateDicePayout = () => {
    if (gameType !== 'dice') return 0
    const winChance = overUnder === 'over' ? (100 - target) / 100 : target / 100
    const multiplier = 0.99 / winChance
    return Math.floor(betAmount * multiplier)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/games')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Games
      </button>

      {/* Game Header */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.color} p-8`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Icon className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white font-display">{config.name}</h1>
            <p className="text-white/80">Min: {formatNumber(config.minBet)} | Max: {formatNumber(config.maxBet)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/70 text-sm">Balance</p>
            <p className="text-2xl font-bold text-white">{formatNumber(user?.coins || 0)}</p>
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Bet Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Bet Amount</label>
            <div className="flex gap-3">
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                min={config.minBet}
                max={config.maxBet}
              />
              <Button variant="outline" onClick={() => setBetAmount(Math.floor((user?.coins || 0) / 2))}>
                Half
              </Button>
              <Button variant="outline" onClick={() => setBetAmount(user?.coins || 0)}>
                Max
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000, 25000, 50000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    betAmount === amount ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {formatNumber(amount)}
                </button>
              ))}
            </div>
          </div>

          {/* Dice Specific Controls */}
          {gameType === 'dice' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={overUnder === 'under' ? 'primary' : 'outline'}
                  onClick={() => setOverUnder('under')}
                  className="flex-1"
                >
                  <ChevronDown className="w-5 h-5" />
                  Under
                </Button>
                <Button
                  variant={overUnder === 'over' ? 'primary' : 'outline'}
                  onClick={() => setOverUnder('over')}
                  className="flex-1"
                >
                  <ChevronUp className="w-5 h-5" />
                  Over
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Target: {target}</label>
                <input
                  type="range"
                  min={2}
                  max={98}
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Win Chance</p>
                  <p className="text-2xl font-bold text-white">
                    {overUnder === 'over' ? (100 - target) : target}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Payout</p>
                  <p className="text-2xl font-bold text-gold-400">{formatNumber(calculateDicePayout())}</p>
                </div>
              </div>
            </div>
          )}

          {/* Coin Flip Controls */}
          {gameType === 'coin-flip' && (
            <div className="flex gap-4">
              <Button
                variant={coinChoice === 'heads' ? 'gold' : 'outline'}
                onClick={() => setCoinChoice('heads')}
                className="flex-1 py-6"
              >
                <span className="text-2xl mr-2">👑</span>
                Heads
              </Button>
              <Button
                variant={coinChoice === 'tails' ? 'gold' : 'outline'}
                onClick={() => setCoinChoice('tails')}
                className="flex-1 py-6"
              >
                <span className="text-2xl mr-2">🦅</span>
                Tails
              </Button>
            </div>
          )}

          {/* Pick Card Controls */}
          {gameType === 'pick-card' && (
            <div>
              <p className="text-sm text-slate-400 mb-3">Select a card (1-52)</p>
              <div className="grid grid-cols-13 gap-1">
                {Array.from({ length: 52 }, (_, i) => i + 1).map((card) => (
                  <button
                    key={card}
                    onClick={() => setSelectedCard(card)}
                    className={`aspect-[2/3] rounded flex items-center justify-center text-xs font-medium transition-all ${
                      selectedCard === card
                        ? 'bg-accent-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {card}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Play Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handlePlay}
            loading={loading}
            disabled={loading || betAmount > (user?.coins || 0) || betAmount < config.minBet}
          >
            <Play className="w-5 h-5" />
            Play for {formatNumber(betAmount)} coins
          </Button>
        </div>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className={`p-6 ${result.win ? 'border-primary-500/50 bg-primary-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
              <div className="text-center">
                <p className={`text-4xl font-bold mb-2 ${result.win ? 'text-primary-400' : 'text-red-400'}`}>
                  {result.win ? 'YOU WON!' : 'YOU LOST'}
                </p>
                <p className="text-2xl text-white">{formatNumber(result.payout)} coins</p>
                <div className="mt-4 p-4 bg-slate-900/50 rounded-lg text-left">
                  <p className="text-sm text-slate-400 mb-2">Game Details:</p>
                  <pre className="text-xs text-slate-300 overwrite-hidden">{JSON.stringify(result.result, null, 2)}</pre>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <Card className="p-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <span className="font-medium text-white">Recent Games</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No games played yet</p>
                ) : (
                  history.map((game) => (
                    <div
                      key={game.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        game.win ? 'bg-primary-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      <div>
                        <p className="text-white font-medium">
                          {game.win ? '+' + formatNumber(game.payout) : '-' + formatNumber(game.bet_amount)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(game.played_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`badge ${game.win ? 'badge-success' : 'badge-danger'}`}>
                        {game.win ? 'Won' : 'Lost'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
