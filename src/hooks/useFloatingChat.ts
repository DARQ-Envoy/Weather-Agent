import { useEffect, useRef } from 'react'

export function useFloatingChat(isOpen: boolean, scrollKey: string, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [isOpen, scrollKey])

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
