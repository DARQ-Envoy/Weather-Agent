


import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {getWeatherCondition, getDayName, formatSunTime, stripUndefined} from '../utils';

// ─── Open-Meteo variable enums ────────────────────────────────────────────────
// These are the exact parameter names accepted by the Open-Meteo API.
// The agent picks from these lists based on what data the UI needs.

const CurrentVariable = z.enum([
  'temperature_2m',        // Air temperature at 2m in °C
  'apparent_temperature',  // Feels-like temperature accounting for wind/humidity
  'relative_humidity_2m',  // Relative humidity at 2m in %
  'wind_speed_10m',        // Wind speed at 10m in km/h
  'wind_gusts_10m',        // Wind gusts at 10m in km/h
  'wind_direction_10m',    // Wind direction in degrees (0=N, 90=E, 180=S, 270=W)
  'weather_code',          // WMO weather interpretation code
  'uv_index',              // UV index
  'is_day',                // 1 if daytime, 0 if nighttime
  'precipitation',         // Total precipitation (rain + showers + snow) in mm
  'rain',                  // Rain from large-scale systems in mm
  'showers',               // Convective rain/showers in mm
  'snowfall',              // Snowfall in cm
  'cloud_cover',           // Total cloud cover in %
  'pressure_msl',          // Atmospheric pressure at sea level in hPa
  'surface_pressure',      // Atmospheric pressure at surface in hPa
]);

const DailyVariable = z.enum([
  'temperature_2m_max',              // Max air temperature at 2m in °C
  'temperature_2m_min',              // Min air temperature at 2m in °C
  'apparent_temperature_max',        // Max feels-like temperature in °C
  'apparent_temperature_min',        // Min feels-like temperature in °C
  'weather_code',                    // Dominant WMO weather code for the day
  'sunrise',                         // Sunrise time as ISO 8601 string
  'sunset',                          // Sunset time as ISO 8601 string
  'daylight_duration',               // Total daylight in seconds
  'sunshine_duration',               // Sunshine duration in seconds
  'uv_index_max',                    // Max UV index
  'precipitation_sum',               // Total precipitation in mm
  'rain_sum',                        // Total rain in mm
  'showers_sum',                     // Total showers in mm
  'snowfall_sum',                    // Total snowfall in cm
  'precipitation_hours',             // Number of hours with precipitation
  'precipitation_probability_max',   // Max precipitation probability in %
  'wind_speed_10m_max',              // Max wind speed in km/h
  'wind_gusts_10m_max',              // Max wind gusts in km/h
  'wind_direction_10m_dominant',     // Dominant wind direction in degrees
]);

// ─── Input schema ─────────────────────────────────────────────────────────────

const weatherInputSchema = z.object({
  latitude: z.number()
    .describe('Latitude of the resolved location, returned by geoCodingTool.'),

  longitude: z.number()
    .describe('Longitude of the resolved location, returned by geoCodingTool.'),

  name: z.string()
    .describe('Human-readable place name returned by geoCodingTool. Used to label the output.'),

  currentVariables: z.array(CurrentVariable).min(1)
    .describe(
      `Which current weather variables to fetch from Open-Meteo. Select based on what the UI needs.
       Standard set: ["temperature_2m", "apparent_temperature", "relative_humidity_2m",
         "wind_speed_10m", "wind_gusts_10m", "weather_code", "uv_index", "is_day"].
       Add precipitation fields (precipitation, rain, showers, snowfall) when weather looks wet.
       Add cloud_cover or pressure_msl for deeper atmospheric context.`
    ),

  dailyVariables: z.array(DailyVariable).min(1)
    .describe(
      `Which daily forecast variables to fetch. Select based on what the UI needs.
       Standard set: ["temperature_2m_max", "temperature_2m_min", "weather_code",
         "sunrise", "sunset", "uv_index_max", "wind_speed_10m_max",
         "precipitation_probability_max", "precipitation_sum"].
       Add apparent_temperature_max/min for feels-like forecast.
       Add daylight_duration or sunshine_duration when sunshine is relevant.
       Add snowfall_sum for winter conditions.`
    ),

  forecastDays: z.number().int().min(1).max(16).default(6)
    .describe(
      `Number of days to return including today. Default is 6 (today + 5 more days).
       Max is 16. Only used when startDate/endDate are not provided.`
    ),

  startDate: z.string().optional()
    .describe(
      `Optional start date in YYYY-MM-DD format for a specific date range forecast.
       Use when the user asks about weather on a specific date or future period.
       Example: "weather next Friday" → set startDate to that Friday's date.
       Leave empty to forecast forward from today.`
    ),

  endDate: z.string().optional()
    .describe(
      `Optional end date in YYYY-MM-DD format. Must be paired with startDate.
       Set to startDate + 5 days to get a 6-day window from a specific date.
       Max range is 16 days from today.`
    ),

  timezone: z.string().default('auto')
    .describe(
      `Timezone for all date/time values. Use "auto" (default) to auto-detect from coordinates.
       Or pass a timezone string like "Europe/London", "America/New_York". 
       Always use "auto" unless the user has specified a timezone preference.`
    ),
});

