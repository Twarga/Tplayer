import React, { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'

interface AudioVisualizerProps {
  className?: string
}

export function AudioVisualizer({ className = '' }: AudioVisualizerProps) {
  const { isPlaying } = usePlayerStore()
  const barsRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!barsRef.current) return

    const bars = barsRef.current.children

    const animate = () => {
      Array.from(bars).forEach((bar) => {
        const height = isPlaying ? Math.random() * 16 + 4 : 4
        ;(bar as HTMLElement).style.height = `${height}px`
        ;(bar as HTMLElement).style.opacity = isPlaying ? `${0.3 + Math.random() * 0.7}` : '0.3'
      })
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  return (
    <div ref={barsRef} className={`flex items-center justify-center gap-[2px] ${className}`}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full bg-accent"
          style={{
            height: '4px',
            opacity: 0.3,
            transition: 'height 150ms ease',
          }}
        />
      ))}
    </div>
  )
}