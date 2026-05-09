import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, Heart, ListMusic } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { useToast } from '@/stores/toastStore'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { SeekBar } from '@/components/player/SeekBar'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { animations, staggerParent } from '@/lib/animations'

export function MiniPlayerBar({ onQueueClick }: { onQueueClick?: () => void }) {
  const { currentTrack, isPlaying, volume, isShuffled, repeatMode, play, togglePlay, next, prev, toggleShuffle, toggleRepeat, setVolume } = usePlayerStore()
  const { queue } = useQueueStore()
  const { toggleFavorite } = useLibraryStore()
  const { add: addToast } = useToast()

  // Find the current track's favorite status from the library store, or default to the currentTrack's static state
  // If the library isn't loaded yet or we play from outside, fallback to currentTrack.is_favorite
  const tracks = useLibraryStore(s => s.tracks)
  const isFav = currentTrack ? (tracks.find(t => t.id === currentTrack.id)?.is_favorite ?? currentTrack.is_favorite === 1) : false

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  const handleVolumeClick = () => {
    if (volume > 0) {
      setVolume(0)
    } else {
      setVolume(0.8)
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

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="h-[104px] w-full bg-[#0d0d0f]/96 border-t border-white/[0.08] px-5 py-3 shrink-0 z-20"
    >
      <div className="grid h-full grid-rows-[1fr_auto] gap-2">
        <div className="grid grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)] items-center gap-5">
          <div className="flex items-center gap-3 min-w-0">
            {currentTrack ? (
              <>
              {currentTrack.cover_path ? (
                <img 
                  src={`tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}`} 
                  alt="Album Art" 
                  className="w-12 h-12 object-cover shrink-0 rounded-md"
                />
              ) : (
                <div className="w-12 h-12 bg-white/[0.04] flex items-center justify-center text-accent font-bold text-lg shrink-0 rounded-md">
                  {currentTrack.title?.[0] || '♪'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-primary truncate">{currentTrack.title}</p>
                <p className="text-[12px] text-secondary truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "shrink-0 h-9 w-9 flex items-center justify-center",
                  animations.controlButton,
                  isFav ? "text-accent" : "text-tertiary hover:text-accent"
                )}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={16} fill={isFav ? "currentColor" : "none"} />
              </button>
              </>
            ) : (
              <span className="text-tertiary text-sm">No track playing</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleShuffle}
                className={cn(
                  "w-9 h-9 flex items-center justify-center",
                  animations.controlButton,
                  isShuffled ? "text-accent" : "text-tertiary hover:text-primary"
                )}
                title="Shuffle"
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
                className={cn("w-10 h-10 flex items-center justify-center text-primary hover:text-accent disabled:opacity-35 disabled:hover:text-primary disabled:cursor-not-allowed", animations.controlButton)}
                title="Previous"
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
                className={cn("w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center shadow-accent-glow disabled:opacity-40 disabled:cursor-not-allowed", animations.controlButton)}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={next}
                disabled={!currentTrack && queue.length === 0}
                className={cn("w-10 h-10 flex items-center justify-center text-primary hover:text-accent disabled:opacity-35 disabled:hover:text-primary disabled:cursor-not-allowed", animations.controlButton)}
                title="Next"
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
                  "w-9 h-9 flex items-center justify-center",
                  animations.controlButton,
                  repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary"
                )}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Repeat: {repeatMode}</TooltipContent>
          </Tooltip>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onQueueClick}
              className={cn(
                "w-9 h-9 flex items-center justify-center",
                animations.controlButton,
                queue.length > 0 ? "text-accent" : "text-tertiary hover:text-primary"
              )}
              title="Queue"
            >
              <ListMusic size={18} />
            </button>

            <button
              onClick={handleVolumeClick}
              className={cn("w-9 h-9 flex items-center justify-center text-tertiary hover:text-primary", animations.controlButton)}
              title={volume > 0 ? 'Mute' : 'Unmute'}
            >
              <VolumeIcon size={18} />
            </button>

            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(volume * 100)]}
              onValueChange={([v]) => setVolume(v / 100)}
              className="w-24"
              aria-label="Volume"
            />
          </div>
        </div>

        <SeekBar className="mx-auto w-full max-w-[48rem]" />
      </div>
    </motion.div>
  )
}
