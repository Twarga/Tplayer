import React from 'react'
import { Shuffle, SkipBack, SkipForward, Repeat, Repeat1 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface PlayerControlsProps {
  className?: string
}

export function PlayerControls({ className }: PlayerControlsProps) {
  const { isPlaying, isShuffled, repeatMode, togglePlay, next, prev, toggleShuffle, toggleRepeat } = usePlayerStore()

  return (
    <div className={`flex items-center justify-center gap-4 ${className || ''}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleShuffle}
            className={`w-5 h-5 transition-colors ${isShuffled ? 'text-accent' : 'text-tertiary'} hover:text-primary`}
          >
            <Shuffle size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Shuffle</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={prev} className="w-6 h-6 text-primary hover:scale-110 transition-transform">
            <SkipBack size={22} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Previous</TooltipContent>
      </Tooltip>

      <button
        onClick={togglePlay}
        className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center shadow-[0_4px_16px_rgba(232,168,124,0.3)] hover:scale-105 active:scale-95 transition-all"
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={next} className="w-6 h-6 text-primary hover:scale-110 transition-transform">
            <SkipForward size={22} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Next</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleRepeat}
            className={`w-5 h-5 transition-colors ${repeatMode !== 'off' ? 'text-accent' : 'text-tertiary'} hover:text-primary`}
          >
            {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          </button>
        </TooltipTrigger>
        <TooltipContent>Repeat: {repeatMode}</TooltipContent>
      </Tooltip>
    </div>
  )
}