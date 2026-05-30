/*
  # Initial Platform Schema

  This migration creates the complete database schema for the Task & Gamble to Earn platform.

  ## Tables Created:

  1. **users** - Main user accounts with profile data, balances, and settings
     - Email/password authentication (Supabase Auth handles auth.users)
     - Profile fields: username, avatar, levels, streaks
     - Balances: coins (earned), cash_balance (withdrawable real money)
     - Referral tracking: referral_code, referred_by
     - Anti-cheat: fingerprint, ip_registration, flags

  2. **transactions** - Complete ledger of all coin/cash movements
     - Types: EARN, SPEND, CONVERT, DEPOSIT, WITHDRAW, REFERRAL, BONUS
     - Atomic logging for audit trail

  3. **daily_bonuses** - Track daily bonus claims and streaks
     - streak_count: consecutive days claimed
     - last_claimed_at: for streak calculation

  4. **ad_watches** - Track rewarded video ad completions
     - Daily limit enforcement
     - Coins awarded per ad

  5. **offer_completions** - Third-party offerwall postbacks
     - Provider data and rewards

  6. **simple_tasks** - Admin-created tasks for users
     - proof_type: URL, TEXT, IMAGE
     - Status: PENDING, APPROVED, REJECTED

  7. **task_submissions** - User submissions for simple tasks
     - Proof URL/text and approval status

  8. **game_rounds** - All gambling game plays
     - Provably fair: server_seed, client_seed, nonce
     - Game types: DICE, COIN_FLIP, PICK_CARD, LUCKY_WHEEL, CRASH
     - Results and payouts

  9. **lucky_wheel_spins** - Free daily wheel spins
     - Prize tracking

  10. **referrals** - Referral relationships and commissions
      - Lifetime 10% commission tracking

  11. **withdrawal_requests** - Cash withdrawal requests
      - Methods: USDT, USDC, XRP, BTC, ETH, NIGERIAN_BANK, GREY_BANK
      - Status workflow: PENDING, PROCESSING, COMPLETED, REJECTED

  12. **deposit_orders** - Coin purchase orders
      - Crypto payment methods
      - Status tracking

  13. **coin_packs** - Available coin packages for purchase
      - Price and bonus coins

  14. **ip_logs** - Anti-cheat IP tracking
      - VPN/proxy detection results

  15. **notifications** - User notifications
      - Types: REFFERAL, BONUS, WITHDRAWAL, DEPOSIT, GAME, SYSTEM

  16. **levels** - User level definitions
      - Coin thresholds and rewards

  17. **user_achievements** - Badge/achievement tracking

  18. **leaderboards** - Cached leaderboard data

  19. **admin_configs** - System configuration key-value store
      - Exchange rates, fees, limits

  20. **admin_users** - Admin role assignment

  ## Security:
  - RLS enabled on all tables
  - Policies restrict access to authenticated users
  - Admin-only access for sensitive operations
*/

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text DEFAULT '',
  coins bigint DEFAULT 0 NOT NULL,
  cash_balance bigint DEFAULT 0 NOT NULL,
  total_earned bigint DEFAULT 0 NOT NULL,
  total_wagered bigint DEFAULT 0 NOT NULL,
  total_won bigint DEFAULT 0 NOT NULL,
  total_lost bigint DEFAULT 0 NOT NULL,
  referral_code text UNIQUE NOT NULL DEFAULT '',
  referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  streak integer DEFAULT 0 NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  daily_ads_watched integer DEFAULT 0 NOT NULL,
  last_ad_reset date DEFAULT CURRENT_DATE,
  last_daily_bonus timestamptz,
  last_wheel_spin timestamptz,
  lucky_streak integer DEFAULT 0 NOT NULL,
  email_verified boolean DEFAULT false NOT NULL,
  kyc_verified boolean DEFAULT false NOT NULL,
  kyc_document_url text DEFAULT '',
  banned boolean DEFAULT false NOT NULL,
  banned_reason text DEFAULT '',
  flagged boolean DEFAULT false NOT NULL,
  flagged_reason text DEFAULT '',
  fingerprint text DEFAULT '',
  ip_registration inet,
  vpn_detected boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Generate referral code on insert
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate referral code
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, referral_code, ip_registration)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    generate_referral_code(),
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TRANSACTIONS (Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('EARN', 'SPEND', 'CONVERT_TO_CASH', 'CONVERT_FROM_COINS', 'DEPOSIT', 'WITHDRAW', 'REFERRAL', 'BONUS', 'GAME_WIN', 'GAME_LOSS', 'DAILY_BONUS', 'AD_REWARD', 'OFFER_REWARD', 'TASK_REWARD', 'WHEEL_SPIN', 'ADMIN_ADJUST')),
  amount bigint NOT NULL,
  balance_before bigint NOT NULL,
  balance_after bigint NOT NULL,
  description text DEFAULT '',
  related_entity_type text DEFAULT '',
  related_entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- DAILY BONUSES
