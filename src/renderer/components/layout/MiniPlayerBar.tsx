import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, Heart, ListMusic } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { useToast } from '@/stores/toastStore'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { SeekBar } from '@/components/player/SeekBar'
import { cn } from '@/lib/utils'
import { animations, staggerItem, staggerParent } from '@/lib/animations'

export function MiniPlayerBar({ onQueueClick }: { onQueueClick?: () => void }) {
  const { currentTrack, isPlaying, volume, isShuffled, repeatMode, play, togglePlay, next, prev, toggleShuffle, toggleRepeat, setVolume } = usePlayerStore()
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

  const handlePrimaryPlay = async () => {
    if (currentTrack) {
      await togglePlay()
      return
    }

    const firstQueuedTrack = queue[0]
    if (firstQueuedTrack) {
      await play(firstQueuedTrack.id)
    }
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
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="h-[86px] w-full bg-[linear-gradient(180deg,rgba(18,18,19,0.94),rgba(11,11,12,0.96))] border-t border-white/[0.09] px-5 flex items-center shrink-0 z-20"
    >
      <div className="w-[30%] flex items-center gap-3 min-w-0">
        {currentTrack ? (
          <>
            <motion.div variants={staggerItem} className="shrink-0">
              {currentTrack.cover_path ? (
                <img 
                  src={`tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}`} 
                  alt="Album Art" 
                  className="w-[3.25rem] h-[3.25rem] rounded-[5px] object-cover shrink-0"
                />
              ) : (
                <div className="w-[3.25rem] h-[3.25rem] rounded-[5px] bg-white/[0.04] flex items-center justify-center text-accent font-bold text-lg shrink-0">
                  {currentTrack.title?.[0] || '♪'}
                </div>
              )}
            </motion.div>
            <motion.div variants={staggerItem} className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-primary truncate">{currentTrack.title}</p>
              <p className="text-[12px] text-secondary truncate">{currentTrack.artist}</p>
            </motion.div>
            <motion.div variants={staggerItem}>
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "shrink-0",
                  animations.controlButton,
                  isFav ? "text-accent" : "text-tertiary hover:text-accent"
                )}
              >
                <Heart size={16} fill={isFav ? "currentColor" : "none"} />
              </button>
            </motion.div>
          </>
        ) : (
          <span className="text-tertiary text-sm">No track playing</span>
        )}
      </div>

      <motion.div variants={staggerItem} className="flex-1 flex flex-col items-center gap-1.5 px-5">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleShuffle}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full",
                  animations.controlButton,
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
                disabled={!currentTrack}
                className={cn("w-8 h-8 flex items-center justify-center text-primary hover:text-accent disabled:opacity-35 disabled:hover:text-primary disabled:cursor-not-allowed", animations.controlButton)}
              >
                <SkipBack size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Previous (Ctrl + ←)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handlePrimaryPlay}
                disabled={!currentTrack && queue.length === 0}
                className={cn("w-11 h-11 rounded-full bg-accent text-background flex items-center justify-center shadow-accent-glow disabled:opacity-40 disabled:cursor-not-allowed", animations.controlButton)}
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
                disabled={!currentTrack && queue.length === 0}
                className={cn("w-8 h-8 flex items-center justify-center text-primary hover:text-accent disabled:opacity-35 disabled:hover:text-primary disabled:cursor-not-allowed", animations.controlButton)}
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
                  "w-8 h-8 flex items-center justify-center rounded-full",
                  animations.controlButton,
                  repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary"
                )}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Repeat: {repeatMode}</TooltipContent>
          </Tooltip>
        </div>
        <div className="w-full max-w-[29rem] mt-1">
          <SeekBar />
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="w-[30%] flex items-center justify-end gap-3">
        <div className="hidden h-7 w-40 items-end gap-[2px] md:flex" aria-hidden="true">
          {Array.from({ length: 36 }).map((_, index) => (
            <span
              key={index}
              className="w-[2px] bg-accent/65"
              style={{ height: `${6 + ((index * 7) % 21)}px` }}
            />
          ))}
        </div>
        <button
          onClick={onQueueClick}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full",
            animations.controlButton,
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
            className={cn("text-tertiary hover:text-primary", animations.controlButton)}
          >
            <VolumeIcon size={18} />
          </button>

          <AnimatePresence initial={false}>
            {showVolume && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 96, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn("overflow-hidden")}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(volume * 100)}
                  onMouseDown={() => setIsDraggingVolume(true)}
                  onMouseUp={() => {
                    setIsDraggingVolume(false)
                  }}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  className="w-full h-1 bg-progress-bg rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
