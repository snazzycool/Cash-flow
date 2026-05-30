interface CardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  onClick?: () => void
}

export default function Card({ children, className = '', glow = false, onClick }: CardProps) {
  const baseClasses = 'bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl shadow-xl'
  const glowClasses = glow ? 'relative overflow-hidden' : ''

  return (
    <div className={`${baseClasses} ${glowClasses} ${className}`} onClick={onClick}>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 via-accent-600/5 to-gold-600/5 opacity-0 transition-opacity duration-300 hover:opacity-100" />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