-- ============================================
CREATE TABLE IF NOT EXISTS daily_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_count integer DEFAULT 1 NOT NULL,
  coins_awarded bigint NOT NULL,
  claimed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_bonuses_user_id ON daily_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_claimed_at ON daily_bonuses(claimed_at);

-- ============================================
-- AD WATCHES
-- ============================================
CREATE TABLE IF NOT EXISTS ad_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coins_awarded bigint NOT NULL,
  ad_provider text DEFAULT 'internal' NOT NULL,
  watched_at timestamptz DEFAULT now() NOT NULL,
  ip_address inet,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ad_watches_user_id ON ad_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_watches_watched_at ON ad_watches(watched_at);

-- ============================================
-- OFFER COMPLETIONS
-- ============================================
CREATE TABLE IF NOT EXISTS offer_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offerwall_provider text NOT NULL,
  offer_id text NOT NULL,
  offer_name text DEFAULT '',
  coins_awarded bigint NOT NULL,
  status text DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'reversed')),
  provider_data jsonb DEFAULT '{}'::jsonb,
  completed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offer_completions_user_id ON offer_completions(user_id);

-- ============================================
-- SIMPLE TASKS (Admin Created)
-- ============================================
CREATE TABLE IF NOT EXISTS simple_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('VISIT_URL', 'RETWEET', 'JOIN_TELEGRAM', 'JOIN_DISCORD', 'FOLLOW_SOCIAL', 'CUSTOM')),
  proof_type text NOT NULL CHECK (proof_type IN ('URL', 'TEXT', 'IMAGE', 'NONE')),
  proof_instructions text DEFAULT '',
  reward_coins bigint NOT NULL,
  max_submissions integer DEFAULT 0,
  current_submissions integer DEFAULT 0,
  active boolean DEFAULT true NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz
);

-- ============================================
-- TASK SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES simple_tasks(id) ON DELETE CASCADE,
  proof_url text DEFAULT '',
  proof_text text DEFAULT '',
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  coins_awarded bigint DEFAULT 0,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text DEFAULT '',
  submitted_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);

-- ============================================
-- GAME ROUNDS (Provably Fair)
-- ============================================
CREATE TABLE IF NOT EXISTS game_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type text NOT NULL CHECK (game_type IN ('DICE', 'COIN_FLIP', 'PICK_CARD', 'LUCKY_WHEEL', 'CRASH')),
  bet_amount bigint NOT NULL,
  game_params jsonb NOT NULL,
  server_seed text NOT NULL,
  server_seed_hash text NOT NULL,
  client_seed text DEFAULT '',
  nonce bigint DEFAULT 0 NOT NULL,
  result jsonb NOT NULL,
  payout bigint DEFAULT 0 NOT NULL,
  win boolean NOT NULL,
  rtp numeric DEFAULT 0 NOT NULL,
  played_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_rounds_user_id ON game_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_game_rounds_game_type ON game_rounds(game_type);
