import type { LucideIcon } from 'lucide-react'

export type WeatherConditionKey = 'storm' | 'sunny' | 'rain' | 'cloudy' | 'snow' | 'fog' | 'windy'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  timestamp: string
  pending?: boolean
}

export interface WeatherSnapshot {
  conditionKey: WeatherConditionKey
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
}

export interface ForecastDay extends WeatherSnapshot {
  day: string
  Icon: LucideIcon
}

export type ForecastDayUpdate = Omit<ForecastDay, 'Icon'>

export interface WeatherData extends WeatherSnapshot {
  forecast: ForecastDay[]
}

export interface WeatherUpdateData extends WeatherSnapshot {
  forecast: ForecastDayUpdate[]
}

export interface WeatherInitResponse {
  location: string
  timezone: string
  daily: ForecastDayUpdate[]
}


// ─── Types ────────────────────────────────────────────────────────────────────

export interface Location {
  lat: number;
  lng: number;
  label?: string;
}


export interface StreamHandlers {
  onThreadId: (threadId: string) => void;      // persist to sessionStorage
  onToken: (token: string) => void;             // append to chat bubble
  onWeatherUpdate: (data: WeatherUpdateData) => void; // update weather UI
  onDone: () => void;                           // finalise message
  onError: (message: string) => void;           // show error state
}
