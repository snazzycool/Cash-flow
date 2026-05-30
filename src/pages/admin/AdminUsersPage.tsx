import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Ban, AlertTriangle, DollarSign, Gift, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAdminUsers, banUser, adjustUserBalance } from '../../lib/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { formatNumber, formatUSD, timeAgo } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { Profile } from '../../lib/supabase'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [adjustCoins, setAdjustCoins] = useState(0)
  const [adjustCash, setAdjustCash] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getAdminUsers(page, 20)
      setUsers(data.users || [])
      setTotalPages(Math.ceil((data.total || 0) / 20))
    } catch (error) {
      console.error('Error loading users:', error)
      // Demo data
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleBan = async () => {
    if (!selectedUser || !banReason) {
      toast.error('Please provide a reason')
      return
    }

    setActionLoading(true)
    try {
      await banUser(selectedUser.id, banReason)
      toast.success('User banned')
      setShowBanModal(false)
      setSelectedUser(null)
      setBanReason('')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to ban user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdjust = async () => {
    if (!selectedUser || !adjustReason) {
      toast.error('Please provide a reason')
      return
    }

    if (adjustCoins === 0 && adjustCash === 0) {
      toast.error('Please enter an amount')
      return
    }

    setActionLoading(true)
    try {
      await adjustUserBalance(selectedUser.id, adjustCoins, adjustCash * 100, adjustReason)
      toast.success('Balance adjusted')
      setShowAdjustModal(false)
      setSelectedUser(null)
      setAdjustCoins(0)
      setAdjustCash(0)
      setAdjustReason('')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust balance')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">User Management</h1>
          <p className="text-slate-400">View and manage user accounts</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Coins</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Cash</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Joined</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-slate-800/30 ${user.banned ? 'bg-red-500/5' : user.flagged ? 'bg-gold-500/5' : ''}`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.username}</p>
                          <p className="text-sm text-slate-400">Level {user.level}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gold-400 font-medium">{formatNumber(user.coins)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-primary-400 font-medium">{formatUSD(user.cash_balance)}</span>
                    </td>
                    <td className="p-4">
                      {user.banned ? (
                        <span className="badge badge-danger">Banned</span>
                      ) : user.flagged ? (
                        <span className="badge badge-warning">Flagged</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      {timeAgo(user.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowAdjustModal(true)
                          }}
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowBanModal(true)
                          }}
                          disabled={user.banned}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-slate-400">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Ban Modal */}
      <Modal
        isOpen={showBanModal}
        onClose={() => {
          setShowBanModal(false)
          setSelectedUser(null)
          setBanReason('')
        }}
        title="Ban User"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400">User</p>
              <p className="text-lg font-bold text-white">{selectedUser.username}</p>
            </div>
            <Input
              label="Ban Reason"
              placeholder="Enter reason for banning"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowBanModal(false)
                  setSelectedUser(null)
                  setBanReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleBan}
                loading={actionLoading}
              >
                Ban User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => {
          setShowAdjustModal(false)
          setSelectedUser(null)
          setAdjustCoins(0)
          setAdjustCash(0)
          setAdjustReason('')
        }}
        title="Adjust Balance"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400">User</p>
              <p className="text-lg font-bold text-white">{selectedUser.username}</p>
              <p className="text-sm text-slate-400">
                Coins: {formatNumber(selectedUser.coins)} | Cash: {formatUSD(selectedUser.cash_balance)}
              </p>
            </div>
            <Input
              label="Coins to Add/Subtract"
              type="number"
              value={adjustCoins}
              onChange={(e) => setAdjustCoins(parseInt(e.target.value) || 0)}
              helperText="Use negative numbers to subtract"
            />
            <Input
              label="Cash to Add/Subtract (USD)"
              type="number"
              step="0.01"
              value={adjustCash}
              onChange={(e) => setAdjustCash(parseFloat(e.target.value) || 0)}
              helperText="Use negative numbers to subtract"
            />
            <Input
              label="Reason"
              placeholder="Enter reason for adjustment"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowAdjustModal(false)
                  setSelectedUser(null)
                  setAdjustCoins(0)
                  setAdjustCash(0)
                  setAdjustReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleAdjust}
                loading={actionLoading}
                disabled={!adjustReason || (adjustCoins === 0 && adjustCash === 0)}
              >
                Adjust Balance
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
