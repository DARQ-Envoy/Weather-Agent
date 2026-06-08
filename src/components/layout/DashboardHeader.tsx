import { Bell, ChevronDown, CloudSun, Home, Map, Search } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Home', Icon: Home },
  { label: 'Search', Icon: Search },
  { label: 'Map', Icon: Map },
  { label: 'Alerts', Icon: Bell },
]

export function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="brand-mark">
        <CloudSun aria-hidden size={28} />
        <span>forecast.now</span>
      </div>
{/* 
      <motion.nav
        className="dashboard-nav"
        aria-label="Weather navigation"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {navItems.map(({ label, Icon }) => (
          <motion.button
            aria-label={label}
            className="nav-icon-button"
            key={label}
            type="button"
            whileHover={{ color: 'rgba(255,255,255,1)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Icon aria-hidden size={20} />
          </motion.button>
        ))}
      </motion.nav> */}

      <div className="header-meta">
        <span className="header-date">28 Aug | 11:52</span>
        <button className="profile-pill" type="button" aria-label="Profile">
          <span className="avatar" />
          <span className="profile-copy">
            <strong>Sam Rouw</strong>
            <span>Admin</span>
          </span>
          <ChevronDown aria-hidden size={16} />
        </button>
      </div>
    </header>
  )
}
