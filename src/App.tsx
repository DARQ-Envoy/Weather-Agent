import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchInitialWeather, sendMessage as sendChatMessage } from './api'
import { AIInsightCard } from './components/cards/AIInsightCard'
import { SunriseCard } from './components/cards/SunriseCard'
import { WindCard } from './components/cards/WindCard'
import { DashboardHeader } from './components/layout/DashboardHeader'
import { ForecastTimeline } from './components/weather/ForecastTimeline'
import { HeroWeather } from './components/weather/HeroWeather'
import { WeatherAssistant } from './components/weather/WeatherAssistant'
import { useGeolocation } from './hooks/useGeolocation'
import {
  buildWeatherData,
  createChatMessage,
  hydrateForecastDays,
} from './lib/utils'
import type { ChatMessage, ForecastDay, Location, WeatherData } from './types'

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { location } = useGeolocation()
  const initialWeatherKeyRef = useRef<string | null>(null)
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createChatMessage(
      'assistant',
      'Pick a day or ask about the forecast and I can help plan around the conditions.',
      { confidence: 86 },
    ),
  ])
  const [input, setInput] = useState('')
  const [activeForecastIndex, setActiveForecastIndex] = useState(0)

  const weatherData: WeatherData | null = useMemo(
    () => (forecastDays.length ? buildWeatherData(forecastDays, activeForecastIndex) : null),
    [activeForecastIndex, forecastDays],
  )

  useEffect(() => {
    if (!location) return

    const requestKey = `${location.lat}:${location.lng}`
    if (initialWeatherKeyRef.current === requestKey) return

    initialWeatherKeyRef.current = requestKey

    let ignore = false

    void fetchInitialWeather(location).then((data) => {
      if (ignore || !data?.daily?.length) return

      setForecastDays(hydrateForecastDays(data.daily))
      setActiveForecastIndex(0)
    })

    return () => {
      ignore = true
    }
  }, [location])

  const appendAssistantContent = useCallback((messageId: string, token: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: `${message.content}${token}`,
              pending: false,
            }
          : message,
      ),
    )
  }, [])

  const finalizeAssistantMessage = useCallback((messageId: string, content?: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: content ?? message.content,
              pending: false,
            }
          : message,
      ),
    )
  }, [])

  const sendPrompt = useCallback(
    (prompt: string, location?: Location) => {
      const cleanPrompt = prompt.trim()
      if (!cleanPrompt || isSending) return

      const assistantMessageId = crypto.randomUUID()

      setChatOpen(true)
      setMessages((current) => [
        ...current,
        createChatMessage('user', cleanPrompt),
        createChatMessage('assistant', '', { id: assistantMessageId, pending: true }),
      ])
      setInput('')
      setIsSending(true)

      void sendChatMessage(
        cleanPrompt,
        {
          onThreadId: () => undefined,
          onToken: (token) => appendAssistantContent(assistantMessageId, token),
          onWeatherUpdate: (data) => {
            setForecastDays(hydrateForecastDays(data.forecast))
            setActiveForecastIndex(0)
          },
          onDone: () => {
            setIsSending(false)
            finalizeAssistantMessage(assistantMessageId)
          },
          onError: (message) => {
            setIsSending(false)
            finalizeAssistantMessage(assistantMessageId, message)
          },
        },
        location,
      ).catch(() => {
        setIsSending(false)
        finalizeAssistantMessage(
          assistantMessageId,
          'Something went wrong. Please try again.',
        )
      })
    },
    [appendAssistantContent, finalizeAssistantMessage, isSending],
  )

  const handleSendMessage = useCallback(() => {
    sendPrompt(input, location ?? undefined)
  }, [input, location, sendPrompt])

  const weatherTheme = weatherData?.conditionKey ?? 'cloudy'

  return (
    <main className="weather-page">
      <section className={`weather-dashboard weather-${weatherTheme}`}>
        <div className="weather-scene" />
        <div className="weather-celestial" />
        <div className="weather-cloud weather-cloud-left" />
        <div className="weather-cloud weather-cloud-right" />
        <div className="weather-cloud weather-cloud-deep" />
        <div className="lightning-field" />
        <div className="weather-gradient" />
        <div className="weather-vignette" />
        <div className="weather-side-shade" />
        <div className="rain-texture" />

        <DashboardHeader />

        <div className="dashboard-shell">
          <section className="dashboard-grid">
            <div className="weather-main">
              {weatherData ? <HeroWeather key={`hero-${activeForecastIndex}`} weather={weatherData} /> : null}
              <WeatherAssistant
                chatOpen={chatOpen}
                isSending={isSending}
                input={input}
                messages={messages}
                onChatOpenChange={setChatOpen}
                onInputChange={setInput}
                onQuickAction={sendPrompt}
                onSendMessage={handleSendMessage}
              />
            </div>

            {weatherData ? (
              <aside className="weather-sidebar" aria-label="Weather details">
                <WindCard speed={weatherData.windSpeed} />
                <SunriseCard sunrise={weatherData.sunrise} sunset={weatherData.sunset} />
                <AIInsightCard confidence={weatherData.confidence} insight={weatherData.insight} />
              </aside>
            ) : null}
          </section>
          {weatherData ? (
            <ForecastTimeline
              activeIndex={activeForecastIndex}
              forecast={weatherData.forecast}
              onSelectDay={setActiveForecastIndex}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}
