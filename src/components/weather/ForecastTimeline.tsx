import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ForecastDay } from '../../types'

interface ForecastTimelineProps {
  activeIndex: number
  forecast: ForecastDay[]
  onSelectDay: (index: number) => void
}

const FORECAST_ITEM_GAP = 24
const FORECAST_PATH_HEIGHT = 150
const FORECAST_PATH_BASELINE = 88
const FORECAST_PATH_SWING = [0, 18, -16, 22, -10, 14, -6]

function buildForecastPath(count: number, itemWidth: number) {
  if (count <= 0) {
    return ''
  }

  const points = Array.from({ length: count }, (_, index) => {
    const x = itemWidth / 2 + index * (itemWidth + FORECAST_ITEM_GAP)
    const y = FORECAST_PATH_BASELINE + FORECAST_PATH_SWING[index % FORECAST_PATH_SWING.length]

    return { x, y }
  })

  if (points.length === 1) {
    const { x, y } = points[0]
    return `M ${x - 28} ${y} L ${x + 28} ${y}`
  }

  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const controlX = (previous.x + current.x) / 2

    path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`
  }

  return path
}

export function ForecastTimeline({ activeIndex, forecast, onSelectDay }: ForecastTimelineProps) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => setViewportWidth(window.innerWidth)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const forecastCount = Math.max(forecast.length, 1)
  const forecastItemWidth = (viewportWidth * 0.9) / forecastCount
  const trackWidth = forecastCount * forecastItemWidth + (forecastCount - 1) * FORECAST_ITEM_GAP
  const path = buildForecastPath(forecastCount, forecastItemWidth)

  return (
    <motion.section
      className="forecast-timeline"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      aria-label="Seven day forecast"
    >
      <div className="forecast-scroll">
        <div className="forecast-track" style={{ width: `${trackWidth}px` }}>
          <svg
            aria-hidden
            className="forecast-path"
            preserveAspectRatio="none"
            viewBox={`0 0 ${trackWidth} ${FORECAST_PATH_HEIGHT}`}
          >
            <path d={path} />
          </svg>
          <div
            className="forecast-items"
            style={{
              gridTemplateColumns: `repeat(${forecastCount}, ${forecastItemWidth}px)`,
              columnGap: `${FORECAST_ITEM_GAP}px`,
            }}
          >
            {forecast.map(({ day, temperature, condition, conditionKey, Icon }, index) => {
              const isActive = index === activeIndex

              return (
                <div className={`forecast-day forecast-day-${conditionKey}${isActive ? ' is-active' : ''}`} key={day}>
                  <span className="forecast-day-label">{day}</span>
                  <strong className="forecast-day-temperature">
                    {temperature}
                    &deg;
                  </strong>
                  <motion.button
                    type="button"
                    className="forecast-day-button"
                    aria-label={`Show ${day} forecast for ${condition}`}
                    aria-pressed={isActive}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                    animate={isActive ? { scale: 1.08 } : { scale: 1 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => onSelectDay(index)}
                  >
                    <Icon aria-hidden size={24} />
                  </motion.button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
