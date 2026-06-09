# forecast.now

A conversational weather application powered by an AI agent. Users ask about weather in natural language — the agent resolves locations, fetches live data, and dynamically updates the dashboard UI without printing data in the chat.

> **Repo:** [github.com/DARQ-Envoy/Weather-Agent](https://github.com/DARQ-Envoy/Weather-Agent)

---

## What It Does

- Ask for weather anywhere in the world by name or share your coordinates
- Agent resolves ambiguous locations before fetching ("Chelsea in the UK or US?")
- Dashboard updates in real time as the agent calls tools — no page reloads
- 6-day forecast with condition-based backgrounds, wind, UV, sunrise/sunset
- Conversation memory scoped per session — follow-up questions work naturally
- On load, the app fetches weather at the user's current location automatically

---

## Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Axios (REST calls)
- Native `fetch` + `ReadableStream` (SSE streaming)

**Agentic Layer**
- [Mastra](https://mastra.ai) — agent framework, tool orchestration, memory, observability
- OpenAI `gpt-4o-mini` — language model
- [Open-Meteo](https://open-meteo.com) — free weather API (no key required)
- [Nominatim / OpenStreetMap](https://nominatim.org) — free geocoding (no key required)

**Storage**
- LibSQL (SQLite) — conversation memory (local dev)
- DuckDB — observability traces

---

## Project Structure

This is a monorepo. The Mastra agent lives inside the React project under `src/mastra/`.

```
weather-app/
├── src/
│   ├── api/
│   │   └── index.ts                    # Frontend API layer (Axios + SSE fetch)
│   ├── components/
│   │   ├── about/
│   │   │   └── AboutPage.tsx
│   │   ├── cards/
│   │   │   ├── AIInsightCard.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── SunriseCard.tsx
│   │   │   └── WindCard.tsx
│   │   ├── layout/
│   │   │   └── DashboardHeader.tsx
│   │   ├── ui/
│   │   │   └── button.tsx
│   │   └── weather/
│   │       ├── FloatingChat.tsx
│   │       ├── ForecastTimeline.tsx
│   │       ├── HeroWeather.tsx
│   │       ├── WeatherAssistant.tsx
│   │       └── WeatherInput.tsx
│   ├── hooks/
│   │   ├── useFloatingChat.ts
│   │   └── useGeolocation.ts           # Browser Geolocation API
│   ├── lib/
│   │   └── utils.ts
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── weather-agent.ts        # Agent definition, model, tools, memory
│   │   ├── server/
│   │   │   └── chat-routes.ts          # Custom Mastra API routes
│   │   ├── tools/
│   │   │   ├── geo-coding-tool.ts      # Location name → coordinates
│   │   │   ├── weather-tool.ts         # Coordinates → weather data (Open-Meteo)
│   │   │   └── showUI-tool.ts          # UI update primitive tool
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── schemas.ts
│   │   ├── utils/
│   │   │   └── index.ts                # Shared helpers (getDayName, formatSunTime, etc.)
│   │   ├── workflows/
│   │   │   └── weather-workflow.ts
│   │   └── index.ts                    # Mastra instance
│   ├── types/
│   │   └── index.ts                    # Shared frontend types
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js **22+** (required by Mastra)
- An OpenAI API key

### Installation

```bash
git clone https://github.com/DARQ-Envoy/Weather-Agent.git
cd Weather-Agent
npm install
```

### Environment Variables

Copy `.env.example` and fill in your values:

```bash
cp .env.example .env
```

```dotenv
# OpenAI
OPENAI_API_KEY=sk-...

# Mastra API URL (frontend uses this to reach the Mastra server)
VITE_MASTRA_API_URL=http://localhost:4111
```

### Running Locally

This project requires **two terminals running simultaneously**.

**Terminal 1 — React frontend**
```bash
npm run dev
```
Starts the Vite dev server at `http://localhost:5173`

**Terminal 2 — Mastra agent server**
```bash
npx mastra dev
```
Starts the Mastra server at `http://localhost:4111`
Mastra Studio (agent playground) is also available at `http://localhost:4111`

---

## How It Works

### Request Flow

```
User types message
        ↓
Frontend sends POST /chat { message, threadId, resourceId, location }
        ↓
Mastra API receives request, opens SSE stream
        ↓
Agent runs — calls tools as needed:
  1. geoCodingTool   → resolves location name to coordinates
  2. weatherTool     → fetches weather data from Open-Meteo
  3. showWeatherUI   → formats and emits structured UI data
        ↓
SSE stream emits events:
  threadId      → frontend persists to sessionStorage
  token         → streamed into chat bubble
  weatherUpdate → intercepted, updates dashboard
  done          → stream closes
        ↓
Dashboard re-renders with new weather data
```

### On App Load

Before the user types anything, the app calls `GET /weather/init?lat=&lng=` with the user's coordinates (if location permission was granted). This fetches the initial 6-day forecast directly from Open-Meteo — no agent, no LLM — and populates the dashboard immediately.

---

## The Agent

### Model

`gpt-4o-mini` — chosen for its strong tool-use performance, low cost, and reliable instruction following.

### Memory

The agent uses Mastra's `Memory` class backed by LibSQL. Conversations are scoped by:

- `threadId` — identifies the conversation session, stored in `sessionStorage` (clears on tab close)
- `resourceId` — identifies the user, stored in `localStorage` (persists across sessions)

When no `threadId` is provided, the server generates a new UUID and returns it as the first SSE event. Subsequent messages in the same tab reuse the same thread, giving the agent full conversation context for natural follow-up questions.

### Tools

**`geoCodingTool`**
Resolves a place name to geographic coordinates (latitude, longitude) using the Open-Meteo geocoding API. The agent calls this first whenever the user provides a location by name. Returns the top match with coordinates and country context.

**`weatherTool`**
Fetches current conditions and a multi-day daily forecast from Open-Meteo. Requires coordinates from `geoCodingTool`. The agent controls exactly which weather variables to request — current variables (temperature, humidity, wind, UV, etc.) and daily variables (max/min temp, sunrise, sunset, precipitation probability, etc.) are passed as arrays, giving the agent full flexibility to fetch only what it needs for the request at hand.

**`showWeatherUI`**
A UI primitive tool — its sole purpose is to update the frontend dashboard. The agent calls it as the final step of every weather request, passing a fully formatted `WeatherData` object assembled from the raw tool outputs. It authors the narrative fields itself: `condition`, `subtitle`, `description`, `insight`, and `confidence` for today and all 6 forecast days.

The tool's `execute` function is a pass-through — it returns its input unchanged. The real work happens in the API layer, which intercepts `tool-result` events in the `fullStream` and emits a `weatherUpdate` SSE event to the frontend only when `toolName === "showWeatherUI"`. All other tool results (geocoding, weather fetch) pass through silently.

---

## Architectural Decisions

### UI Tools Pattern

The agent doesn't update the UI by printing data in the chat. Instead, `showWeatherUI` acts as a typed command — calling it is the agent declaring what the UI should render. The frontend maps that tool result directly to a dashboard state update.

This separates concerns cleanly: the agent owns data and narrative, the frontend owns rendering. The chat is for conversation; the dashboard is for data.

### SSE over WebSockets

Server-Sent Events are used for streaming because:
- Unidirectional (server → client) is all that's needed
- No handshake overhead
- Native browser support with no additional library
- Works directly with Mastra's `fullStream` API

### Tool Call Filtering

The SSE stream only forwards `showWeatherUI` tool results to the frontend. `geoCodingTool` and `weatherTool` results are internal — the frontend never sees them. This keeps the frontend contract minimal and predictable.

### No Authentication

Weather is public data. Users get an anonymous `resourceId` on first visit (localStorage) and a `threadId` per session (sessionStorage). When authentication is added later, swapping `resourceId` for a real user ID requires no changes to the agent or memory system.

### Monorepo Structure

The Mastra agent lives inside the React project (`src/mastra/`) rather than a separate package. This keeps the project simple — one `npm install`, one repo, shared TypeScript types between the frontend and agent with no additional build pipeline.

---

## API Routes

All routes are registered via Mastra's `registerApiRoute` and served at `http://localhost:4111`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Main chat endpoint. Streams SSE response. Creates threadId if not provided. |
| `GET` | `/weather/init` | Fetches 6-day forecast at coordinates on app load. Bypasses agent entirely. |
| `GET` | `/chat/history?threadId=` | Returns message history for a thread. |
| `DELETE` | `/chat` | Deletes a thread and clears conversation memory. |
| `GET` | `/health` | Health check — confirms agent is available. |

---

## License

MIT