CREATE INDEX IF NOT EXISTS idx_game_rounds_played_at ON game_rounds(played_at);

-- ============================================
-- LUCKY WHEEL SPINS (Free Daily)
-- ============================================
CREATE TABLE IF NOT EXISTS lucky_wheel_spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prize_type text NOT NULL,
  prize_amount bigint NOT NULL,
  server_seed text NOT NULL,
  result_index integer NOT NULL,
  spun_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lucky_wheel_spins_user_id ON lucky_wheel_spins(user_id);

-- ============================================
-- REFERRALS
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signup_bonus_paid boolean DEFAULT false NOT NULL,
  signup_bonus_amount bigint DEFAULT 500 NOT NULL,
  total_commission bigint DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);

-- ============================================
-- REFERRAL COMMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('TASK', 'AD', 'OFFER', 'BONUS')),
  source_id uuid,
  commission_rate numeric DEFAULT 0.10 NOT NULL,
  commission_amount bigint NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);

-- ============================================
-- WITHDRAWAL REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  fee bigint DEFAULT 0 NOT NULL,
  method text NOT NULL CHECK (method IN ('USDT_TRC20', 'USDT_ERC20', 'USDC', 'XRP', 'BTC', 'ETH', 'NIGERIAN_BANK', 'GREY_BANK', 'PAYPAL', 'VENMO')),
  wallet_address text DEFAULT '',
  bank_name text DEFAULT '',
  bank_account_number text DEFAULT '',
  bank_account_name text DEFAULT '',
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  transaction_hash text DEFAULT '',
  admin_notes text DEFAULT '',
  processed_by uuid REFERENCES profiles(id),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ============================================
-- DEPOSIT ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS deposit_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_usd numeric NOT NULL,
  coins bigint NOT NULL,
  bonus_coins bigint DEFAULT 0 NOT NULL,
  method text NOT NULL CHECK (method IN ('USDT_TRC20', 'USDT_ERC20', 'USDC', 'XRP', 'BTC', 'ETH', 'MANUAL')),
  wallet_address text NOT NULL,
  payment_address text DEFAULT '',
  transaction_hash text DEFAULT '',
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'expired', 'cancelled')),
  expires_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deposit_orders_user_id ON deposit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_orders_status ON deposit_orders(status);

-- ============================================
-- COIN PACKS
-- ============================================
CREATE TABLE IF NOT EXISTS coin_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_usd numeric NOT NULL,
  coins bigint NOT NULL,
  bonus_coins bigint DEFAULT 0 NOT NULL,
  bonus_percent integer DEFAULT 0 NOT NULL,
  popular boolean DEFAULT false NOT NULL,
  active boolean DEFAULT true NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Insert default coin packs
INSERT INTO coin_packs (name, price_usd, coins, bonus_coins, bonus_percent, popular, display_order) VALUES
  ('Starter Pack', 5, 50000, 0, 0, false, 1),
  ('Basic Pack', 10, 105000, 5000, 5, false, 2),
  ('Standard Pack', 25, 275000, 25000, 10, false, 3),
  ('Premium Pack', 50, 600000, 100000, 20, true, 4),
  ('VIP Pack', 100, 1300000, 300000, 30, false, 5),
  ('Whale Pack', 250, 3500000, 1000000, 40, false, 6),
  ('Legend Pack', 500, 7500000, 2500000, 50, false, 7)
ON CONFLICT DO NOTHING;

-- ============================================
-- IP LOGS (Anti-Cheat)
-- ============================================
CREATE TABLE IF NOT EXISTS ip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address inet NOT NULL,
  fingerprint text DEFAULT '',
  action text NOT NULL,
  vpn_detected boolean DEFAULT false,
  proxy_detected boolean DEFAULT false,
  tor_detected boolean DEFAULT false,
  hosting_detected boolean DEFAULT false,
  country_code text DEFAULT '',
  city text DEFAULT '',
  isp text DEFAULT '',
  user_agent text DEFAULT '',
  risk_score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ip_logs_user_id ON ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('REFERRAL', 'BONUS', 'WITHDRAWAL', 'DEPOSIT', 'GAME', 'TASK', 'SYSTEM', 'WARNING', 'LEVEL_UP')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================
