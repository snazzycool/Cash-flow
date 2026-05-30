import { supabase } from './supabase'
import type { GameRound, Transaction, WithdrawalRequest, DepositOrder, TaskSubmission, DailyBonus, AdWatch } from './supabase'
import { generateClientSeed, formatUSD } from './utils'

const API_URL = import.meta.env.VITE_SUPABASE_URL

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// ============================================
// USER & PROFILE
// ============================================

export async function getUserProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updateUsername(username: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', session.user.id)

  if (error) throw error
}

export async function getTransactions(limit = 50, offset = 0) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

export async function getNotifications() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', session.user.id)
    .eq('read', false)

  if (error) throw error
}

// ============================================
// DAILY BONUS
// ============================================

export async function claimDailyBonus(): Promise<DailyBonus> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/daily-bonus`, {
    method: 'POST',
    headers,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to claim daily bonus')
  }

  return result
}

export async function getDailyBonusStatus() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('daily_bonuses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('claimed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// ============================================
// AD REWARDS
// ============================================

export async function watchAd(): Promise<AdWatch> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/watch-ad`, {
    method: 'POST',
    headers,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to watch ad')
  }

  return result
}

export async function getAdWatchStatus() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('ad_watches')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('watched_at', today)
    .order('watched_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================
// TASKS
// ============================================

export async function getAvailableTasks() {
  const { data, error } = await supabase
    .from('simple_tasks')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTaskSubmissions() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('task_submissions')
    .select('*, task:simple_tasks(*)')
    .eq('user_id', session.user.id)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data
}

export async function submitTaskProof(taskId: string, proofUrl: string, proofText: string): Promise<TaskSubmission> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/submit-task`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ taskId, proofUrl, proofText }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to submit task')
  }

  return result
}

// ============================================
// GAMES
// ============================================

export type DiceParams = {
  overUnder: 'over' | 'under'
  target: number
}

export type CoinFlipParams = {
  choice: 'heads' | 'tails'
}

export type PickCardParams = {
  cardIndex: number
}

export type LuckyWheelParams = {
  // No params needed
}

export type CrashParams = {
  autoCashout: number | null
}

export type GameParams = DiceParams | CoinFlipParams | PickCardParams | LuckyWheelParams | CrashParams

export async function playGame(
  gameType: GameRound['game_type'],
  betAmount: number,
  params: GameParams,
  clientSeed?: string
): Promise<GameRound> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/play-game`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      gameType,
      betAmount,
      params,
      clientSeed: clientSeed || generateClientSeed(),
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to play game')
  }

  return result
}

export async function getGameHistory(limit = 20) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('game_rounds')
    .select('*')
    .eq('user_id', session.user.id)
    .order('played_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ============================================
// LUCKY WHEEL (FREE SPIN)
// ============================================

export async function spinLuckyWheel(clientSeed?: string) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/lucky-wheel`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      clientSeed: clientSeed || generateClientSeed(),
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to spin wheel')
  }

  return result
}

// ============================================
// CONVERT COINS TO CASH
// ============================================

export async function convertCoinsToCash(coins: number): Promise<Transaction> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/convert-coins`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ coins }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to convert coins')
  }

  return result
}

export function getConversionPreview(coins: number, exchangeRate: number, feePercent: number) {
  const grossUSD = coins / exchangeRate
  const fee = grossUSD * (feePercent / 100)
  const netUSD = grossUSD - fee
  return {
    coins,
    grossUSD,
    fee,
    netUSD,
    netUSDFormatted: formatUSD(Math.round(netUSD * 100))
  }
}

// ============================================
// WITHDRAW
// ============================================

export type WithdrawalMethod = 'USDT_TRC20' | 'USDT_ERC20' | 'USDC' | 'XRP' | 'BTC' | 'ETH' | 'NIGERIAN_BANK' | 'GREY_BANK' | 'PAYPAL' | 'VENMO'

