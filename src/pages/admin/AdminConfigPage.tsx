import { useState, useEffect } from 'react'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import { getAdminConfigs, updateAdminConfig, getAllConfigs } from '../../lib/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

interface ConfigItem {
  key: string
  value: string
  description: string
  category: string
  min?: number
  max?: number
  type?: 'number' | 'text'
}

const configItems: ConfigItem[] = [
  { key: 'exchange_rate', value: '10000', description: 'Coins per USD', category: 'Economy', min: 100 },
  { key: 'conversion_fee_percent', value: '5', description: 'Fee when converting coins to cash (%)', category: 'Economy', min: 0, max: 50 },
  { key: 'min_withdrawal_usd', value: '10', description: 'Minimum withdrawal amount', category: 'Withdrawals', min: 5 },
  { key: 'min_deposit_usd', value: '5', description: 'Minimum deposit amount', category: 'Deposits', min: 1 },
  { key: 'kyc_required_usd', value: '50', description: 'KYC required for withdrawals above this amount', category: 'Withdrawals', min: 0 },
  { key: 'max_daily_ads', value: '10', description: 'Maximum rewarded ads per day', category: 'Rewards', min: 0, max: 50 },
  { key: 'ad_reward_min', value: '50', description: 'Minimum coins per ad', category: 'Rewards', min: 10 },
  { key: 'ad_reward_max', value: '200', description: 'Maximum coins per ad', category: 'Rewards', min: 10 },
  { key: 'daily_bonus_base', value: '100', description: 'Base daily bonus coins', category: 'Rewards', min: 10 },
  { key: 'daily_bonus_increment', value: '50', description: 'Daily bonus increment per streak day', category: 'Rewards', min: 0 },
  { key: 'daily_bonus_max_days', value: '7', description: 'Maximum streak days before reset', category: 'Rewards', min: 1, max: 30 },
  { key: 'referral_signup_bonus', value: '500', description: 'Coins for referrer on successful referral', category: 'Referrals', min: 0 },
  { key: 'referral_commission_percent', value: '10', description: 'Lifetime commission percentage on referrals', category: 'Referrals', min: 0, max: 50 },
  { key: 'max_accounts_per_ip', value: '2', description: 'Maximum accounts allowed per IP', category: 'Anti-Cheat', min: 1, max: 10 },
  { key: 'rtp_dice', value: '95', description: 'Return to player percentage for dice game', category: 'Games', min: 50, max: 99 },
  { key: 'rtp_coin_flip', value: '99', description: 'Return to player percentage for coin flip', category: 'Games', min: 50, max: 99 },
  { key: 'rtp_pick_card', value: '90', description: 'Return to player percentage for pick card', category: 'Games', min: 50, max: 99 },
  { key: 'rtp_lucky_wheel', value: '85', description: 'Return to player percentage for lucky wheel', category: 'Games', min: 50, max: 99 },
]

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    setLoading(true)
    try {
      const c = await getAllConfigs()
      const configMap: Record<string, string> = {}
      for (const key in c) {
        configMap[key] = c[key].toString()
      }
      setConfigs(configMap)
    } catch (error) {
      console.error('Error loading configs:', error)
      // Use default values
      const defaultConfigs: Record<string, string> = {}
      configItems.forEach(item => {
        defaultConfigs[item.key] = item.value
      })
      setConfigs(defaultConfigs)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }))
    setChangedKeys(prev => new Set(prev).add(key))
  }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await updateAdminConfig(key, configs[key])
      toast.success('Config updated')
      setChangedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to update config')
    } finally {
      setSaving(null)
    }
  }

  const handleSaveAll = async () => {
    for (const key of Array.from(changedKeys)) {
      await handleSave(key)
    }
  }

  const categories = [...new Set(configItems.map(item => item.category))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Platform Configuration</h1>
          <p className="text-slate-400">Manage platform settings and parameters</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadConfigs}>
            <RefreshCw className="w-5 h-5" />
            Reload
          </Button>
          {changedKeys.size > 0 && (
            <Button variant="primary" onClick={handleSaveAll}>
              <Save className="w-5 h-5" />
              Save All ({changedKeys.size})
            </Button>
          )}
        </div>
      </div>

      {/* Config Categories */}
      {categories.map(category => (
        <Card key={category} className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">{category}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configItems
              .filter(item => item.category === category)
              .map(item => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-400">{item.description}</label>
                    {saving === item.key && (
                      <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={item.type === 'text' ? 'text' : 'number'}
                      min={item.min}
                      max={item.max}
                      value={configs[item.key] || item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    {changedKeys.has(item.key) && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSave(item.key)}
                        loading={saving === item.key}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {item.min !== undefined || item.max !== undefined ? (
                    <p className="text-xs text-slate-500">
                      Range: {item.min ?? '-∞'} to {item.max ?? '∞'}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>
        </Card>
      ))}

      {/* Danger Zone */}
      <Card className="p-6 border-red-500/30">
        <h2 className="text-lg font-semibold text-red-400 font-display mb-4">Danger Zone</h2>
        <p className="text-slate-400 mb-4">
          changing these values can significantly affect platform economy and user experience.
          Make sure you know what you're doing.
        </p>
        <div className="space-y-2 text-sm text-slate-400">
          <p>• Increasing exchange_rate reduces coin value (more coins per USD)</p>
          <p>• RTP values above 100% will result in losses for the platform</p>
          <p>• Reducing max_accounts_per_ip below 2 will affect legitimate users</p>
        </div>
      </Card>
    </div>
  )
}
