import { Mic, Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { KeyboardEvent } from 'react'

interface WeatherInputProps {
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onSubmit: () => void
}

export function WeatherInput({ value, onChange, onFocus, onSubmit }: WeatherInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <motion.div
      className="weather-input"
      onClick={onFocus}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
    >
      <Sparkles aria-hidden size={18} />
      <input
        aria-label="Ask AI about the weather"
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        placeholder="Ask AI about the weather..."
        type="text"
        value={value}
      />
      <button aria-label="Use microphone" type="button">
        <Mic aria-hidden size={18} />
      </button>
      <button aria-label="Send message" onClick={onSubmit} type="button">
        <Send aria-hidden size={18} />
      </button>
    </motion.div>
  )
}
