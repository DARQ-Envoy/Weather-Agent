import { Sunrise, Sunset } from 'lucide-react'
import { GlassCard } from './GlassCard'

interface SunriseCardProps {
  sunrise: string
  sunset: string
}

export function SunriseCard({ sunrise, sunset }: SunriseCardProps) {
  return (
    <GlassCard
      className="sunrise-card"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      aria-label={`Sunrise ${sunrise}, sunset ${sunset}`}
    >
      <div className="sun-times">
        <div>
          <Sunrise aria-hidden size={18} />
          <span>Sunrise ↗</span>
        </div>
        <div>
          <span>↙ Sunset</span>
          <Sunset aria-hidden size={18} />
        </div>
      </div>
      <svg aria-hidden className="sun-arc" preserveAspectRatio="none" viewBox="0 0 380 190">
        <path className="arc-dash" d="M 24 150 A 166 166 0 0 1 356 150" />
        <circle className="sunrise-dot" cx="33" cy="140" r="5" />
        <circle className="sunset-dot" cx="347" cy="135" r="5" />
        <line className="sun-ray" x1="190" x2="190" y1="71" y2="104" />
        <line className="sun-ray" x1="138" x2="158" y1="91" y2="119" />
        <line className="sun-ray" x1="242" x2="222" y1="91" y2="119" />
        <line className="sun-ray" x1="92" x2="144" y1="143" y2="154" />
        <line className="sun-ray" x1="288" x2="236" y1="143" y2="154" />
        <path className="sun-body" d="M 135 168 A 55 55 0 0 1 245 168" />
        <line className="sun-base" x1="126" x2="254" y1="168" y2="168" />
      </svg>
    </GlassCard>
  )
}
