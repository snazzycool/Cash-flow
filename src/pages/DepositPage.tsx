import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Copy, Check, ExternalLink, AlertCircle, Loader2, Wallet } from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber, formatUSD } from '../lib/utils'
import { getCoinPacks, createDepositOrder, getDepositOrders, getAllConfigs } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'
import type { CoinPack, DepositOrder } from '../lib/supabase'

const cryptoOptions = [
  { id: 'USDT_TRC20', name: 'USDT (TRC20)', symbol: 'USDT', icon: '💵', network: 'Tron (low fees)' },
  { id: 'USDT_ERC20', name: 'USDT (ERC20)', symbol: 'USDT', icon: '💵', network: 'Ethereum' },
  { id: 'USDC', name: 'USDC', symbol: 'USDC', icon: '🔵', network: 'Ethereum' },
  { id: 'XRP', name: 'XRP (Ripple)', symbol: 'XRP', icon: '💧', network: 'Ripple' },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', icon: '🪙', network: 'Bitcoin' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: '💎', network: 'Ethereum' },
]

const depositWallets: Record<string, string> = {
  USDT_TRC20: 'TXyz123456789abcdefghijklmnopqrstuvwx',
  USDT_ERC20: '0x1234567890123456789012345678901234567890',
  USDC: '0x1234567890123456789012345678901234567890',
  XRP: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  BTC: 'bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  ETH: '0x1234567890123456789012345678901234567890',
}

export default function DepositPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<Record<string, number>>({})
  const [coinPacks, setCoinPacks] = useState<CoinPack[]>([])
  const [orders, setOrders] = useState<DepositOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null)
  const [selectedCrypto, setSelectedCrypto] = useState<string>('')
  const [walletAddress, setWalletAddress] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [c, packs, o] = await Promise.all([
        getAllConfigs(),
        getCoinPacks(),
        getDepositOrders(),
      ])
      setConfigs(c)
      setCoinPacks(packs)
      setOrders(o)
    } catch (error) {
      console.error('Error loading deposit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!selectedPack || !selectedCrypto || !walletAddress) {
      toast.error('Please fill in all fields')
      return
    }

    setCreateLoading(true)
    try {
      await createDepositOrder(selectedPack.id, selectedCrypto as any, walletAddress)
      toast.success('Deposit order created! Send the exact amount to the provided address.')
      setShowDepositModal(false)
      setSelectedPack(null)
      setSelectedCrypto('')
      setWalletAddress('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create deposit order')
    } finally {
      setCreateLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Buy Coins</h1>
          <p className="text-slate-400">Purchase coin packs using cryptocurrency</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
          <Wallet className="w-5 h-5 text-gold-400" />
          <span className="text-white font-medium">{formatNumber(user?.coins || 0)} coins</span>
        </div>
      </div>

      {/* Coin Packs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {coinPacks.map((pack, index) => {
          const totalCoins = pack.coins + pack.bonus_coins
          return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-5 relative overflow-hidden cursor-pointer transition-all hover:border-primary-500/50 ${
                  pack.popular ? 'border-primary-500/50' : ''
                }`}
                onClick={() => {
                  setSelectedPack(pack)
                  setShowDepositModal(true)
                }}
              >
                {pack.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="badge badge-success">Popular</span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{pack.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-bold text-gold-400">${pack.price_usd}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Base Coins</span>
                    <span className="text-white">{formatNumber(pack.coins)}</span>
                  </div>
                  {pack.bonus_coins > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-400">Bonus Coins</span>
                      <span className="text-primary-400">+{formatNumber(pack.bonus_coins)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total</span>
                      <span className="text-xl font-bold text-white">{formatNumber(totalCoins)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="primary" className="w-full">
                  Buy Now
                </Button>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Payment Methods Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Accepted Cryptocurrencies</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cryptoOptions.map((crypto) => (
            <div
              key={crypto.id}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
            >
              <span className="text-2xl">{crypto.icon}</span>
              <div>
                <p className="font-medium text-white">{crypto.name}</p>
                <p className="text-xs text-slate-400">{crypto.network}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">Recent Deposits</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-white">
                    {formatNumber(order.coins + order.bonus_coins)} coins
                  </p>
                  <p className="text-sm text-slate-400">
                    ${order.amount_usd} via {order.method}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`badge ${
                    order.status === 'completed' ? 'badge-success' :
                    order.status === 'pending' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deposit Modal */}
      <Modal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false)
          setSelectedCrypto('')
          setWalletAddress('')
        }}
        title="Complete Purchase"
        maxWidth="lg"
      >
        {selectedPack && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Package</span>
                <span className="text-white font-medium">{selectedPack.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Price</span>
                <span className="text-gold-400 font-bold">${selectedPack.price_usd}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Coins</span>
                <span className="text-white">{formatNumber(selectedPack.coins)}</span>
              </div>
              {selectedPack.bonus_coins > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-primary-400">Bonus</span>
                  <span className="text-primary-400">+{formatNumber(selectedPack.bonus_coins)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">You'll receive</span>
                  <span className="text-xl font-bold text-white">
                    {formatNumber(selectedPack.coins + selectedPack.bonus_coins)}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Cryptocurrency */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {cryptoOptions.map((crypto) => (
                  <button
                    key={crypto.id}
                    onClick={() => setSelectedCrypto(crypto.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                      selectedCrypto === crypto.id
                        ? 'bg-primary-500/20 border border-primary-500/50 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xl">{crypto.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{crypto.symbol}</p>
                      <p className="text-xs text-slate-500">{crypto.network}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Your Wallet Address */}
            <Input
              label="Your Wallet Address (for refund)"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />

            {/* Deposit Address Info */}
            {selectedCrypto && (
              <div className="p-4 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                <p className="text-sm text-gold-300 mb-2">
                  After clicking "Create Order", you'll receive a deposit address to send your payment.
                </p>
                <p className="text-xs text-gold-400/70">
                  Minimum deposit: ${configs.min_deposit_usd || 5}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowDepositModal(false)
                  setSelectedCrypto('')
                  setWalletAddress('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                onClick={handleCreateOrder}
                loading={createLoading}
                disabled={!selectedCrypto || !walletAddress}
              >
                Create Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
