import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getDayName, formatSunTime, buildSnapshot } from "../utils";

// ─── Validation ───────────────────────────────────────────────────────────────

const chatBodySchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000),
  threadId: z.string().optional(), // empty string or missing = new thread
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      label: z.string().optional(),
    })
    .optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMessageWithContext(
  message: string,
  location?: { lat: number; lng: number; label?: string }
): string {
  if (!location) return message;
  const label = location.label ?? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  return `[User's current location: ${label} (lat: ${location.lat}, lng: ${location.lng})]\n\n${message}`;
}

function errorResponse(c: any, status: number, message: string, details?: string) {
  return c.json({ error: message, ...(details ? { details } : {}) }, status);
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}





export const weatherInitRoute = registerApiRoute("/weather/init", {
  method: "GET",
  handler: async (c) => {
    const lat = c.req.query("lat");
    const lng = c.req.query("lng");

    if (!lat || !lng) {
      return errorResponse(c, 400, "lat and lng query params are required");
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return errorResponse(c, 400, "lat and lng must be valid numbers");
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return errorResponse(c, 400, "lat or lng out of valid range");
    }

    try {
      // ── Reverse geocode coordinates to place name ───────────────────────
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "User-Agent": "weather-app" } }
      );

      let locationName = "Your Location";
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        locationName =
          geoData.address?.city ??
          geoData.address?.town ??
          geoData.address?.village ??
          geoData.address?.county ??
          "Your Location";
      }

      // ── Fetch weather from Open-Meteo ───────────────────────────────────
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: [
          "temperature_2m",
          "apparent_temperature",
          "relative_humidity_2m",
          "wind_speed_10m",
          "wind_gusts_10m",
          "weather_code",
          "uv_index",
          "is_day",
          "precipitation",
        ].join(","),
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "weather_code",
          "sunrise",
          "sunset",
          "uv_index_max",
          "wind_speed_10m_max",
          "precipitation_probability_max",
          "precipitation_sum",
        ].join(","),
        forecast_days: "6",
        timezone: "auto",
      });

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`
      );

      if (!weatherResponse.ok) {
        return errorResponse(c, 502, "Failed to fetch weather data");
      }

      const data = await weatherResponse.json();

      // ── Format daily entries ────────────────────────────────────────────
      const daily = data.daily.time.map((date: string, i: number) => {
        return {
    day: getDayName(date),
    date: date as string,
    ...buildSnapshot(
      locationName,
      data.daily.weather_code[i],
      data.daily.temperature_2m_max[i],
      data.daily.uv_index_max[i],
      data.daily.wind_speed_10m_max[i],
      formatSunTime(data.daily.sunrise[i]),
      formatSunTime(data.daily.sunset[i]),
      Math.max(90 - i * 7, 50), // confidence decreases per day
    ),
  }
      });

      return c.json({
        location: locationName,
        timezone: data.timezone,
        daily,
      });
    } catch (err: any) {
      return errorResponse(c, 500, "Failed to retrieve weather data");
    }
  },
});

// ─── POST /api/chat ───────────────────────────────────────────────────────────
// Single endpoint for all chat interactions.
// - If threadId is missing or empty, a new one is created and returned.
// - Streams response back via SSE.
// - Emits a weatherUpdate event as a side effect when the agent calls weatherTool.

export const weatherChatRoute = registerApiRoute("/chat", {
  method: "POST",
  handler: async (c) => {
    // Parse body
    let body: z.infer<typeof chatBodySchema>;
    try {
      const raw = await c.req.json();
      const parsed = chatBodySchema.safeParse(raw);
      if (!parsed.success) {
        return errorResponse(
          c,
          400,
          "Invalid request body",
          parsed.error.issues.map((i) => i.message).join(", ")
        );
      }
      body = parsed.data;
    } catch {
      return errorResponse(c, 400, "Request body must be valid JSON");
    }

    // Resolve or create threadId
    const threadId =
      body.threadId && body.threadId.trim() !== ""
        ? body.threadId
        : randomUUID();

    const mastra = c.get("mastra");
    const weatherAgent = mastra.getAgent("weatherAgent");

    if (!weatherAgent) {
      return errorResponse(c, 503, "Weather agent unavailable");
    }

    const messageWithContext = buildMessageWithContext(body.message, body.location);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown) {
          controller.enqueue(encoder.encode(sseEvent(event, data)));
        }

        try {
          // Send threadId immediately so frontend can persist it
          // before the stream even begins
          send("threadId", { threadId });

          const result = await weatherAgent.stream(
            [{ role: "user", content: messageWithContext }],
            {
              memory: {
                thread: { id: threadId },
                resource: "my-general-resource-id",
              },
            }
          );

          // Stream text tokens and intercept only showWeatherUI tool results
          for await (const chunk of result.fullStream) {
                if (chunk.type === "text-delta") {
            send("token", { token: chunk.payload.text });
          }
          if (chunk.type === "tool-result" && chunk.payload.toolName === "showWeatherUI") {
              send("weatherUpdate", {
                data: chunk.payload.result,
                timestamp: new Date().toISOString(),
              });
            }
          }

          send("done", { threadId });
        } catch (err: any) {
          const isLLMError = err?.message?.includes("Upstream LLM");
          send("error", {
            message: isLLMError
              ? "The AI service is temporarily unavailable. Please try again."
              : "Something went wrong. Please try again.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
});










// export const weatherChatRoute = registerApiRoute("/chat", {
//   method: "POST",
//   handler: async (c) => {
//     // Parse body
//     let body: z.infer<typeof chatBodySchema>;
//     try {
//       const raw = await c.req.json();
//       const parsed = chatBodySchema.safeParse(raw);
//       if (!parsed.success) {
//         return errorResponse(
//           c,
//           400,
//           "Invalid request body",
//           parsed.error.issues.map((i) => i.message).join(", ")
//         );
//       }
//       body = parsed.data;
//     } catch {
//       return errorResponse(c, 400, "Request body must be valid JSON");
//     }

//     // Resolve or create threadId
//     const threadId =
//       body.threadId && body.threadId.trim() !== ""
//         ? body.threadId
//         : randomUUID();

//     const mastra = c.get("mastra");
//     const weatherAgent = mastra.getAgent("weatherAgent");

//     if (!weatherAgent) {
//       return errorResponse(c, 503, "Weather agent unavailable");
//     }

//     const messageWithContext = buildMessageWithContext(body.message, body.location);

//     const encoder = new TextEncoder();

//     const stream = new ReadableStream({
//       async start(controller) {
//         function send(event: string, data: unknown) {
//           controller.enqueue(encoder.encode(sseEvent(event, data)));
//         }

//         try {
//           // Send threadId immediately so frontend can persist it
//           // before the stream even begins
//           send("threadId", { threadId });

//           const result = await weatherAgent.stream(
//             [{ role: "user", content: messageWithContext }],
//             {
//                 memory: {
//                     thread: { id: threadId },
//                     resource: 'my-general-resource-id',                
//                 },
//                     });

//           // Stream text tokens
//           for await (const chunk of result.textStream) {
//             send("token", { token: chunk });
//           }

//           // Extract full response after streaming completes
//           const fullResponse = await result.response;

//           // Extract weather tool results for UI side effect
//           const toolResults = fullResponse.messages
//             ?.filter((m: any) => m.role === "tool")
//             ?.flatMap((m: any) =>
//               Array.isArray(m.content)
//                 ? m.content
//                     .filter((c: any) => c.type === "tool-result")
//                     .map((c: any) => c.result)
//                 : []
//             );

//           if (toolResults?.length) {
//             send("weatherUpdate", {
//               data: toolResults[0],
//               timestamp: new Date().toISOString(),
//             });
//           }

//           send("done", { threadId });
//         } catch (err: any) {
//           const isLLMError = err?.message?.includes("Upstream LLM");
//           send("error", {
//             message: isLLMError
//               ? "The AI service is temporarily unavailable. Please try again."
//               : "Something went wrong. Please try again.",
//           });
//         } finally {
//           controller.close();
//         }
//       },
//     });

//     return new Response(stream, {
//       headers: {
//         "Content-Type": "text/event-stream",
//         "Cache-Control": "no-cache",
//         Connection: "keep-alive",
//         "X-Accel-Buffering": "no",
//       },
//     });
//   },
// });






// ─── GET /api/chat/history ────────────────────────────────────────────────────
// Restores message history for a given threadId.
// Called on page load if a threadId exists in sessionStorage.

// export const historyRoute = registerApiRoute("/chat/history", {
//   method: "GET",
//   handler: async (c) => {
//     const threadId = c.req.query("threadId");

//     if (!threadId || threadId.trim() === "") {
//       return errorResponse(c, 400, "threadId query param is required");
//     }

//     try {
//       const mastra = c.get("mastra");
//         const weatherAgent = mastra.getAgent("weather-agent");

//       const memory = await weatherAgent.getMemory();

// if (!memory) {
//   return errorResponse(c, 503, "Memory unavailable");
// }

// const thread = await memory.getThreadById({ threadId });


// if (!thread) {
//   return c.json({ messages: [], threadId });
// }
// const { messages } = await memory.recall({
//   threadId,
//   selectBy: {
//     last: 50, // last 50 messages
//   },
// });
// // const { messages } = await memory.query({
// //   threadId,

// // });
//       const cleaned = messages
//         .filter((m: any) => m.role !== "tool")
//         .map((m: any) => ({
//           id: m.id,
//           role: m.role,
//           content:
//             typeof m.content === "string"
//               ? m.content.replace(/^\[User's current location:.*?\]\n\n/, "")
//               : m.content,
//           timestamp: m.createdAt,
//         }));

//       return c.json({ messages: cleaned, threadId });
//     } catch {
//       return errorResponse(c, 500, "Failed to fetch history");
//     }
//   },
// });

// ─── DELETE /api/chat ─────────────────────────────────────────────────────────
// Clears a thread. Called on "New Chat" or explicit clear.
// Frontend should also clear sessionStorage threadId after calling this.

export const clearThreadRoute = registerApiRoute("/chat", {
  method: "DELETE",
  handler: async (c) => {
    let threadId: string | undefined;
    try {
      const body = await c.req.json();
      threadId = body?.threadId;
    } catch {
      return errorResponse(c, 400, "Request body must be valid JSON");
    }

    if (!threadId || threadId.trim() === "") {
      return errorResponse(c, 400, "threadId is required");
    }

    try {
      const mastra = c.get("mastra");
       const weatherAgent = mastra.getAgent("weather-agent");
        const memory = await weatherAgent.getMemory()
      if (!memory) {
        return errorResponse(c, 503, "Memory unavailable");
      }

      await memory.deleteThread( threadId );

      return c.json({ success: true });
    } catch {
      return errorResponse(c, 500, "Failed to clear thread");
    }
  },
});

// ─── GET /api/health ──────────────────────────────────────────────────────────

export const healthRoute = registerApiRoute("/health", {
  method: "GET",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const agentAvailable = !!mastra.getAgent("weather-agent");
    return c.json({
      status: agentAvailable ? "ok" : "degraded",
      agent: agentAvailable ? "available" : "unavailable",
      timestamp: new Date().toISOString(),
    });
  },
});