// ─── Output schemas ───────────────────────────────────────────────────────────

const currentWeatherSchema = z.object({
  temperature: z.number().optional()
    .describe('Current air temperature in °C'),
  feelsLike: z.number().optional()
    .describe('Apparent/feels-like temperature in °C'),
  humidity: z.number().optional()
    .describe('Relative humidity in %'),
  windSpeed: z.number().optional()
    .describe('Wind speed in km/h at 10m height'),
  windGust: z.number().optional()
    .describe('Wind gust speed in km/h at 10m height'),
  windDirection: z.number().optional()
    .describe('Wind direction in degrees (0=North, 90=East, 180=South, 270=West)'),
  weatherCode: z.number().optional()
    .describe('Raw WMO weather interpretation code'),
  condition: z.string().optional()
    .describe('Human-readable weather condition derived from WMO code'),
  uvIndex: z.number().optional()
    .describe('Current UV index (0–11+)'),
  isDay: z.boolean().optional()
    .describe('True if currently daytime at this location'),
  precipitation: z.number().optional()
    .describe('Total precipitation in mm'),
  rain: z.number().optional()
    .describe('Rain from large-scale weather systems in mm'),
  showers: z.number().optional()
    .describe('Convective rain/showers in mm'),
  snowfall: z.number().optional()
    .describe('Snowfall amount in cm'),
  cloudCover: z.number().optional()
    .describe('Total cloud cover in %'),
  pressureMsl: z.number().optional()
    .describe('Atmospheric pressure at mean sea level in hPa'),
});

const dailyWeatherSchema = z.object({
  date: z.string()
    .describe('Date in YYYY-MM-DD format'),
  dayName: z.string()
    .describe('Full weekday name e.g. Monday, Tuesday'),
  maxTemperature: z.number().optional()
    .describe('Maximum air temperature in °C for the day'),
  minTemperature: z.number().optional()
    .describe('Minimum air temperature in °C for the day'),
  feelsLikeMax: z.number().optional()
    .describe('Maximum apparent temperature in °C'),
  feelsLikeMin: z.number().optional()
    .describe('Minimum apparent temperature in °C'),
  weatherCode: z.number().optional()
    .describe('Dominant WMO weather code for the day'),
  condition: z.string().optional()
    .describe('Human-readable weather condition for the day'),
  sunrise: z.string().optional()
    .describe('Sunrise time in 12-hour format e.g. "6:12 AM"'),
  sunset: z.string().optional()
    .describe('Sunset time in 12-hour format e.g. "7:48 PM"'),
  uvIndexMax: z.number().optional()
    .describe('Maximum UV index for the day'),
  maxWindSpeed: z.number().optional()
    .describe('Maximum wind speed in km/h'),
  maxWindGust: z.number().optional()
    .describe('Maximum wind gust speed in km/h'),
  dominantWindDirection: z.number().optional()
    .describe('Dominant wind direction in degrees for the day'),
  precipitationSum: z.number().optional()
    .describe('Total precipitation sum in mm'),
  rainSum: z.number().optional()
    .describe('Total rain sum in mm'),
  showersSum: z.number().optional()
    .describe('Total showers sum in mm'),
  snowfallSum: z.number().optional()
    .describe('Total snowfall in cm'),
  precipitationHours: z.number().optional()
    .describe('Number of hours with precipitation during the day'),
  precipitationProbabilityMax: z.number().optional()
    .describe('Maximum precipitation probability in % for the day'),
  daylightDuration: z.number().optional()
    .describe('Total daylight duration in seconds'),
  sunshineDuration: z.number().optional()
    .describe('Total sunshine duration in seconds'),
});

const weatherOutputSchema = z.object({
  location: z.string()
    .describe('Resolved display name of the location'),
  timezone: z.string()
    .describe('Timezone identifier for this location e.g. "Europe/London"'),
  current: currentWeatherSchema.optional()
    .describe('Current weather snapshot — only present when currentVariables were requested'),
  daily: z.array(dailyWeatherSchema).optional()
    .describe('Array of daily forecast entries — one per day, up to forecastDays length'),
});