-- LEVELS
-- ============================================
CREATE TABLE IF NOT EXISTS levels (
  id integer PRIMARY KEY,
  name text NOT NULL,
  min_coins bigint NOT NULL,
  reward_coins bigint DEFAULT 0 NOT NULL,
  badge_url text DEFAULT '',
  perks jsonb DEFAULT '[]'::jsonb
);

-- Insert default levels
INSERT INTO levels (id, name, min_coins, reward_coins) VALUES
  (1, 'Newcomer', 0, 0),
  (2, 'Beginner', 10000, 500),
  (3, 'Apprentice', 50000, 2000),
  (4, 'Skilled', 150000, 5000),
  (5, 'Expert', 500000, 15000),
  (6, 'Master', 1500000, 50000),
  (7, 'Grandmaster', 5000000, 150000),
  (8, 'Legend', 15000000, 500000),
  (9, 'Mythic', 50000000, 1500000),
  (10, 'Divine', 150000000, 5000000)
ON CONFLICT DO NOTHING;

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achieved_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ============================================
-- ADMIN CONFIGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_configs (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES profiles(id)
);

-- Insert default configs
INSERT INTO admin_configs (key, value, description) VALUES
  ('exchange_rate', '10000', 'Coins per USD'),
  ('conversion_fee_percent', '5', 'Fee when converting coins to cash'),
  ('min_withdrawal_usd', '10', 'Minimum withdrawal amount in USD'),
  ('min_deposit_usd', '5', 'Minimum deposit amount in USD'),
  ('kyc_required_usd', '50', 'KYC required for withdrawals above this amount'),
  ('max_daily_ads', '10', 'Maximum rewarded ads per day'),
  ('ad_reward_min', '50', 'Minimum coins per ad'),
  ('ad_reward_max', '200', 'Maximum coins per ad'),
  ('daily_bonus_base', '100', 'Base daily bonus coins'),
  ('daily_bonus_increment', '50', 'Daily bonus increment per streak day'),
  ('daily_bonus_max_days', '7', 'Maximum streak days before reset'),
  ('referral_signup_bonus', '500', 'Coins for referrer on successful referral'),
  ('referral_commission_percent', '10', 'Lifetime commission percentage on referrals'),
  ('max_accounts_per_ip', '2', 'Maximum accounts allowed per IP'),
  ('rtp_dice', '95', 'Return to player percentage for dice game'),
  ('rtp_coin_flip', '99', 'Return to player percentage for coin flip'),
  ('rtp_pick_card', '90', 'Return to player percentage for pick card'),
  ('rtp_lucky_wheel', '85', 'Return to player percentage for lucky wheel')
ON CONFLICT DO NOTHING;

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' NOT NULL CHECK (role IN ('admin', 'superadmin')),
  permissions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES profiles(id)
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_wheel_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - TRANSACTIONS
-- ============================================
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - DAILY BONUSES
-- ============================================
CREATE POLICY "Users can view own daily bonuses"
  ON daily_bonuses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily bonus"
  ON daily_bonuses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - AD WATCHES
-- ============================================
CREATE POLICY "Users can view own ad watches"
  ON ad_watches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad watch"
  ON ad_watches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - OFFER COMPLETIONS
-- ============================================
CREATE POLICY "Users can view own offers"
  ON offer_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - SIMPLE TASKS
-- ============================================
CREATE POLICY "Anyone can view active tasks"
  ON simple_tasks FOR SELECT
  TO authenticated
  USING (active = true);

-- ============================================
-- RLS POLICIES - TASK SUBMISSIONS
-- ============================================
CREATE POLICY "Users can view own submissions"
  ON task_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON task_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - GAME ROUNDS
