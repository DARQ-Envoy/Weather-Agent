import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchInitialWeather, sendMessage as sendChatMessage } from './api'
import { AboutPage } from './components/about/AboutPage'
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
  formatHeaderDate,
  getRandomDefaultLocation,
  hydrateForecastDays,
} from './lib/utils'
import type { AppPage, ChatMessage, ForecastDay, Location, WeatherData } from './types'

function getPageFromHash(hash: string): AppPage {
  return hash === '#/about' ? 'about' : 'home'
}

export default function App() {
  const [page, setPage] = useState<AppPage>(() => getPageFromHash(window.location.hash))
  const [chatOpen, setChatOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitialWeatherLoading, setIsInitialWeatherLoading] = useState(true)
  const { location, loading: isLocationLoading } = useGeolocation()
  const defaultLocation = useMemo(() => getRandomDefaultLocation(), [])
  const initialWeatherKeyRef = useRef<string | null>(null)
  const activeInitialWeatherRequestRef = useRef<string | null>(null)
  const hasLoadedInitialWeatherRef = useRef(false)
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
    if (isLocationLoading) return

    const weatherLocation = location ?? defaultLocation

    const requestKey = `${weatherLocation.lat}:${weatherLocation.lng}`
    if (initialWeatherKeyRef.current === requestKey) return

    activeInitialWeatherRequestRef.current = requestKey
    if (!hasLoadedInitialWeatherRef.current) {
      setIsInitialWeatherLoading(true)
    }

    let ignore = false

    void fetchInitialWeather(weatherLocation)
      .then((data) => {
        if (ignore || !data?.daily?.length) return

        setForecastDays(hydrateForecastDays(data.daily))
        setActiveForecastIndex(0)
        initialWeatherKeyRef.current = requestKey
        hasLoadedInitialWeatherRef.current = true
      })
      .catch(() => undefined)
      .finally(() => {
        if (ignore || activeInitialWeatherRequestRef.current !== requestKey) return
        setIsInitialWeatherLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [defaultLocation, isLocationLoading, location])

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getPageFromHash(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

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

  const handleNavigate = useCallback((nextPage: AppPage) => {
    const nextHash = nextPage === 'about' ? '#/about' : '#/'
    if (window.location.hash === nextHash) {
      setPage(nextPage)
      return
    }

    window.location.hash = nextHash
  }, [])

  const weatherTheme = weatherData?.conditionKey ?? 'cloudy'
  const headerDate = formatHeaderDate(forecastDays[activeForecastIndex]?.date)
  const headerMetaText = page === 'home' ? headerDate : 'About'

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
        {isInitialWeatherLoading ? (
          <div
            aria-label="Loading weather"
            aria-live="polite"
            className="initial-weather-overlay"
            role="status"
          >
            <div className="initial-weather-loader">
              <span className="initial-weather-spinner" aria-hidden="true" />
              <span>Loading weather</span>
            </div>
          </div>
        ) : null}

        <DashboardHeader metaText={headerMetaText} onNavigate={handleNavigate} page={page} />

        <div className="dashboard-shell">
          {page === 'home' ? (
            <>
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
            </>
          ) : (
            <AboutPage />
          )}
        </div>
      </section>
    </main>
  )
}