// ─── Open-Meteo API response type ─────────────────────────────────────────────

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: Record<string, number>;
  daily?: Record<string, (string | number | null)[]> & { time: string[] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Fetch function ───────────────────────────────────────────────────────────

async function fetchWeather(
  input:  {
    latitude: number;
    longitude: number;
    name: string;
    currentVariables: z.infer<typeof CurrentVariable>[];
    dailyVariables: z.infer<typeof DailyVariable>[];
    forecastDays?: number;      // ← optional to match context
    startDate?: string;
    endDate?: string;
    timezone?: string;          // ← optional to match context
  },
  abortSignal?: AbortSignal,
): Promise<z.infer<typeof weatherOutputSchema>> {
  const params = new URLSearchParams({
    latitude: input.latitude.toString(),
    longitude: input.longitude.toString(),
    current: input.currentVariables.join(','),
    daily: input.dailyVariables.join(','),
    timezone: input.timezone ?? 'auto',
  });
  const forecastDays = input.forecastDays ?? 6; // ← apply default here

  if (input.startDate && input.endDate) {
    params.set('start_date', input.startDate);
    params.set('end_date', input.endDate);
  } else {
    params.set('forecast_days', String(forecastDays));
  }

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal: abortSignal },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Open-Meteo API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;

  // ── Current weather ───────────────────────────────────────────────────────
  const current: z.infer<typeof currentWeatherSchema> | undefined = data.current
    ? stripUndefined({
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        windGust: data.current.wind_gusts_10m,
        windDirection: data.current.wind_direction_10m,
        weatherCode: data.current.weather_code,
        condition:
          data.current.weather_code != null
            ? getWeatherCondition(data.current.weather_code)
            : undefined,
        uvIndex: data.current.uv_index,
        isDay:
          data.current.is_day != null ? Boolean(data.current.is_day) : undefined,
        precipitation: data.current.precipitation,
        rain: data.current.rain,
        showers: data.current.showers,
        snowfall: data.current.snowfall,
        cloudCover: data.current.cloud_cover,
        pressureMsl: data.current.pressure_msl,
      })
    : undefined;

  // ── Daily forecast ────────────────────────────────────────────────────────
  const daily: z.infer<typeof dailyWeatherSchema>[] | undefined =
    data.daily?.time?.map((date, i) => {
      const d = data.daily!;
      const weatherCode = d.weather_code?.[i] as number | undefined;
      const sunriseRaw = d.sunrise?.[i] as string | undefined;
      const sunsetRaw = d.sunset?.[i] as string | undefined;

      return stripUndefined({
        date: date as string,
        dayName: getDayName(date as string),
        maxTemperature: d.temperature_2m_max?.[i] as number | undefined,
        minTemperature: d.temperature_2m_min?.[i] as number | undefined,
        feelsLikeMax: d.apparent_temperature_max?.[i] as number | undefined,
        feelsLikeMin: d.apparent_temperature_min?.[i] as number | undefined,
        weatherCode,
        condition:
          weatherCode != null ? getWeatherCondition(weatherCode) : undefined,
        sunrise: sunriseRaw ? formatSunTime(sunriseRaw) : undefined,
        sunset: sunsetRaw ? formatSunTime(sunsetRaw) : undefined,
        uvIndexMax: d.uv_index_max?.[i] as number | undefined,
        maxWindSpeed: d.wind_speed_10m_max?.[i] as number | undefined,
        maxWindGust: d.wind_gusts_10m_max?.[i] as number | undefined,
        dominantWindDirection:
          d.wind_direction_10m_dominant?.[i] as number | undefined,
        precipitationSum: d.precipitation_sum?.[i] as number | undefined,
        rainSum: d.rain_sum?.[i] as number | undefined,
        showersSum: d.showers_sum?.[i] as number | undefined,
        snowfallSum: d.snowfall_sum?.[i] as number | undefined,
        precipitationHours: d.precipitation_hours?.[i] as number | undefined,
        precipitationProbabilityMax:
          d.precipitation_probability_max?.[i] as number | undefined,
        daylightDuration: d.daylight_duration?.[i] as number | undefined,
        sunshineDuration: d.sunshine_duration?.[i] as number | undefined,
      });
    });

  return {
    location: input.name,
    timezone: data.timezone,
    current,
    daily,
  };
}

// ─── Tool ─────────────────────────────────────────────────────────────────────

export const weatherTool = createTool({
  id: 'get-weather',
  description: `Fetches current weather conditions and a multi-day daily forecast from Open-Meteo.
Call this ONLY after geoCodingTool has returned latitude, longitude, and name.
You control which variables are fetched — select them based on what the UI needs.
Always fetch current + daily data together in one call.
Default to forecastDays: 6 (today + 5 more) unless the user specifies a date range.
Use startDate + endDate for specific future dates (e.g. "weather next Friday").
The output contains clean named fields ready to pass into the showWeatherUI tool.`,
  inputSchema: weatherInputSchema,
  outputSchema: weatherOutputSchema,
  execute: async ( context , options) => {
    return fetchWeather(context, options?.abortSignal);
  },
});