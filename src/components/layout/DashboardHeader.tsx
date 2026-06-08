import { ChevronDown, CloudSun, Home, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import type { AppPage } from '@/types'

const navItems = [
  { label: 'Home', Icon: Home, page: 'home' as const },
  { label: 'About', Icon: Info, page: 'about' as const },
]
interface DashboardHeaderProps {
  metaText?: string
  page: AppPage
  onNavigate: (page: AppPage) => void
}

export function DashboardHeader({ metaText, onNavigate, page }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="brand-mark">
        <CloudSun aria-hidden size={28} />
        <span>forecast.now</span>
      </div>

      <motion.nav
        className="dashboard-nav"
        aria-label="Weather navigation"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {navItems.map(({ label, Icon, page: navPage }) => (
          <motion.button
            aria-label={label}
            aria-current={page === navPage ? 'page' : undefined}
            className={`nav-icon-button${page === navPage ? ' is-active' : ''}`}
            key={label}
            onClick={() => onNavigate(navPage)}
            type="button"
            whileHover={{ color: 'rgba(255,255,255,1)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon aria-hidden size={20} />
            <span>{label}</span>
          </motion.button>
        ))}
      </motion.nav>

      <div className="header-meta">
        {metaText ? <span className="header-date">{metaText}</span> : null}
        <button className="profile-pill" type="button" aria-label="Profile">
          <span className="avatar" />
          <span className="profile-copy">
            <strong>John Doe</strong>
            <span>Admin</span>
          </span>
          <ChevronDown aria-hidden size={16} />
        </button>
      </div>
    </header>
  )
}
