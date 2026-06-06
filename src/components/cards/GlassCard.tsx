import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type GlassCardProps = HTMLMotionProps<'section'> & {
  children: ReactNode
}

export function GlassCard({ children, className = '', style, ...props }: GlassCardProps) {
  return (
    <motion.section
      className={`glass-card ${className}`}
      style={style}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.section>
  )
}
