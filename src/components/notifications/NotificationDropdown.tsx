import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Gift, Users, Wallet, AlertTriangle, Trophy, MessageSquare } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/api'
import { timeAgo } from '../../lib/utils'
import type { Notification } from '../../lib/supabase'

interface NotificationDropdownProps {
  unreadCount: number
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  REFERRAL: Users,
  BONUS: Gift,
  WITHDRAWAL: Wallet,
  DEPOSIT: Wallet,
  GAME: Trophy,
  TASK: MessageSquare,
  SYSTEM: Bell,
  WARNING: AlertTriangle,
  LEVEL_UP: Trophy,
}

const typeColors: Record<string, string> = {
  REFERRAL: 'text-primary-400 bg-primary-400/20',
  BONUS: 'text-gold-400 bg-gold-400/20',
  WITHDRAWAL: 'text-blue-400 bg-blue-400/20',
  DEPOSIT: 'text-green-400 bg-green-400/20',
  GAME: 'text-accent-400 bg-accent-400/20',
  TASK: 'text-purple-400 bg-purple-400/20',
  SYSTEM: 'text-slate-400 bg-slate-400/20',
  WARNING: 'text-red-400 bg-red-400/20',
  LEVEL_UP: 'text-yellow-400 bg-yellow-400/20',
}

export default function NotificationDropdown({ unreadCount }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch (error) {
      console.error('Error marking notification read:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (error) {
      console.error('Error marking all notifications read:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Notifications</h3>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const Icon = iconMap[notification.type] || Bell
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${
                        !notification.read ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg ${typeColors[notification.type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-white text-sm">
                              {notification.title}
                            </p>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {timeAgo(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mt-2 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
