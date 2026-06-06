import { useEffect, useRef } from 'react'

export function useFloatingChat(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [isOpen])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!isOpen || !containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen, onClose])

  return { containerRef, messagesEndRef }
}
