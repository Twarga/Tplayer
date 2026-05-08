import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { formatDuration } from '@/lib/utils'
import { animations } from '@/lib/animations'

interface SeekBarProps {
  className?: string
}

export function SeekBar({ className }: SeekBarProps) {
  const { currentTime, duration, seek } = usePlayerStore()
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const progress = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0
  const canSeek = duration > 0 && Number.isFinite(duration)
  const remaining = Math.max(0, duration - currentTime)

  const seekFromPointer = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track || !canSeek) return

    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    void seek(ratio * duration)
  }, [canSeek, duration, seek])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canSeek) return
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromPointer(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    seekFromPointer(event.clientX)
  }

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canSeek) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      void seek(Math.max(0, currentTime - 5))
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      void seek(Math.min(duration, currentTime + 5))
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={Math.max(duration, 0)}
        aria-valuenow={Math.min(currentTime, duration || currentTime)}
        aria-disabled={!canSeek}
        tabIndex={canSeek ? 0 : -1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
        className={`group w-full h-5 flex items-center ${canSeek ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
      >
        <div className="relative h-[3px] w-full bg-white/16">
          <div
            className={`absolute left-0 top-0 h-full bg-accent ${animations.progressFill}`}
            style={{ width: `${progress}%` }}
          />
          <div
            className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-accent transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[11px] text-tertiary mt-1">
        <span>{formatDuration(currentTime)}</span>
        <span>-{formatDuration(remaining)}</span>
      </div>
    </div>
  )
}
