import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { RefObject } from 'react'
import type { ChatMessage } from '../../types/weather'

interface FloatingChatProps {
  isOpen: boolean
  messages: ChatMessage[]
  messagesEndRef: RefObject<HTMLDivElement | null>
}

export function FloatingChat({ isOpen, messages, messagesEndRef }: FloatingChatProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="floating-chat"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="chat-scroll">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <Sparkles aria-hidden size={24} />
                <span>Ask for a local weather read</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <article className={`chat-message ${message.role}`} key={`${message.timestamp}-${index}`}>
                  {message.role === 'assistant' && (
                    <div className="assistant-label">
                      <Sparkles aria-hidden size={14} />
                      <span>AI Assistant</span>
                    </div>
                  )}
                  <p>{message.content}</p>
                  {message.confidence ? (
                    <div className="message-confidence">
                      <span>Confidence: {message.confidence}%</span>
                      <div>
                        <motion.i
                          initial={{ width: 0 }}
                          animate={{ width: `${message.confidence}%` }}
                          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ) : null}
                </article>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
