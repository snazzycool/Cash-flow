import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Gift,
  Gamepad2,
  Wallet,
  Users,
  Shield,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
} from 'lucide-react'
import Button from '../components/ui/Button'

const features = [
  {
    icon: Gift,
    title: 'Complete Tasks, Earn Coins',
    description: 'Watch ads, complete offers, spin the wheel - earn coins through various engaging activities.',
    color: 'from-gold-500 to-gold-400',
  },
  {
    icon: Gamepad2,
    title: 'Play Provably Fair Games',
    description: 'Dice, coin flip, card games, and more. All games are 100% fair with verifiable outcomes.',
    color: 'from-primary-500 to-primary-400',
  },
  {
    icon: Wallet,
    title: 'Withdraw Real Money',
    description: 'Convert your coins to cash and withdraw via crypto or bank transfer.',
    color: 'from-accent-500 to-accent-400',
  },
  {
    icon: Users,
    title: 'Referral Program',
    description: 'Invite friends and earn 10% lifetime commission on everything they earn.',
    color: 'from-blue-500 to-blue-400',
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    description: 'Bank-grade security, provably fair games, and transparent operations.',
    color: 'from-emerald-500 to-emerald-400',
  },
  {
    icon: TrendingUp,
    title: 'Level Up & Earn More',
    description: 'Progress through levels and unlock increasing rewards and perks.',
    color: 'from-pink-500 to-pink-400',
  },
]

const stats = [
  { value: '5M+', label: 'Coins Earned Daily' },
  { value: '100K+', label: 'Active Users' },
  { value: '$500K+', label: 'Total Paid Out' },
  { value: '99.9%', label: 'Uptime' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-gold-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">C</span>
              </div>
              <span className="text-xl font-bold font-display neon-text">CoinQuest</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-full px-4 py-1.5 mb-6"
            >
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-primary-300">Earn up to 10,000 coins daily</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-6">
              <span className="text-white">Complete Tasks, Play Games,</span>
              <br />
              <span className="neon-text">Earn Real Money</span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users earning coins through simple tasks and exciting games.
              Convert your earnings to real cash and withdraw instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="gold" size="lg">
                  Start Earning Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Already have an account?
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 text-center"
              >
                <p className="text-2xl lg:text-3xl font-bold neon-text">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold font-display text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Simple, transparent, and rewarding. Start earning in minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden bg-gradient-to-r from-primary-600/20 via-accent-600/20 to-gold-600/20 border border-slate-800 rounded-3xl p-8 lg:p-16 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-accent-500/5 to-gold-500/5" />
            <div className="relative">
              <Star className="w-12 h-12 text-gold-400 mx-auto mb-6" />
              <h2 className="text-3xl lg:text-4xl font-bold font-display text-white mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Sign up now and get 500 bonus coins. Complete your first task and start your journey to financial freedom.
              </p>
              <Link to="/signup">
                <Button variant="gold" size="lg">
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-lg font-bold font-display neon-text">CoinQuest</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 CoinQuest. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
