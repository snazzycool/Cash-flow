import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Copy, AlertCircle, Wallet, Loader2, Info, CheckCircle, Clock } from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber, formatUSD } from '../lib/utils'
import { convertCoinsToCash, createWithdrawalRequest, getWithdrawalRequests, getAllConfigs, getConversionPreview } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'
import type { WithdrawalRequest } from '../lib/supabase'

const cryptoMethods = [
  { id: 'USDT_TRC20', name: 'USDT (TRC20)', symbol: 'USDT', icon: '💵', network: 'Tron', minFee: 1, recommended: true },
  { id: 'USDT_ERC20', name: 'USDT (ERC20)', symbol: 'USDT', icon: '💵', network: 'Ethereum', minFee: 5 },
  { id: 'USDC', name: 'USDC', symbol: 'USDC', icon: '🔵', network: 'Ethereum', minFee: 5 },
  { id: 'XRP', name: 'XRP (Ripple)', symbol: 'XRP', icon: '💧', network: 'Ripple', minFee: 1 },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', icon: '🪙', network: 'Bitcoin', minFee: 2 },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: '💎', network: 'Ethereum', minFee: 5 },
]

const bankMethods = [
  { id: 'NIGERIAN_BANK', name: 'Nigerian Bank Transfer', icon: '🏦', description: 'Direct transfer to Nigerian banks', minFee: 2 },
  { id: 'GREY_BANK', name: 'Grey (Foreign Bank)', icon: '🌍', description: 'International bank via Grey', minFee: 3 },
]

const comingSoonMethods = [
  { id: 'PAYPAL', name: 'PayPal', icon: '💳', description: 'Coming soon' },
  { id: 'VENMO', name: 'Venmo', icon: '📱', description: 'Coming soon' },
]

