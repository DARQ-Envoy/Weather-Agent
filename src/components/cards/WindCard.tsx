import { Wind } from 'lucide-react'
import { GlassCard } from './GlassCard'

interface WindCardProps {
  speed: number
}

export function WindCard({ speed }: WindCardProps) {
  return (
    <GlassCard className="wind-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
      <div className="card-title">
        <Wind aria-hidden size={18} />
        <span>Wind status</span>
      </div>
      <div className="wind-metric">{speed.toFixed(2)}</div>
      <div className="wind-unit">km/h</div>
      <svg aria-hidden className="wind-chart" preserveAspectRatio="none" viewBox="0 0 292 76">
        <path className="wind-fill" d="M 0 48 C 34 20, 58 26, 92 46 S 156 80, 202 42 S 258 8, 292 36 V 76 H 0 Z" />
        <path className="wind-line" d="M 0 48 C 34 20, 58 26, 92 46 S 156 80, 202 42 S 258 8, 292 36" />
      </svg>
    </GlassCard>
  )
}
