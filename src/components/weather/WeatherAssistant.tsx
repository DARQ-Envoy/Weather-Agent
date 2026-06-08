import { motion } from 'framer-motion'
import { useFloatingChat } from '../../hooks/useFloatingChat'
import type { ChatMessage } from '../../types'
import { FloatingChat } from './FloatingChat'
import { WeatherInput } from './WeatherInput'

interface WeatherAssistantProps {
  chatOpen: boolean
  isSending: boolean
  input: string
  messages: ChatMessage[]
  onChatOpenChange: (open: boolean) => void
  onInputChange: (value: string) => void
  onQuickAction: (prompt: string) => void
  onSendMessage: () => void
}

const quickActions = [
  'Will it rain tomorrow?',
  'Should I bring an umbrella?',
  'Weekend forecast',
  'Best time to go jogging?',
]

export function WeatherAssistant({
  chatOpen,
  isSending,
  input,
  messages,
  onChatOpenChange,
  onInputChange,
  onQuickAction,
  onSendMessage,
}: WeatherAssistantProps) {
  const lastMessage = messages[messages.length - 1]
  const scrollKey = lastMessage ? `${messages.length}:${lastMessage.content}` : 'empty'
  const { containerRef, messagesEndRef } = useFloatingChat(chatOpen, scrollKey, () =>
    onChatOpenChange(false),
  )

  return (
    <section className="weather-assistant" ref={containerRef}>
      <motion.div
        className="quick-actions"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
      >
        {quickActions.map((action) => (
          <motion.button
            className="quick-chip"
            disabled={isSending}
            key={action}
            onClick={() => onQuickAction(action)}
            type="button"
            whileHover={{ backgroundColor: 'rgba(255,255,255,.12)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {action}
          </motion.button>
        ))}
      </motion.div>

      <div className="assistant-input-shell">
        <FloatingChat isOpen={chatOpen} messages={messages} messagesEndRef={messagesEndRef} />
        <WeatherInput
          isSending={isSending}
          value={input}
          onChange={onInputChange}
          onFocus={() => onChatOpenChange(true)}
          onSubmit={onSendMessage}
        />
      </div>
    </section>
  )
}
