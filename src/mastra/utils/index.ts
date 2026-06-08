import type { ForecastDayUpdate, WeatherConditionKey } from "@/types";

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}



export function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    85: 'Light snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] ?? 'Unknown';
}

export function getDayName(dateStr: string): string {
  // Parse as UTC to avoid timezone-shifting the date
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

export function formatSunTime(isoString: string): string {
  // Open-Meteo returns e.g. "2024-01-01T06:12" — no timezone offset
  const parts = isoString.split('T');
  if (parts.length < 2) return isoString;
  const [hours, minutes] = parts[1].split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  ) as T;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

export function weatherCodeToConditionKey(code: number): WeatherConditionKey {
  if (code >= 95) return 'storm';
  if ([45, 48].includes(code)) return 'fog';
  if ((code >= 71 && code <= 77) || [85, 86].includes(code)) return 'snow';
  if (code >= 51 && code <= 82) return 'rain';
  if (code === 2 || code === 3) return 'cloudy';
  return 'sunny';
}

export function buildSnapshot(
  location: string,
  weatherCode: number,
  temperature: number,
  uvIndex: number,
  windSpeed: number,
  sunrise: string,
  sunset: string,
  confidence: number,
): Omit<ForecastDayUpdate, 'day'> {
  return {
    conditionKey: weatherCodeToConditionKey(weatherCode),
    condition: getWeatherCondition(weatherCode),
    subtitle: '',
    description: '',
    temperature,
    location,
    uvIndex,
    windSpeed,
    sunrise,
    sunset,
    insight: '',
    confidence,
  };
}