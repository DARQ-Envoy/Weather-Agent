import { Bell, Home, Map, Search } from 'lucide-react'
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
      </motion.nav>
    </header>
  )
}
