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
      <div className="w-full relative group">
        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 100}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1 bg-progress-bg rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity relative z-10"
        />
        <div 
          className="absolute left-0 top-0 h-1 bg-accent rounded-full pointer-events-none transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-tertiary mt-1">
        <span>{formatDuration(currentTime)}</span>
        <span>-{formatDuration(duration - currentTime)}</span>
      </div>
    </div>
  )
}
