import { GlassCard } from './GlassCard'

interface SunriseCardProps {
  sunrise: string
  sunset: string
}

export function SunriseCard({ sunrise, sunset }: SunriseCardProps) {
  return (
    <GlassCard className="sunrise-card" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
      <div className="sun-times">
        <div>
          <span>Sunrise</span>
          <strong>{sunrise}</strong>
        </div>
        <div>
          <span>Sunset</span>
          <strong>{sunset}</strong>
        </div>
      </div>
      <svg aria-hidden className="sun-arc" preserveAspectRatio="none" viewBox="0 0 292 80">
        <path d="M 24 66 A 122 122 0 0 1 268 66" />
        <line x1="24" x2="268" y1="66" y2="66" />
        <circle cx="144" cy="22" r="6" />
      </svg>
    </GlassCard>
  )
}
