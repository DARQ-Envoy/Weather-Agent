import { useCallback, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { CloudLightning, CloudRain, CloudSun, Sun } from 'lucide-react'
import { AIInsightCard } from './components/cards/AIInsightCard'
import { SunriseCard } from './components/cards/SunriseCard'
import { WindCard } from './components/cards/WindCard'
import { DashboardHeader } from './components/layout/DashboardHeader'
import { ForecastTimeline } from './components/weather/ForecastTimeline'
import { HeroWeather } from './components/weather/HeroWeather'
import { WeatherAssistant } from './components/weather/WeatherAssistant'
import type { ChatMessage, WeatherData } from './types/weather'
import heroImage from './assets/hero.png'

const responseText =
  'Heavy rain peaks between 3 PM and 6 PM. Keep outdoor plans flexible and expect slower traffic during the evening commute.'

const getTimestamp = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function App() {
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Storm cells are building west of the city. I can help time your commute or plan around the next break in rain.',
      confidence: 87,
      timestamp: getTimestamp(),
    },
  ])
  const [input, setInput] = useState('')

  const weatherData: WeatherData = useMemo(
    () => ({
      condition: 'Thunderstorms',
      subtitle: 'intense weather conditions',
      description:
        'Heavy rain, strong winds, and occasional lightning expected. Sudden downpours may lead to localized flooding.',
      temperature: 22,
      location: 'New York',
      uvIndex: 2,
      windSpeed: 7.9,
      sunrise: '6:12 AM',
      sunset: '7:48 PM',
      insight: 'Heavy rain expected this afternoon. Carry an umbrella and plan indoor activities.',
      confidence: 87,
      forecast: [
        { day: 'Mon', temperature: 26, condition: 'Partly cloudy', Icon: CloudSun },
        { day: 'Tue', temperature: 28, condition: 'Sunny', Icon: Sun },
        { day: 'Wed', temperature: 24, condition: 'Rain', Icon: CloudRain },
        { day: 'Thu', temperature: 26, condition: 'Thunderstorms', Icon: CloudLightning },
        { day: 'Fri', temperature: 23, condition: 'Rain', Icon: CloudRain },
        { day: 'Sat', temperature: 26, condition: 'Partly cloudy', Icon: CloudSun },
        { day: 'Sun', temperature: 27, condition: 'Sunny', Icon: Sun },
      ],
    }),
    [],
  )

  const addAssistantReply = useCallback(() => {
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: responseText,
          confidence: weatherData.confidence,
          timestamp: getTimestamp(),
        },
      ])
    }, 320)
  }, [weatherData.confidence])

  const sendPrompt = useCallback(
    (prompt: string) => {
      const cleanPrompt = prompt.trim()
      if (!cleanPrompt) return

      setChatOpen(true)
      setMessages((current) => [
        ...current,
        {
          role: 'user',
          content: cleanPrompt,
          timestamp: getTimestamp(),
        },
      ])
      setInput('')
      addAssistantReply()
    },
    [addAssistantReply],
  )

  const handleSendMessage = useCallback(() => {
    sendPrompt(input)
  }, [input, sendPrompt])

  return (
    <main className="weather-dashboard" style={{ '--weather-image': `url(${heroImage})` } as CSSProperties}>
      <div className="weather-scene" />
      <div className="weather-gradient" />
      <div className="weather-vignette" />
      <div className="rain-texture" />

      <DashboardHeader />

      <div className="dashboard-shell">
        <section className="dashboard-grid">
          <div className="weather-main">
            <HeroWeather weather={weatherData} />
            <WeatherAssistant
              chatOpen={chatOpen}
              input={input}
              messages={messages}
              onChatOpenChange={setChatOpen}
              onInputChange={setInput}
              onQuickAction={sendPrompt}
              onSendMessage={handleSendMessage}
            />
            <ForecastTimeline forecast={weatherData.forecast} />
          </div>

          <aside className="weather-sidebar" aria-label="Weather details">
            <WindCard speed={weatherData.windSpeed} />
            <SunriseCard sunrise={weatherData.sunrise} sunset={weatherData.sunset} />
            <AIInsightCard confidence={weatherData.confidence} insight={weatherData.insight} />
          </aside>
        </section>
      </div>
    </main>
  )
}
