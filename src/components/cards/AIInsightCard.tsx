import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { GlassCard } from './GlassCard'

interface AIInsightCardProps {
  confidence: number
  insight: string
}

export function AIInsightCard({ confidence, insight }: AIInsightCardProps) {
  return (
    <GlassCard className="insight-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
      <div className="insight-label">
        <Sparkles aria-hidden size={18} />
        <span>AI Insight</span>
      </div>
      <p>{insight}</p>
      <div className="confidence">
        <span>Confidence: {confidence}%</span>
        <div>
          <motion.i
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          />
        </div>
      </div>
    </GlassCard>
  )
}
