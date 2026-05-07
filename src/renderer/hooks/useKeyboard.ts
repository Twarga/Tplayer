import { useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'

export function useKeyboardShortcuts() {
  const { togglePlay, next, prev } = usePlayerStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          if (e.ctrlKey) {
            e.preventDefault()
            prev()
          } else {
            e.preventDefault()
            usePlayerStore.getState().seek(Math.max(0, usePlayerStore.getState().currentTime - 5))
          }
          break
        case 'ArrowRight':
          if (e.ctrlKey) {
            e.preventDefault()
            next()
          } else {
            e.preventDefault()
            const { currentTime, duration } = usePlayerStore.getState()
            usePlayerStore.getState().seek(Math.min(duration, currentTime + 5))
          }
          break
        case 'KeyL':
          if (e.ctrlKey) {
            e.preventDefault()
            // Focus library view
          }
          break
        case 'KeyF':
          if (e.ctrlKey) {
            e.preventDefault()
            document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, next, prev])
}