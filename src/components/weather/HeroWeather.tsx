import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import type { WeatherData } from '../../types'

interface HeroWeatherProps {
  weather: WeatherData
}

export function HeroWeather({ weather }: HeroWeatherProps) {
  return (
    <motion.section
      className="hero-weather"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="weather-copy">
        <h1>{weather.condition}</h1>
        <p className="weather-subtitle">{weather.subtitle}</p>
        <p className="weather-description">{weather.description}</p>
      </div>

      <div className="temperature-row">
        <span className="temperature-value">{weather.temperature}</span>
        <span className="temperature-degree">&deg;</span>
        <span className="temperature-mark">+ / _</span>
      </div>

      <div className="location-row">
        <span>
          <MapPin aria-hidden size={20} />
          {weather.location}
        </span>
        <span>UV Index: {weather.uvIndex}</span>
      </div>
    </motion.section>
  )
}
