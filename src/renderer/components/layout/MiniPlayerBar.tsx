import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, Heart, ListMusic } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { useToast } from '@/stores/toastStore'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { SeekBar } from '@/components/player/SeekBar'
import { cn } from '@/lib/utils'

export function MiniPlayerBar({ onQueueClick }: { onQueueClick?: () => void }) {
  const { currentTrack, isPlaying, volume, isShuffled, repeatMode, togglePlay, next, prev, toggleShuffle, toggleRepeat, setVolume } = usePlayerStore()
  const { queue } = useQueueStore()
  const { toggleFavorite } = useLibraryStore()
  const [showVolume, setShowVolume] = useState(false)
  const [isDraggingVolume, setIsDraggingVolume] = useState(false)
  const volumeRef = useRef<HTMLDivElement>(null)
  const [prevVolume, setPrevVolume] = useState(0.8)
  const { add: addToast } = useToast()

  // Find the current track's favorite status from the library store, or default to the currentTrack's static state
  // If the library isn't loaded yet or we play from outside, fallback to currentTrack.is_favorite
  const tracks = useLibraryStore(s => s.tracks)
  const isFav = currentTrack ? (tracks.find(t => t.id === currentTrack.id)?.is_favorite ?? currentTrack.is_favorite === 1) : false

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  const handleVolumeClick = () => {
    if (volume > 0) {
      setPrevVolume(volume)
      setVolume(0)
    } else {
      setVolume(prevVolume || 0.8)
    }
  }

  const handleToggleFavorite = async () => {
    if (!currentTrack) return
    await toggleFavorite(currentTrack.id)
    addToast(!isFav ? 'Added to favorites' : 'Removed from favorites', 'success')
  }

  useEffect(() => {
    const handlePointerUp = (e: PointerEvent) => {
      setIsDraggingVolume(false)
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setShowVolume(false)
      }
    }
    if (isDraggingVolume) {
      window.addEventListener('pointerup', handlePointerUp)
    }
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [isDraggingVolume])

  return (
    <div className="h-16 w-full bg-player-bar-bg border-t border-border-subtle px-4 flex items-center shrink-0 z-20">
      {/* Left - Track Info */}
      <div className="w-[30%] flex items-center gap-3 min-w-0">
        {currentTrack ? (
          <>
            {currentTrack.cover_path ? (
              <img 
                src={`tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}`} 
                alt="Album Art" 
                className="w-12 h-12 rounded object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-surface-2 flex items-center justify-center text-accent font-bold text-lg shrink-0">
                {currentTrack.title?.[0] || '♪'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-primary truncate">{currentTrack.title}</p>
              <p className="text-[12px] text-secondary truncate">{currentTrack.artist}</p>
            </div>
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "transition-colors shrink-0",
                isFav ? "text-accent" : "text-tertiary hover:text-accent"
              )}
            >
              <Heart size={16} fill={isFav ? "currentColor" : "none"} />
            </button>
          </>
        ) : (
          <span className="text-tertiary text-sm">No track playing</span>
        )}
      </div>

      {/* Center - Controls */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleShuffle}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90 duration-150",
                  isShuffled ? "text-accent" : "text-tertiary hover:text-primary"
                )}
              >
                <Shuffle size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Shuffle</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={prev}
                className="w-8 h-8 flex items-center justify-center text-primary hover:text-accent transition-all hover:scale-110 active:scale-90"
              >
                <SkipBack size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Previous (Ctrl + ←)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-accent-glow"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={next}
                className="w-8 h-8 flex items-center justify-center text-primary hover:text-accent transition-all hover:scale-110 active:scale-90"
              >
                <SkipForward size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Next (Ctrl + →)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleRepeat}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90 duration-150",
                  repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary"
                )}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Repeat: {repeatMode}</TooltipContent>
          </Tooltip>
        </div>
        <div className="w-full max-w-md mt-1">
          <SeekBar />
        </div>
      </div>

      {/* Right - Volume + Queue */}
      <div className="w-[30%] flex items-center justify-end gap-3">
        <button
          onClick={onQueueClick}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90",
            queue.length > 0 ? "text-accent" : "text-tertiary hover:text-primary"
          )}
          title="Queue"
        >
          <ListMusic size={18} />
        </button>

        <div 
          ref={volumeRef}
          className="flex items-center gap-2 relative h-full"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => {
            if (!isDraggingVolume) setShowVolume(false)
          }}
        >
          <button
            onClick={handleVolumeClick}
            className="text-tertiary hover:text-primary transition-all hover:scale-110 active:scale-90"
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
              onMouseDown={() => setIsDraggingVolume(true)}
              onMouseUp={() => {
                setIsDraggingVolume(false)
                // Need to re-evaluate mouse leave here in case mouse left while dragging
              }}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full h-1 bg-progress-bg rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
