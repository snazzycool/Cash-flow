import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ExternalLink, Loader2, Filter } from 'lucide-react'
import { getAdminWithdrawals, processWithdrawal } from '../../lib/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { formatNumber, formatUSD, timeAgo } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { WithdrawalRequest } from '../../lib/supabase'

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [notes, setNotes] = useState('')
  const [transactionHash, setTransactionHash] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadWithdrawals()
  }, [filter])

  const loadWithdrawals = async () => {
    setLoading(true)
    try {
      const data = await getAdminWithdrawals(filter === 'all' ? undefined : filter)
      setWithdrawals(data.withdrawals || [])
    } catch (error) {
      console.error('Error loading withdrawals:', error)
      // Demo data
      setWithdrawals([])
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) return

    setActionLoading(true)
    try {
      await processWithdrawal(selectedWithdrawal.id, action, notes, transactionHash)
      toast.success(`Withdrawal ${action === 'approve' ? 'approved' : 'rejected'}`)
      setShowProcessModal(false)
      setSelectedWithdrawal(null)
      setNotes('')
      setTransactionHash('')
      loadWithdrawals()
    } catch (error: any) {
      toast.error(error.message || 'Failed to process withdrawal')
    } finally {
      setActionLoading(false)
    }
  }

  const getMethodDisplay = (method: string) => {
    const methods: Record<string, string> = {
      USDT_TRC20: 'USDT (TRC20)',
      USDT_ERC20: 'USDT (ERC20)',
      USDC: 'USDC',
      XRP: 'XRP',
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      NIGERIAN_BANK: 'Nigerian Bank',
      GREY_BANK: 'Grey Bank',
      PAYPAL: 'PayPal',
      VENMO: 'Venmo',
    }
    return methods[method] || method
  }

  const statusColors: Record<string, string> = {
    pending: 'badge-warning',
    processing: 'badge-info',
    completed: 'badge-success',
    rejected: 'badge-danger',
    cancelled: 'badge-danger',
  }

  const filteredWithdrawals = filter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.status === filter)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Withdrawal Requests</h1>
          <p className="text-slate-400">Review and process withdrawal requests</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-gold-400">
            {withdrawals.filter(w => w.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Processing</p>
          <p className="text-2xl font-bold text-blue-400">
            {withdrawals.filter(w => w.status === 'processing').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Completed</p>
          <p className="text-2xl font-bold text-primary-400">
            {withdrawals.filter(w => w.status === 'completed').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-400">Total Value (Pending)</p>
          <p className="text-2xl font-bold text-accent-400">
            {formatUSD(withdrawals.filter(w => w.status === 'pending').reduce((a, b) => a + b.amount, 0))}
          </p>
        </Card>
      </div>

      {/* Withdrawals List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p>No withdrawal requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Method</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Details</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredWithdrawals.map((withdrawal) => (
                  <motion.tr
                    key={withdrawal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/30"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">User</p>
                        <p className="text-xs text-slate-400">#{withdrawal.user_id.substring(0, 8)}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-primary-400 font-bold">{formatUSD(withdrawal.amount)}</span>
                      {withdrawal.fee > 0 && (
                        <p className="text-xs text-slate-400">Fee: {formatUSD(withdrawal.fee)}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-white">{getMethodDisplay(withdrawal.method)}</span>
                    </td>
                    <td className="p-4">
                      {withdrawal.method.includes('BANK') ? (
                        <div className="text-sm">
                          <p className="text-slate-400">{withdrawal.bank_name}</p>
                          <p className="text-white">{withdrawal.bank_account_number}</p>
                        </div>
                      ) : (
                        <code className="text-sm text-slate-400">
                          {withdrawal.wallet_address?.substring(0, 20)}...
                        </code>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${statusColors[withdrawal.status]}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {timeAgo(withdrawal.created_at)}
                    </td>
                    <td className="p-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal)
                              setShowProcessModal(true)
                            }}
                          >
                            Process
                          </Button>
                        </div>
                      )}
                      {withdrawal.transaction_hash && (
                        <code className="text-xs text-primary-400">
                          {withdrawal.transaction_hash.substring(0, 16)}...
                        </code>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Process Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false)
          setSelectedWithdrawal(null)
          setNotes('')
          setTransactionHash('')
        }}
        title="Process Withdrawal"
        maxWidth="lg"
      >
        {selectedWithdrawal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">User</p>
                <p className="text-lg font-bold text-white">User #{selectedWithdrawal.user_id.substring(0, 8)}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Amount</p>
                <p className="text-lg font-bold text-primary-400">{formatUSD(selectedWithdrawal.amount)}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Payment Details</p>
              <p className="text-white font-medium">{getMethodDisplay(selectedWithdrawal.method)}</p>
              {selectedWithdrawal.method.includes('BANK') ? (
                <div className="mt-2">
                  <p className="text-slate-400">Bank: {selectedWithdrawal.bank_name}</p>
                  <p className="text-slate-400">Account: {selectedWithdrawal.bank_account_number}</p>
                  <p className="text-slate-400">Name: {selectedWithdrawal.bank_account_name}</p>
                </div>
              ) : (
                <code className="text-sm text-slate-300 block mt-2 break-all">
                  {selectedWithdrawal.wallet_address}
                </code>
              )}
            </div>

            <Input
              label="Transaction Hash (for approval)"
              placeholder="Enter transaction hash"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Admin Notes</label>
              <textarea
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 min-h-[80px]"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleProcess('reject')}
                loading={actionLoading}
              >
                <X className="w-5 h-5" />
                Reject
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleProcess('approve')}
                loading={actionLoading}
              >
                <Check className="w-5 h-5" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
