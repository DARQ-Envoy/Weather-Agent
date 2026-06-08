import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ─── Condition key ────────────────────────────────────────────────────────────
// Maps to icons and background themes on the frontend.
// The frontend owns the icon mapping — this tool only declares the key.
//
// Frontend mapping (for reference):
//   storm   → CloudLightning  — WMO codes 95–99
//   sunny   → Sun             — WMO codes 0–1
//   rain    → CloudRain       — WMO codes 51–82 (drizzle, rain, showers)
//   cloudy  → Cloud           — WMO codes 2–3
//   snow    → CloudSnow       — WMO codes 71–77, 85–86
//   fog     → CloudFog        — WMO codes 45–48
//   windy   → Wind            — no dominant precipitation, wind > 50 km/h

const conditionKeySchema = z.enum([
  'storm',
  'sunny',
  'rain',
  'cloudy',
  'snow',
  'fog',
  'windy',
]).describe(
  `Map the dominant WMO weather code to the correct UI condition key:
   - storm:  WMO 95–99 (any thunderstorm)
   - sunny:  WMO 0–1 (clear sky, mainly clear)
   - rain:   WMO 51–82 (drizzle, rain, showers, freezing rain)
   - cloudy: WMO 2–3 (partly cloudy, overcast)
   - snow:   WMO 71–77, 85–86 (any snow or snow showers)
   - fog:    WMO 45–48 (fog, rime fog)
   - windy:  No dominant precipitation AND wind speed > 50 km/h`
);

// ─── Shared snapshot schema ───────────────────────────────────────────────────
// Matches WeatherSnapshot in the frontend types.
// Icon is NOT included — the frontend derives it from conditionKey.

const weatherSnapshotSchema = z.object({
  conditionKey: conditionKeySchema,

  condition: z.string()
    .describe('Short weather condition label shown as the hero headline. e.g. "Thunderstorms", "Clear Sky", "Light Rain". Capitalise it.'),

  subtitle: z.string()
    .describe('A brief evocative subtitle beneath the headline. e.g. "intense weather conditions", "warm and sunny afternoon". Lowercase, no period.'),

  description: z.string().max(220)
    .describe('2–3 sentence narrative describing the day\'s character — what to expect, how it feels, any notable patterns. Vivid but concise. No bullet points.'),

  temperature: z.number()
    .describe('Hero temperature in °C. Use current temperature for today, maxTemperature for future days.'),

  location: z.string()
    .describe('Display name for the location. Use the most readable form e.g. "New York", "Chelsea, London", "Tokyo".'),

  uvIndex: z.number()
    .describe('UV index for this period. Use current uv_index for today, uv_index_max for forecast days.'),

  windSpeed: z.number()
    .describe('Wind speed in km/h. Use current wind_speed_10m for today, wind_speed_10m_max for forecast days.'),

  sunrise: z.string()
    .describe('Sunrise time in 12-hour format e.g. "6:12 AM". Use the value from weatherTool output directly.'),

  sunset: z.string()
    .describe('Sunset time in 12-hour format e.g. "7:48 PM". Use the value from weatherTool output directly.'),

  insight: z.string().max(160)
    .describe('One actionable, specific insight for this day. Be practical and direct. Examples: "Rain likely after 3 PM — carry an umbrella.", "UV is low, no sunscreen needed.", "Strong gusts make outdoor dining uncomfortable." No vague statements.'),

  confidence: z.number().int().min(0).max(100)
    .describe('Your confidence in this forecast as a percentage. Be calibrated — today should be 85–95%, each subsequent day 5–10% lower. Use lower values for volatile or rapidly-changing conditions.'),
});

// ─── Forecast day schema ──────────────────────────────────────────────────────
// Extends snapshot with a day name. Matches ForecastDay in frontend types.

const forecastDaySchema = weatherSnapshotSchema.extend({
  day: z.string()
    .describe('Full weekday name. Use dayName from weatherTool daily output e.g. "Monday", "Tuesday". For today, use today\'s day name, not "Today".'),
});

// ─── Full weather data schema ─────────────────────────────────────────────────
// Matches WeatherData in the frontend types.

const showWeatherUISchema = weatherSnapshotSchema.extend({
  forecast: z.array(forecastDaySchema).min(1).max(16)
    .describe(
      `Array of 6 forecast days — today first, then 5 more.
       Today: derive from current weather data (temperature, condition, wind, uv).
       Days 2–6: derive from daily array in weatherTool output.
       For each day you must write: conditionKey, condition, subtitle, description, insight, confidence.
       Do NOT copy the same insight or description across days — each day is unique.
       sunrise/sunset come directly from weatherTool daily output.
       temperature = maxTemperature for forecast days.`
    ),
});

// ─── Tool ─────────────────────────────────────────────────────────────────────

export const showWeatherUI = createTool({
  id: 'showWeatherUI',
  description: `Updates the weather dashboard UI with fully formatted weather data.
Call this as the FINAL step after geoCodingTool and weatherTool have both completed.

Your responsibilities before calling this tool:
1. Map WMO weather codes to the correct conditionKey for today and each forecast day
2. Write a unique condition headline, subtitle, description, and insight for each day
3. Assign a realistic, calibrated confidence score per day (today ~90%, declines each day)
4. Populate the 6-entry forecast array: today first, then 5 additional days
5. Derive today's snapshot from current weather data; future days from the daily array

Do NOT call this tool with placeholder or empty strings.
Do NOT use the same description or insight across multiple days.
Always call this — never respond with weather data as plain text alone.
The tool result is intercepted by the API layer and sent to the frontend as a UI update event.`,

  inputSchema: showWeatherUISchema,
  outputSchema: showWeatherUISchema,

  execute: async (context ) => {
    // Pass-through — this tool's result is intercepted by the API layer
    // in the fullStream loop and emitted as a "weatherUpdate" SSE event.
    // The tool itself does no computation — the agent is the author of this data.
    return context;
  },
});

// ─── Export types for use in the API layer and frontend ───────────────────────

export type ShowWeatherUIInput = z.infer<typeof showWeatherUISchema>;
export type ForecastDayInput = z.infer<typeof forecastDaySchema>;
export type WeatherSnapshotInput = z.infer<typeof weatherSnapshotSchema>;