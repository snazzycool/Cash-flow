# CoinQuest - Task & Gamble to Earn Platform

A complete web application where users earn virtual coins by completing tasks and can stake them in provably fair mini-games. Coins can be converted to real money and withdrawn via cryptocurrency or bank transfer.

## Features

### User Features
- **Authentication**: Email/password and Google OAuth signup/login
- **Daily Bonus**: Streak-based rewards (up to 7 days)
- **Rewarded Video Ads**: Watch ads to earn coins (configurable daily limit)
- **Simple Tasks**: Complete admin-created tasks for coins
- **Mini-Games**: Provably fair games with verifiable outcomes
  - Dice Roll (adjustable risk)
  - Coin Flip (1.98x payout)
  - Pick a Card (up to 10x payout)
  - Lucky Wheel
- **Lucky Wheel**: Free daily spin for prizes
- **Referral Program**: 10% lifetime commission on referral earnings
- **Crypto Deposits**: Buy coins via USDT, USDC, XRP, BTC, ETH
- **Withdrawals**: Crypto (USDT, USDC, XRP, BTC, ETH) or bank transfer (Nigerian banks, Grey)

### Admin Features
- **Dashboard**: Platform statistics and health metrics
- **User Management**: View, ban, adjust balances
- **Withdrawal Processing**: Approve/reject withdrawal requests
- **Task Management**: Create and review task submissions
- **Configuration**: Adjust exchange rates, fees, RTP, limits

### Security & Anti-Cheat
- Row Level Security (RLS) on all database tables
- Server-side game logic (provably fair with seed pre-commitment)
- VPN/proxy detection ready (IP logging)
- Rate limiting on API endpoints
- Atomic transaction logging

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom casino-themed design
- **State**: Zustand for auth state
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/
│   ├── auth/         # Auth-related components
│   ├── dashboard/    # Dashboard widgets
│   ├── earn/         # Earning components
│   ├── game/         # Game UI components
│   ├── layout/       # Layout and navigation
│   ├── notifications/# Notification dropdown
│   ├── ui/           # Reusable UI components
│   └── ...
├── hooks/            # Custom React hooks
├── lib/
│   ├── api.ts        # API client functions
│   ├── supabase.ts   # Supabase client and types
│   └── utils.ts      # Utility functions
├── pages/
│   ├── admin/        # Admin panel pages
│   ├── DashboardPage.tsx
│   ├── EarnPage.tsx
│   ├── GamesPage.tsx
│   ├── GamePlayPage.tsx
│   ├── DepositPage.tsx
│   ├── WithdrawPage.tsx
│   ├── ReferralPage.tsx
│   ├── LeaderboardPage.tsx
│   ├── ProfilePage.tsx
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   └── SignupPage.tsx
├── store/            # Zustand stores
└── index.css         # Tailwind styles

supabase/
├── functions/        # Edge Functions
│   ├── daily-bonus/  # Claim daily bonus
│   ├── watch-ad/     # Watch rewarded ad
│   ├── play-game/    # Play mini-games
│   ├── convert-coins/# Convert coins to cash
│   ├── withdraw/     # Create withdrawal
│   ├── deposit/      # Create deposit order
│   └── lucky-wheel/  # Free daily spin
└── migrations/       # Database migrations
```

## Environment Variables

Set these in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

### Core Tables
- `profiles` - User profiles with balances and stats
- `transactions` - Complete ledger of coin/cash movements
- `daily_bonuses` - Daily bonus claims and streaks
- `ad_watches` - Rewarded video ad completions
- `simple_tasks` - Admin-created tasks
- `task_submissions` - User task submissions
- `game_rounds` - All game plays (provably fair)
- `lucky_wheel_spins` - Free daily wheel spins
- `referrals` - Referral relationships
- `referral_commissions` - Commission tracking
- `withdrawal_requests` - Withdrawal requests
- `deposit_orders` - Deposit orders
- `coin_packs` - Coin packages for purchase
- `notifications` - User notifications
- `levels` - User level definitions
- `admin_configs` - Platform configuration
- `ip_logs` - Anti-cheat IP logging

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Configuration

Key platform settings (configurable in admin panel):

| Setting | Default | Description |
|---------|---------|-------------|
| `exchange_rate` | 10,000 | Coins per USD |
| `conversion_fee_percent` | 5% | Fee when converting coins to cash |
| `min_withdrawal_usd` | $10 | Minimum withdrawal |
| `min_deposit_usd` | $5 | Minimum deposit |
| `kyc_required_usd` | $50 | KYC threshold for withdrawals |
| `max_daily_ads` | 10 | Maximum ads per day |
| `ad_reward_min` | 50 | Minimum coins per ad |
| `ad_reward_max` | 200 | Maximum coins per ad |
| `daily_bonus_base` | 100 | Base daily bonus |
| `daily_bonus_increment` | 50 | Bonus increase per streak day |
| `daily_bonus_max_days` | 7 | Maximum streak days |
| `referral_signup_bonus` | 500 | Referrer bonus on referral signup |
| `referral_commission_percent` | 10% | Lifetime commission rate |
| `rtp_dice` | 95% | Return to player for dice |
| `rtp_coin_flip` | 99% | Return to player for coin flip |
| `rtp_pick_card` | 90% | Return to player for pick card |
| `rtp_lucky_wheel` | 85% | Return to player for lucky wheel |

## Payment Methods

### Crypto (Active)
- USDT (TRC20) - Recommended, low fees
- USDT (ERC20)
- USDC
- XRP (Ripple)
- Bitcoin (BTC)
- Ethereum (ETH)

### Bank Transfer (Active)
- Nigerian Bank Transfer
- Grey (Foreign Bank)

### Coming Soon
- PayPal
- Venmo

## Provably Fair Gaming

All games use server-side seed pre-commitment for verifiable fairness:

1. Server generates a random seed
2. SHA-256 hash of seed is pre-committed
3. Game outcome is calculated from seed + client seed
4. Users can verify outcomes after the fact

## License

This project is for educational purposes. Ensure compliance with local gambling regulations before deploying.