export default function WithdrawPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<Record<string, number>>({})
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Convert state
  const [convertCoins, setConvertCoins] = useState(0)
  const [convertLoading, setConvertLoading] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Withdraw state
  const [withdrawMethod, setWithdrawMethod] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const [walletAddress, setWalletAddress] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [c, w] = await Promise.all([
        getAllConfigs(),
        getWithdrawalRequests(),
      ])
      setConfigs(c)
      setWithdrawals(w)
    } catch (error) {
      console.error('Error loading withdrawal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (convertCoins > (user?.coins || 0)) {
      toast.error('Insufficient coins')
      return
    }

    if (convertCoins < configs.exchange_rate) {
      toast.error(`Minimum conversion is ${formatNumber(configs.exchange_rate)} coins`)
      return
    }

    setConvertLoading(true)
    try {
      await convertCoinsToCash(convertCoins)
      toast.success('Coins converted successfully!')
      setShowConvertModal(false)
      setConvertCoins(0)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to convert coins')
    } finally {
      setConvertLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (withdrawAmount < configs.min_withdrawal_usd * 100) {
      toast.error(`Minimum withdrawal is $${configs.min_withdrawal_usd}`)
      return
    }

    if (withdrawAmount > (user?.cash_balance || 0)) {
      toast.error('Insufficient cash balance')
      return
    }

    if (!withdrawMethod) {
      toast.error('Please select a withdrawal method')
      return
    }

    if (cryptoMethods.some(m => m.id === withdrawMethod) && !walletAddress) {
      toast.error('Please enter your wallet address')
      return
    }

    if (bankMethods.some(m => m.id === withdrawMethod) && (!bankName || !bankAccountNumber || !bankAccountName)) {
      toast.error('Please fill in all bank details')
      return
    }

    setWithdrawLoading(true)
    try {
      await createWithdrawalRequest(
        withdrawAmount,
        withdrawMethod as any,
        {
          walletAddress,
          bankName,
          bankAccountNumber,
          bankAccountName,
        }
      )
      toast.success('Withdrawal request submitted!')
      setShowWithdrawModal(false)
      setWithdrawAmount(0)
      setWalletAddress('')
      setBankName('')
      setBankAccountNumber('')
      setBankAccountName('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create withdrawal request')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const conversionPreview = getConversionPreview(convertCoins, configs.exchange_rate || 10000, configs.conversion_fee_percent || 5)

  const calculateWithdrawFee = () => {
    const method = [...cryptoMethods, ...bankMethods].find(m => m.id === withdrawMethod)
    return method?.minFee || 0
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
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Withdraw</h1>
        <p className="text-slate-400">Convert coins to cash and withdraw your earnings</p>
      </div>

      {/* Balance Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gold-500/20 flex items-center justify-center">
              <span className="text-2xl">🪙</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400">Coin Balance</p>
              <p className="text-2xl font-bold text-gold-400">{formatNumber(user?.coins || 0)}</p>
            </div>
            <Button variant="primary" onClick={() => setShowConvertModal(true)}>
              Convert to Cash
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400">Cash Balance</p>
              <p className="text-2xl font-bold text-primary-400">{formatUSD(user?.cash_balance || 0)}</p>
            </div>
            <Button
              variant="accent"
              onClick={() => setShowWithdrawModal(true)}
              disabled={(user?.cash_balance || 0) < configs.min_withdrawal_usd * 100}
            >
              Withdraw
            </Button>
          </div>
        </Card>
      </div>

      {/* Conversion Rate Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-5 h-5 text-accent-400" />
          <span className="font-medium text-white">Conversion Rates</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Exchange Rate</p>
            <p className="text-lg font-bold text-white">{formatNumber(configs.exchange_rate || 10000)} coins = $1</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Conversion Fee</p>
            <p className="text-lg font-bold text-white">{configs.conversion_fee_percent || 5}%</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Min Withdrawal</p>
            <p className="text-lg font-bold text-white">${configs.min_withdrawal_usd || 10}</p>
          </div>
        </div>
      </Card>

      {/* Withdrawal Methods */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Withdrawal Methods</h2>

        {/* Crypto Methods */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Cryptocurrency</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cryptoMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg"
              >
                <span className="text-2xl">{method.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{method.name}</p>
                  <p className="text-xs text-slate-400">{method.network}</p>
                </div>
                {method.recommended && (
                  <span className="badge badge-success text-xs">Recommended</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bank Methods */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Bank Transfer</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {bankMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg"
              >
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-medium text-white">{method.name}</p>
                  <p className="text-xs text-slate-400">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-3">Coming Soon</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {comingSoonMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-lg opacity-60"
              >
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <p className="font-medium text-white">{method.name}</p>
                  <p className="text-xs text-slate-400">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Recent Withdrawals */}
      {withdrawals.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">Withdrawal History</h2>
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {w.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-primary-400" />
                  ) : w.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-gold-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">{formatUSD(w.amount)}</p>
                    <p className="text-sm text-slate-400">
                      {w.method} • {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  w.status === 'completed' ? 'badge-success' :
                  w.status === 'pending' || w.status === 'processing' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => {
          setShowConvertModal(false)
          setConvertCoins(0)
        }}
        title="Convert Coins to Cash"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Your Coin Balance</p>
            <p className="text-2xl font-bold text-gold-400">{formatNumber(user?.coins || 0)}</p>
          </div>

          <Input
            label="Coins to Convert"
            type="number"
            value={convertCoins}
            onChange={(e) => setConvertCoins(parseInt(e.target.value) || 0)}
            min={configs.exchange_rate || 10000}
            max={user?.coins || 0}
          />

          {convertCoins > 0 && (
            <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Coins</span>
                <span className="text-white">{formatNumber(convertCoins)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Gross USD</span>
                <span className="text-white">${conversionPreview.grossUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fee ({configs.conversion_fee_percent}%)</span>
                <span className="text-red-400">-${conversionPreview.fee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between">
                  <span className="text-white font-medium">You'll receive</span>
                  <span className="text-xl font-bold text-primary-400">{conversionPreview.netUSDFormatted}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setShowConvertModal(false)
                setConvertCoins(0)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConvert}
              loading={convertLoading}
              disabled={convertCoins < (configs.exchange_rate || 10000)}
            >
              Convert
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false)
          setWithdrawMethod('')
          setWithdrawAmount(0)
        }}
        title="Request Withdrawal"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400">Available Cash Balance</p>
            <p className="text-2xl font-bold text-primary-400">{formatUSD(user?.cash_balance || 0)}</p>
          </div>

          {/* Amount */}
          <div>
            <Input
              label="Withdrawal Amount (USD)"
              type="number"
              value={withdrawAmount / 100}
              onChange={(e) => setWithdrawAmount(Math.round(parseFloat(e.target.value) * 100))}
              min={configs.min_withdrawal_usd || 10}
              helperText={`Minimum: $${configs.min_withdrawal_usd || 10}`}
            />
          </div>

          {/* Method Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Method</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {[...cryptoMethods, ...bankMethods].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setWithdrawMethod(method.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                    withdrawMethod === method.id
                      ? 'bg-primary-500/20 border border-primary-500/50'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xl">{method.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{method.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Address (for crypto) */}
          {cryptoMethods.some(m => m.id === withdrawMethod) && (
            <Input
              label="Your Wallet Address"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          )}

          {/* Bank Details */}
          {bankMethods.some(m => m.id === withdrawMethod) && (
            <div className="space-y-4">
              <Input
                label="Bank Name"
                placeholder="Enter bank name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                label="Account Number"
                placeholder="Enter account number"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
              <Input
                label="Account Name"
                placeholder="Enter account holder name"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
            </div>
          )}

          {/* Summary */}
          {withdrawAmount > 0 && withdrawMethod && (
            <div className="p-4 bg-slate-800/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="text-white">{formatUSD(withdrawAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fee</span>
                <span className="text-red-400">-{formatUSD(calculateWithdrawFee() * 100)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <div className="flex justify-between">
                  <span className="text-white font-medium">You'll receive</span>
                  <span className="text-lg font-bold text-primary-400">
                    {formatUSD(withdrawAmount - calculateWithdrawFee() * 100)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* KYC Warning */}
          {withdrawAmount > (configs.kyc_required_usd || 50) * 100 && !user?.kyc_verified && (
            <div className="p-4 bg-gold-500/10 border border-gold-500/30 rounded-lg">
              <p className="text-sm text-gold-400">
                Withdrawals over ${configs.kyc_required_usd || 50} require KYC verification.
                Please verify your identity in your profile settings.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setShowWithdrawModal(false)
                setWithdrawMethod('')
                setWithdrawAmount(0)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              className="flex-1"
              onClick={handleWithdraw}
              loading={withdrawLoading}
              disabled={!withdrawMethod || withdrawAmount < (configs.min_withdrawal_usd || 10) * 100}
            >
              Request Withdrawal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
