// src/hooks/useGeolocation.ts
import { useState, useEffect } from "react";
import type { Location } from "@/types";

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ location: null, error: "Geolocation is not supported by your browser", loading: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied. You can still search by city name.",
          2: "Location unavailable. You can still search by city name.",
          3: "Location request timed out. You can still search by city name.",
        };
        setState({
          location: null,
          error: messages[err.code] ?? "Could not get your location.",
          loading: false,
        });
      },
      {
        timeout: 10_000,
        maximumAge: 5 * 60 * 1000, // cache location for 5 mins
      }
    );
  }, []);

  return state;
}