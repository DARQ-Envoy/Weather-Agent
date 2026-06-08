import type { ChatMessage, Location, StreamHandlers, WeatherInitResponse } from "@/types";
import axios from "axios";


// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_MASTRA_API_URL ?? "http://localhost:4111";

const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// ─── Session Helpers ──────────────────────────────────────────────────────────
// threadId lives in sessionStorage — clears on tab close / reload.
// This is intentional: no accounts = no persistent sessions.

const THREAD_KEY = "weather_thread_id";

export const session = {
  getThreadId: (): string | null => sessionStorage.getItem(THREAD_KEY),
  setThreadId: (id: string): void => sessionStorage.setItem(THREAD_KEY, id),
  clearThreadId: (): void => sessionStorage.removeItem(THREAD_KEY),
};

// ─── Chat (SSE stream) ────────────────────────────────────────────────────────
// Axios cannot consume SSE — we use native fetch here only.
// All other endpoints use the Axios instance above.

export async function sendMessage(
  message: string,
  handlers: StreamHandlers,
  location?: Location
): Promise<void> {
  const threadId = session.getThreadId() ?? "";

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, threadId, location }),
    });
  } catch {
    handlers.onError("Could not reach the server. Check your connection.");
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError("Server returned an unexpected response.");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? ""; // keep incomplete chunk in buffer

    for (const part of parts) {
      if (!part.trim()) continue;

      const eventLine = part.match(/^event: (.+)$/m)?.[1];
      const dataLine = part.match(/^data: (.+)$/m)?.[1];

      if (!eventLine || !dataLine) continue;

      let parsed: any;
      try {
        parsed = JSON.parse(dataLine);
      } catch {
        continue;
      }

      switch (eventLine) {
        case "threadId":
          session.setThreadId(parsed.threadId);
          handlers.onThreadId(parsed.threadId);
          break;

        case "token":
          handlers.onToken(parsed.token);
          break;

        case "weatherUpdate":
          handlers.onWeatherUpdate(parsed.data);
          break;

        case "done":
          handlers.onDone();
          break;

        case "error":
          handlers.onError(parsed.message);
          break;
      }
    }
  }
}

// ─── History ──────────────────────────────────────────────────────────────────
// Call on app load if a threadId exists in sessionStorage.
// Restores the conversation so the user sees their previous messages.

export async function fetchInitialWeather(location: Location): Promise<WeatherInitResponse | null> {
  try {
    const { data } = await http.get<WeatherInitResponse>("/weather/init", {
      params: {
        lat: location.lat,
        lng: location.lng,
      },
    });
    console.log(data)

    return data;
  } catch {
    return null;
  }
}

export async function fetchHistory(): Promise<ChatMessage[]> {
  const threadId = session.getThreadId();
  if (!threadId) return [];

  try {
    const { data } = await http.get<{ messages: ChatMessage[] }>("/chat/history", {
      params: { threadId },
    });
    return data.messages;
  } catch (err: any) {
    // Thread may no longer exist on the server (e.g. DB was wiped)
    // Silently clear the stale threadId and start fresh
    if (err?.response?.status === 404) {
      session.clearThreadId();
    }
    return [];
  }
}

// ─── Clear Thread ─────────────────────────────────────────────────────────────
// Call when user clicks "New Chat". Clears server memory + local session.

export async function clearThread(): Promise<void> {
  const threadId = session.getThreadId();
  if (!threadId) return;

  try {
    await http.delete("/chat", { data: { threadId } });
  } catch {
    // Best effort — even if server delete fails, clear locally
  } finally {
    session.clearThreadId();
  }
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await http.get<{ status: string }>("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}
