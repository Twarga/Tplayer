import React from 'react'
import { Slider } from '@/components/ui/slider'
import { usePlayerStore } from '@/stores/playerStore'
import { formatDuration } from '@/lib/utils'

interface SeekBarProps {
  className?: string
}

export function SeekBar({ className }: SeekBarProps) {
  const { currentTime, duration, seek } = usePlayerStore()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <div className="w-full h-1 bg-progress-bg rounded-full cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          seek(ratio * duration)
        }}
      >
        <div
          className="h-full bg-accent rounded-full relative transition-all"
          style={{ width: `${progress}%` }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(232,168,124,0.5)]" />
        </div>
      </div>
      <div className="flex justify-between text-[11px] text-tertiary">
        <span>{formatDuration(currentTime)}</span>
        <span>-{formatDuration(duration - currentTime)}</span>
      </div>
    </div>
  )
}