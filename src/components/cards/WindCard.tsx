import { Wind } from 'lucide-react'
import { GlassCard } from './GlassCard'

interface WindCardProps {
  speed: number
}

export function WindCard({ speed }: WindCardProps) {
  return (
    <GlassCard className="wind-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
      <div className="wind-card-head">
        <div className="card-title">
          <Wind aria-hidden size={18} />
          <span>Wind status</span>
        </div>
        <div className="wind-reading">
          <strong>{speed.toFixed(2)}</strong>
          <span>km/h</span>
        </div>
      </div>
      <svg aria-hidden className="wind-chart" preserveAspectRatio="none" viewBox="0 0 360 122">
        <path
          className="wind-line-muted"
          d="M 16 52 C 45 90, 73 72, 93 54 S 134 40, 157 12 S 193 60, 220 50 S 268 24, 286 82 S 326 40, 346 72"
        />
        <path
          className="wind-line"
          d="M 16 52 C 45 90, 73 72, 93 54 S 134 40, 157 12 S 193 60, 220 50 S 268 24, 286 82 S 326 40, 346 72"
        />
      </svg>
      <div className="wind-bars" aria-hidden>
        {Array.from({ length: 22 }, (_, index) => (
          <i key={index} style={{ height: `${8 + ((index * 7) % 22)}px` }} />
        ))}
      </div>
    </GlassCard>
  )
}