export async function createWithdrawalRequest(
  amount: number,
  method: WithdrawalMethod,
  details: {
    walletAddress?: string
    bankName?: string
    bankAccountNumber?: string
    bankAccountName?: string
  }
): Promise<WithdrawalRequest> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/withdraw`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount, method, ...details }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create withdrawal request')
  }

  return result
}

export async function getWithdrawalRequests() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================
// DEPOSIT
// ============================================

export type DepositMethod = 'USDT_TRC20' | 'USDT_ERC20' | 'USDC' | 'XRP' | 'BTC' | 'ETH' | 'MANUAL'

export async function getCoinPacks() {
  const { data, error } = await supabase
    .from('coin_packs')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createDepositOrder(
  packId: string,
  method: DepositMethod,
  walletAddress: string
): Promise<DepositOrder> {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/deposit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ packId, method, walletAddress }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create deposit order')
  }

  return result
}

export async function getDepositOrders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('deposit_orders')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================
// REFERRALS
// ============================================

export async function getReferralStats() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Not authenticated')

  const { data: referrals, error: referralError } = await supabase
    .from('referrals')
    .select('*, referred:profiles!referrals_referred_id_fkey(username, created_at)')
    .eq('referrer_id', session.user.id)
    .order('created_at', { ascending: false })

  if (referralError) throw referralError

  const { data: commissions, error: commissionError } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('referrer_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (commissionError) throw commissionError

  const totalCommission = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0
  const totalReferrals = referrals?.length || 0

  return {
    referrals: referrals || [],
    commissions: commissions || [],
    totalCommission,
    totalReferrals,
  }
}

export async function getReferralLeaderboard(limit = 50) {
  const { data: { session } } = await supabase.auth.getSession()

  const { data, error } = await supabase
    .from('referrals')
    .select('referrer_id, profiles!referrals_referrer_id_fkey(username, avatar_url), total_commission')
    .order('total_commission', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// ============================================
// LEADERBOARDS
// ============================================

export async function getTopEarners(limit = 50) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, total_earned, level')
    .order('total_earned', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getTopWinners(limit = 50) {
  const { data: { session } } = await supabase.auth.getSession()

  const { data, error } = await supabase.rpc('get_top_winners', { limit_count: limit })

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: fallback, error: fallbackError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, total_won, level')
      .order('total_won', { ascending: false })
      .limit(limit)

    if (fallbackError) throw fallbackError
    return fallback
  }

  return data
}

// ============================================
// ADMIN
// ============================================

export async function getAdminStats() {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/stats`, {
    method: 'GET',
    headers,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to get admin stats')
  }

  return result
}

export async function getAdminUsers(page = 1, limit = 50) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/users?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to get users')
  }

  return result
}

export async function getAdminWithdrawals(status?: string) {
  const headers = await getHeaders()

  const url = status
    ? `${API_URL}/functions/v1/admin/withdrawals?status=${status}`
    : `${API_URL}/functions/v1/admin/withdrawals`

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to get withdrawals')
  }

  return result
}

export async function processWithdrawal(
  withdrawalId: string,
  action: 'approve' | 'reject',
  notes?: string,
  transactionHash?: string
) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/process-withdrawal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ withdrawalId, action, notes, transactionHash }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to process withdrawal')
  }

  return result
}

export async function createSimpleTask(task: {
  title: string
  description: string
  task_type: string
  proof_type: string
  proof_instructions: string
  reward_coins: number
  max_submissions: number
}) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/create-task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(task),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create task')
  }

  return result
}

export async function reviewTaskSubmission(
  submissionId: string,
  action: 'approve' | 'reject',
  notes?: string
) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/review-task`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ submissionId, action, notes }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to review task')
  }

  return result
}

export async function updateAdminConfig(key: string, value: string) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/config`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ key, value }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update config')
  }

  return result
}

export async function getAdminConfigs() {
  const { data, error } = await supabase
    .from('admin_configs')
    .select('*')
    .order('key')

  if (error) throw error
  return data
}

export async function banUser(userId: string, reason: string) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/ban-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, reason }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to ban user')
  }

  return result
}

export async function adjustUserBalance(userId: string, coins: number, cash: number, reason: string) {
  const headers = await getHeaders()

  const response = await fetch(`${API_URL}/functions/v1/admin/adjust-balance`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, coins, cash, reason }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to adjust balance')
  }

  return result
}

// ============================================
// CONFIG
// ============================================

export async function getExchangeRate(): Promise<number> {
  const { data, error } = await supabase
    .from('admin_configs')
    .select('value')
    .eq('key', 'exchange_rate')
    .maybeSingle()

  if (error || !data) return 10000
  return parseInt(data.value)
}

export async function getConversionFee(): Promise<number> {
  const { data, error } = await supabase
    .from('admin_configs')
    .select('value')
    .eq('key', 'conversion_fee_percent')
    .maybeSingle()

  if (error || !data) return 5
  return parseInt(data.value)
}

export async function getAllConfigs(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('admin_configs')
    .select('*')

  if (error || !data) {
    return {
      exchange_rate: 10000,
      conversion_fee_percent: 5,
      min_withdrawal_usd: 10,
      min_deposit_usd: 5,
      kyc_required_usd: 50,
      max_daily_ads: 10,
      ad_reward_min: 50,
      ad_reward_max: 200,
      daily_bonus_base: 100,
      daily_bonus_increment: 50,
      daily_bonus_max_days: 7,
      referral_signup_bonus: 500,
      referral_commission_percent: 10,
      max_accounts_per_ip: 2,
    }
  }

  const configs: Record<string, number> = {}
  for (const config of data) {
    configs[config.key] = parseInt(config.value)
  }
  return configs
}
