import type { LucideIcon } from 'lucide-react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  timestamp: string
}

export interface ForecastDay {
  day: string
  temperature: number
  condition: string
  Icon: LucideIcon
}

export interface WeatherData {
  condition: string
  subtitle: string
  description: string
  temperature: number
  location: string
  uvIndex: number
  windSpeed: number
  sunrise: string
  sunset: string
  insight: string
  confidence: number
  forecast: ForecastDay[]
}
