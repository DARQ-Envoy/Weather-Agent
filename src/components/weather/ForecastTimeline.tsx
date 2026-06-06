import { motion } from 'framer-motion'
import type { ForecastDay } from '../../types/weather'

interface ForecastTimelineProps {
  forecast: ForecastDay[]
}

export function ForecastTimeline({ forecast }: ForecastTimelineProps) {
  return (
    <motion.section
      className="forecast-timeline"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      aria-label="Seven day forecast"
    >
      <svg aria-hidden className="forecast-path" preserveAspectRatio="none" viewBox="0 0 760 120">
        <path d="M 32 70 C 120 18, 190 112, 270 62 S 410 20, 488 64 S 625 108, 728 52" />
      </svg>
      <div className="forecast-items">
        {forecast.map(({ day, temperature, condition, Icon }) => (
          <div className="forecast-day" key={day}>
            <span>{day}</span>
            <Icon aria-label={condition} size={24} />
            <strong>{temperature}°</strong>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