-- ============================================
CREATE POLICY "Users can view own games"
  ON game_rounds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
  ON game_rounds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - LUCKY WHEEL SPINS
-- ============================================
CREATE POLICY "Users can view own spins"
  ON lucky_wheel_spins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spins"
  ON lucky_wheel_spins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - REFERRALS
-- ============================================
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ============================================
-- RLS POLICIES - REFERRAL COMMISSIONS
-- ============================================
CREATE POLICY "Users can view own commissions"
  ON referral_commissions FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- ============================================
-- RLS POLICIES - WITHDRAWAL REQUESTS
-- ============================================
CREATE POLICY "Users can view own withdrawals"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - DEPOSIT ORDERS
-- ============================================
CREATE POLICY "Users can view own deposits"
  ON deposit_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposits"
  ON deposit_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - COIN PACKS (Public read)
-- ============================================
CREATE POLICY "Anyone can view coin packs"
  ON coin_packs FOR SELECT
  TO authenticated
  USING (active = true);

-- ============================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - LEVELS (Public read)
-- ============================================
CREATE POLICY "Anyone can view levels"
  ON levels FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- RLS POLICIES - USER ACHIEVEMENTS
-- ============================================
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update user level based on total earned
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS trigger AS $$
DECLARE
  new_level integer;
BEGIN
  SELECT COALESCE(MAX(id), 1) INTO new_level
  FROM levels
  WHERE min_coins <= NEW.total_earned;
  
  IF new_level != NEW.level THEN
    UPDATE profiles SET level = new_level WHERE id = NEW.id;
    
    -- Check for level up reward
    IF EXISTS (SELECT 1 FROM levels WHERE id = new_level AND reward_coins > 0) THEN
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (NEW.id, 'LEVEL_UP', 'Level Up!', 'You reached level ' || new_level || '!', '{"level": ' || new_level || '}');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_update
  AFTER UPDATE OF total_earned ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Function to create notification on withdrawal status change
CREATE OR REPLACE FUNCTION notify_withdrawal_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'WITHDRAWAL',
      CASE NEW.status
        WHEN 'processing' THEN 'Withdrawal Processing'
        WHEN 'completed' THEN 'Withdrawal Complete'
        WHEN 'rejected' THEN 'Withdrawal Rejected'
        ELSE 'Withdrawal Update'
      END,
      CASE NEW.status
        WHEN 'processing' THEN 'Your withdrawal of $' || (NEW.amount / 100.0) || ' is being processed.'
        WHEN 'completed' THEN 'Your withdrawal of $' || (NEW.amount / 100.0) || ' has been completed.'
        WHEN 'rejected' THEN 'Your withdrawal was rejected. Reason: ' || COALESCE(NEW.admin_notes, 'Not specified')
        ELSE 'Your withdrawal status has been updated.'
      END,
      json_build_object('withdrawal_id', NEW.id, 'amount', NEW.amount)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_withdrawal_update
  AFTER UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION notify_withdrawal_status();

-- Function to create referral relationship
CREATE OR REPLACE FUNCTION process_referral()
RETURNS trigger AS $$
DECLARE
  referrer_profile uuid;
  signup_bonus bigint;
BEGIN
  -- Get referral code from user metadata
  SELECT (NEW.raw_user_meta_data->>'referral_code')::uuid INTO referrer_profile;
  
  IF referrer_profile IS NOT NULL THEN
    -- Update profile with referrer
    UPDATE profiles SET referred_by = referrer_profile WHERE id = NEW.id;
    
    -- Get signup bonus amount
    SELECT value::bigint INTO signup_bonus FROM admin_configs WHERE key = 'referral_signup_bonus';
    
    -- Create referral record
    INSERT INTO referrals (referrer_id, referred_id, signup_bonus_amount)
    VALUES (referrer_profile, NEW.id, COALESCE(signup_bonus, 500));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION process_referral();
