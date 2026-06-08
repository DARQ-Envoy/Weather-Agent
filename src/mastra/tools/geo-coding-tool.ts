import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { GeocodingResponse } from '../types';

const geoCodingResultSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  name: z.string(),
});

async function resolveLocation(
  location: string,
  countryCode?: string,
  abortSignal?: AbortSignal,
): Promise<z.infer<typeof geoCodingResultSchema>> {
  const params = new URLSearchParams({
    name: location,
    language: 'en',
  });

  if (countryCode) {
    params.set('countryCode', countryCode.toUpperCase());
  }

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const data = (await response.json()) as GeocodingResponse;
  const match = data.results?.[0];

  if (!match) {
    throw new Error(`Location '${location}' not found`);
  }

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    name: match.name,
  };
}

export const geoCodingTool = createTool({
  id: 'geo-code-location',
  description:
    'Resolve a city or place name into coordinates before calling weatherTool. Use this when you have a place name but not latitude and longitude yet.',
  strict: true,
  inputSchema: z.object({
    location: z.string().min(1).describe('City or place name only, for example Lagos or New York'),
    countryCode: z
      .string()
      .length(2)
      .optional()
      .describe('Optional ISO 3166-1 alpha-2 country code such as NG, US, GB, or DE'),
  }),
  outputSchema: geoCodingResultSchema,
  execute: async (inputData, context) => {
    return resolveLocation(inputData.location, inputData.countryCode, context?.abortSignal);
  },
});
