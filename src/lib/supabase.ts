import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type Tables = {
  profiles: {
    Row: {
      id: string
      username: string
      avatar_url: string
      coins: number
      cash_balance: number
      total_earned: number
      total_wagered: number
      total_won: number
      total_lost: number
      referral_code: string
      referred_by: string | null
      streak: number
      level: number
      daily_ads_watched: number
      last_ad_reset: string
      last_daily_bonus: string | null
      last_wheel_spin: string | null
      lucky_streak: number
      email_verified: boolean
      kyc_verified: boolean
      kyc_document_url: string
      banned: boolean
      banned_reason: string
      flagged: boolean
      flagged_reason: string
      fingerprint: string
      ip_registration: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      username: string
      avatar_url?: string
      coins?: number
      cash_balance?: number
      total_earned?: number
      total_wagered?: number
      total_won?: number
      total_lost?: number
      referral_code?: string
      referred_by?: string | null
      streak?: number
      level?: number
      daily_ads_watched?: number
      last_ad_reset?: string
      last_daily_bonus?: string | null
      last_wheel_spin?: string | null
      lucky_streak?: number
      email_verified?: boolean
      kyc_verified?: boolean
      kyc_document_url?: string
      banned?: boolean
      banned_reason?: string
      flagged?: boolean
      flagged_reason?: string
      fingerprint?: string
      ip_registration?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      username?: string
      avatar_url?: string
      coins?: number
      cash_balance?: number
      total_earned?: number
      total_wagered?: number
      total_won?: number
      total_lost?: number
      referral_code?: string
      referred_by?: string | null
      streak?: number
      level?: number
      daily_ads_watched?: number
      last_ad_reset?: string
      last_daily_bonus?: string | null
      last_wheel_spin?: string | null
      lucky_streak?: number
      email_verified?: boolean
      kyc_verified?: boolean
      kyc_document_url?: string
      banned?: boolean
      banned_reason?: string
      flagged?: boolean
      flagged_reason?: string
      fingerprint?: string
      ip_registration?: string | null
      created_at?: string
      updated_at?: string
    }
  }
  transactions: {
    Row: {
      id: string
      user_id: string
      type: 'EARN' | 'SPEND' | 'CONVERT_TO_CASH' | 'CONVERT_FROM_COINS' | 'DEPOSIT' | 'WITHDRAW' | 'REFERRAL' | 'BONUS' | 'GAME_WIN' | 'GAME_LOSS' | 'DAILY_BONUS' | 'AD_REWARD' | 'OFFER_REWARD' | 'TASK_REWARD' | 'WHEEL_SPIN' | 'ADMIN_ADJUST'
      amount: number
      balance_before: number
      balance_after: number
      description: string
      related_entity_type: string
      related_entity_id: string | null
      metadata: Record<string, unknown>
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      type: 'EARN' | 'SPEND' | 'CONVERT_TO_CASH' | 'CONVERT_FROM_COINS' | 'DEPOSIT' | 'WITHDRAW' | 'REFERRAL' | 'BONUS' | 'GAME_WIN' | 'GAME_LOSS' | 'DAILY_BONUS' | 'AD_REWARD' | 'OFFER_REWARD' | 'TASK_REWARD' | 'WHEEL_SPIN' | 'ADMIN_ADJUST'
      amount: number
      balance_before: number
      balance_after: number
      description?: string
      related_entity_type?: string
      related_entity_id?: string | null
      metadata?: Record<string, unknown>
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      type?: 'EARN' | 'SPEND' | 'CONVERT_TO_CASH' | 'CONVERT_FROM_COINS' | 'DEPOSIT' | 'WITHDRAW' | 'REFERRAL' | 'BONUS' | 'GAME_WIN' | 'GAME_LOSS' | 'DAILY_BONUS' | 'AD_REWARD' | 'OFFER_REWARD' | 'TASK_REWARD' | 'WHEEL_SPIN' | 'ADMIN_ADJUST'
      amount?: number
      balance_before?: number
      balance_after?: number
      description?: string
      related_entity_type?: string
      related_entity_id?: string | null
      metadata?: Record<string, unknown>
      created_at?: string
    }
  }
  game_rounds: {
    Row: {
      id: string
      user_id: string
      game_type: 'DICE' | 'COIN_FLIP' | 'PICK_CARD' | 'LUCKY_WHEEL' | 'CRASH'
      bet_amount: number
      game_params: Record<string, unknown>
      server_seed: string
      server_seed_hash: string
      client_seed: string
      nonce: number
      result: Record<string, unknown>
      payout: number
      win: boolean
      rtp: number
      played_at: string
    }
    Insert: {
      id?: string
      user_id: string
      game_type: 'DICE' | 'COIN_FLIP' | 'PICK_CARD' | 'LUCKY_WHEEL' | 'CRASH'
      bet_amount: number
      game_params: Record<string, unknown>
      server_seed: string
      server_seed_hash: string
      client_seed?: string
      nonce?: number
      result: Record<string, unknown>
      payout: number
      win: boolean
      rtp: number
      played_at?: string
    }
  }
  withdrawal_requests: {
    Row: {
      id: string
      user_id: string
      amount: number
      fee: number
      method: 'USDT_TRC20' | 'USDT_ERC20' | 'USDC' | 'XRP' | 'BTC' | 'ETH' | 'NIGERIAN_BANK' | 'GREY_BANK' | 'PAYPAL' | 'VENMO'
      wallet_address: string
      bank_name: string
      bank_account_number: string
      bank_account_name: string
      status: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'
      transaction_hash: string
      admin_notes: string
      processed_by: string | null
      processed_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      amount: number
      fee?: number
      method: 'USDT_TRC20' | 'USDT_ERC20' | 'USDC' | 'XRP' | 'BTC' | 'ETH' | 'NIGERIAN_BANK' | 'GREY_BANK' | 'PAYPAL' | 'VENMO'
      wallet_address?: string
      bank_name?: string
      bank_account_number?: string
      bank_account_name?: string
      status?: 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'
      transaction_hash?: string
      admin_notes?: string
      processed_by?: string | null
      processed_at?: string | null
      created_at?: string
    }
  }
  deposit_orders: {
    Row: {
      id: string
      user_id: string
      amount_usd: number
      coins: number
      bonus_coins: number
      method: 'USDT_TRC20' | 'USDT_ERC20' | 'USDC' | 'XRP' | 'BTC' | 'ETH' | 'MANUAL'
      wallet_address: string
      payment_address: string
      transaction_hash: string
      status: 'pending' | 'confirmed' | 'completed' | 'expired' | 'cancelled'
      expires_at: string | null
      confirmed_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      amount_usd: number
      coins: number
      bonus_coins?: number
      method: 'USDT_TRC20' | 'USDT_ERC20' | 'USDC' | 'XRP' | 'BTC' | 'ETH' | 'MANUAL'
      wallet_address: string
      payment_address?: string
      transaction_hash?: string
      status?: 'pending' | 'confirmed' | 'completed' | 'expired' | 'cancelled'
      expires_at?: string | null
      confirmed_at?: string | null
      created_at?: string
    }
  }
  coin_packs: {
    Row: {
      id: string
      name: string
      price_usd: number
      coins: number
      bonus_coins: number
      bonus_percent: number
      popular: boolean
      active: boolean
      display_order: number
      created_at: string
    }
    Insert: {
      id?: string
      name: string
      price_usd: number
      coins: number
      bonus_coins?: number
      bonus_percent?: number
      popular?: boolean
      active?: boolean
      display_order?: number
      created_at?: string
    }
  }
  referrals: {
    Row: {
      id: string
      referrer_id: string
      referred_id: string
      signup_bonus_paid: boolean
      signup_bonus_amount: number
      total_commission: number
      created_at: string
    }
    Insert: {
      id?: string
      referrer_id: string
      referred_id: string
      signup_bonus_paid?: boolean
      signup_bonus_amount?: number
      total_commission?: number
      created_at?: string
    }
  }
  referral_commissions: {
    Row: {
      id: string
      referrer_id: string
      referred_id: string
      source_type: 'TASK' | 'AD' | 'OFFER' | 'BONUS'
      source_id: string | null
      commission_rate: number
      commission_amount: number
      created_at: string
    }
  }
  notifications: {
    Row: {
      id: string
      user_id: string
      type: 'REFERRAL' | 'BONUS' | 'WITHDRAWAL' | 'DEPOSIT' | 'GAME' | 'TASK' | 'SYSTEM' | 'WARNING' | 'LEVEL_UP'
      title: string
      message: string
      data: Record<string, unknown>
      read: boolean
      created_at: string
    }
    Update: {
      read?: boolean
    }
  }
  levels: {
    Row: {
      id: number
      name: string
      min_coins: number
      reward_coins: number
      badge_url: string
      perks: string[]
    }
  }
  simple_tasks: {
    Row: {
      id: string
      title: string
      description: string
      task_type: 'VISIT_URL' | 'RETWEET' | 'JOIN_TELEGRAM' | 'JOIN_DISCORD' | 'FOLLOW_SOCIAL' | 'CUSTOM'
      proof_type: 'URL' | 'TEXT' | 'IMAGE' | 'NONE'
      proof_instructions: string
      reward_coins: number
      max_submissions: number
      current_submissions: number
      active: boolean
      created_by: string | null
      created_at: string
      expires_at: string | null
    }
  }
  task_submissions: {
    Row: {
      id: string
      user_id: string
      task_id: string
      proof_url: string
      proof_text: string
      status: 'pending' | 'approved' | 'rejected'
      coins_awarded: number
      reviewed_by: string | null
      reviewed_at: string | null
      review_notes: string
      submitted_at: string
    }
    Insert: {
      id?: string
      user_id: string
      task_id: string
      proof_url?: string
      proof_text?: string
      status?: 'pending' | 'approved' | 'rejected'
      coins_awarded?: number
      reviewed_by?: string | null
      reviewed_at?: string | null
      review_notes?: string
      submitted_at?: string
    }
  }
  daily_bonuses: {
    Row: {
      id: string
      user_id: string
      streak_count: number
      coins_awarded: number
      claimed_at: string
      created_at: string
    }
  }
  ad_watches: {
    Row: {
      id: string
      user_id: string
      coins_awarded: number
      ad_provider: string
      watched_at: string
      ip_address: string | null
      metadata: Record<string, unknown>
    }
    Insert: {
      id?: string
      user_id: string
      coins_awarded: number
      ad_provider?: string
      watched_at?: string
      ip_address?: string | null
      metadata?: Record<string, unknown>
    }
  }
  ip_logs: {
    Row: {
      id: string
      user_id: string | null
      ip_address: string
      fingerprint: string
      action: string
      vpn_detected: boolean
      proxy_detected: boolean
      tor_detected: boolean
      hosting_detected: boolean
      country_code: string
      city: string
      isp: string
      user_agent: string
      risk_score: number
      metadata: Record<string, unknown>
      created_at: string
    }
    Insert: {
      id?: string
      user_id?: string | null
      ip_address: string
      fingerprint?: string
      action: string
      vpn_detected?: boolean
      proxy_detected?: boolean
      tor_detected?: boolean
      hosting_detected?: boolean
      country_code?: string
      city?: string
      isp?: string
      user_agent?: string
      risk_score?: number
      metadata?: Record<string, unknown>
      created_at?: string
    }
  }
  admin_configs: {
    Row: {
      key: string
      value: string
      description: string
      updated_at: string
      updated_by: string | null
    }
  }
  admin_users: {
    Row: {
      user_id: string
      role: 'admin' | 'superadmin'
      permissions: string[]
      created_at: string
      created_by: string | null
    }
  }
}

export type Profile = Tables['profiles']['Row']
export type Transaction = Tables['transactions']['Row']
export type GameRound = Tables['game_rounds']['Row']
export type WithdrawalRequest = Tables['withdrawal_requests']['Row']
export type DepositOrder = Tables['deposit_orders']['Row']
export type CoinPack = Tables['coin_packs']['Row']
export type Referral = Tables['referrals']['Row']
export type ReferralCommission = Tables['referral_commissions']['Row']
export type Notification = Tables['notifications']['Row']
export type Level = Tables['levels']['Row']
export type SimpleTask = Tables['simple_tasks']['Row']
export type TaskSubmission = Tables['task_submissions']['Row']
export type DailyBonus = Tables['daily_bonuses']['Row']
export type AdWatch = Tables['ad_watches']['Row']
export type IPLog = Tables['ip_logs']['Row']
export type AdminConfig = Tables['admin_configs']['Row']
export type AdminUser = Tables['admin_users']['Row']
