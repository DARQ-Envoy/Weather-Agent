import { clsx, type ClassValue } from 'clsx'
import { Cloud, CloudLightning, CloudRain, CloudSun } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type {
  ChatMessage,
  ForecastDay,
  ForecastDayUpdate,
  Location,
  WeatherConditionKey,
  WeatherData,
  WeatherUpdateData,
} from '../types'

const AI_SUBTITLE_FALLBACK = 'Use the assistant for an AI summary of this forecast.'
const AI_DESCRIPTION_FALLBACK =
  'Use the assistant for AI-generated forecast details and planning guidance.'
const AI_INSIGHT_FALLBACK = 'Use the assistant for AI insights and weather recommendations.'
const NYC_DEFAULT_LOCATIONS: Location[] = [
  { lat: 40.7812, lng: -73.9665, label: 'Central Park' },
  { lat: 40.758, lng: -73.9855, label: 'Times Square' },
  { lat: 40.7061, lng: -73.9969, label: 'DUMBO' },
  { lat: 40.7308, lng: -73.9973, label: 'Greenwich Village' },
  { lat: 40.6782, lng: -73.9442, label: 'Brooklyn' },
  { lat: 40.7527, lng: -73.9772, label: 'Midtown Manhattan' },
]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatHeaderDate(date?: string) {
  if (!date) return ''

  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date

  const value = new Date(Date.UTC(year, month - 1, day))
  return value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function getRandomDefaultLocation(): Location {
  return NYC_DEFAULT_LOCATIONS[Math.floor(Math.random() * NYC_DEFAULT_LOCATIONS.length)]
}

export function resolveWeatherConditionKey(condition: string): WeatherConditionKey {
  const value = condition.toLowerCase()

  if (value.includes('thunder') || value.includes('storm') || value.includes('lightning')) return 'storm'
  if (value.includes('sun') || value.includes('clear')) return 'sunny'
  if (value.includes('rain') || value.includes('drizzle')) return 'rain'
  if (value.includes('snow')) return 'snow'
  if (value.includes('fog') || value.includes('mist') || value.includes('haze')) return 'fog'
  if (value.includes('wind') || value.includes('breeze') || value.includes('gust')) return 'windy'

  return 'cloudy'
}

export function createForecastDay(day: Omit<ForecastDay, 'conditionKey'>): ForecastDay {
  return withAiFallbackCopy({
    ...day,
    conditionKey: resolveWeatherConditionKey(day.condition),
  })
}

export function getWeatherIcon(conditionKey: WeatherConditionKey) {
  switch (conditionKey) {
    case 'storm':
      return CloudLightning
    case 'rain':
      return CloudRain
    case 'sunny':
      return CloudSun
    default:
      return Cloud
  }
}

export function hydrateForecastDay(day: ForecastDayUpdate): ForecastDay {
  const normalizedDay = withAiFallbackCopy(day)

  return {
    ...normalizedDay,
    Icon: getWeatherIcon(normalizedDay.conditionKey),
  }
}

export function hydrateWeatherUpdate(data: WeatherUpdateData): WeatherData {
  const normalizedData = withAiFallbackCopy(data)

  return {
    ...normalizedData,
    forecast: normalizedData.forecast.map(hydrateForecastDay),
  }
}

export function hydrateForecastDays(days: ForecastDayUpdate[]): ForecastDay[] {
  return days.map(hydrateForecastDay)
}

export function getDefaultForecastIndex(forecastDays: ForecastDay[]) {
  return Math.max(
    0,
    forecastDays.findIndex(({ conditionKey }) => conditionKey === 'storm'),
  )
}

export function buildWeatherData(
  forecastDays: ForecastDay[],
  activeForecastIndex: number,
): WeatherData {
  const activeForecast = forecastDays[activeForecastIndex] ?? forecastDays[0]
  const { day: _day, Icon: _icon, ...activeSnapshot } = activeForecast

  return {
    ...activeSnapshot,
    forecast: forecastDays,
  }
}

export function createChatMessage(
  role: ChatMessage['role'],
  content: string,
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: getTimestamp(),
    ...overrides,
  }
}

function withAiFallbackCopy<T extends { subtitle: string; description: string; insight: string }>(
  snapshot: T,
): T {
  return {
    ...snapshot,
    subtitle: snapshot.subtitle.trim() || AI_SUBTITLE_FALLBACK,
    description: snapshot.description.trim() || AI_DESCRIPTION_FALLBACK,
    insight: snapshot.insight.trim() || AI_INSIGHT_FALLBACK,
  }
}
