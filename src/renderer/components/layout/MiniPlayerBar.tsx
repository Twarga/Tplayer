import { useState, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, Heart, ListMusic } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { cn } from '@/lib/utils'

export function MiniPlayerBar() {
  const { currentTrack, isPlaying, volume, isShuffled, repeatMode, togglePlay, next, prev, toggleShuffle, toggleRepeat, setVolume } = usePlayerStore()
  const { queue } = useQueueStore()
  const [showVolume, setShowVolume] = useState(false)
  const [prevVolume, setPrevVolume] = useState(0.8)

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  const handleVolumeClick = () => {
    if (volume > 0) {
      setPrevVolume(volume)
      setVolume(0)
    } else {
      setVolume(prevVolume || 0.8)
    }
  }

  return (
    <div className="h-16 w-full bg-player-bar-bg border-t border-border-subtle px-4 flex items-center shrink-0 z-20">
      {/* Left - Track Info */}
      <div className="w-[30%] flex items-center gap-3 min-w-0">
        {currentTrack ? (
          <>
            <div className="w-12 h-12 rounded bg-surface-2 flex items-center justify-center text-accent font-bold text-lg shrink-0">
              {currentTrack.title?.[0] || '♪'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-primary truncate">{currentTrack.title}</p>
              <p className="text-[12px] text-secondary truncate">{currentTrack.artist}</p>
            </div>
            <button className="text-tertiary hover:text-accent transition-colors shrink-0">
              <Heart size={16} />
            </button>
          </>
        ) : (
          <span className="text-tertiary text-sm">No track playing</span>
        )}
      </div>

      {/* Center - Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150",
              isShuffled ? "text-accent" : "text-tertiary hover:text-primary"
            )}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={prev}
            className="w-8 h-8 flex items-center justify-center text-primary hover:text-accent transition-colors"
            title="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-accent-glow"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={next}
            className="w-8 h-8 flex items-center justify-center text-primary hover:text-accent transition-colors"
            title="Next"
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={toggleRepeat}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150",
              repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary"
            )}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>
      </div>

      {/* Right - Volume + Queue */}
      <div className="w-[30%] flex items-center justify-end gap-3">
        <button
          onClick={() => {}}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
            queue.length > 0 ? "text-accent" : "text-tertiary hover:text-primary"
          )}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        <div className="flex items-center gap-2 relative"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button
            onClick={handleVolumeClick}
            className="text-tertiary hover:text-primary transition-colors"
          >
            <VolumeIcon size={18} />
          </button>

          <div className={cn(
            "w-0 overflow-hidden transition-all duration-200",
            showVolume && "w-24"
          )}>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full h-1 bg-progress-bg rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}