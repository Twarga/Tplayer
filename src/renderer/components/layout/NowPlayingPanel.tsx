import { Heart, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Play, Pause, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { useQueueStore } from '@/stores/queueStore'
import { QualityBadges } from '@/components/player/QualityBadges'
import { cn, formatDuration } from '@/lib/utils'
import { animations, panelMotion, staggerItem, staggerParent } from '@/lib/animations'

interface NowPlayingPanelProps {
  collapsed: boolean
  onToggle: () => void
}

export function NowPlayingPanel({ collapsed, onToggle }: NowPlayingPanelProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isShuffled,
    repeatMode,
    togglePlay,
    next,
    prev,
    toggleShuffle,
    toggleRepeat,
    seek,
  } = usePlayerStore()
  const { toggleFavorite, isFavorite } = useLibraryStore()
  const { queue, clear } = useQueueStore()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <motion.aside
        animate={collapsed ? 'closed' : 'open'}
        variants={panelMotion}
        className={cn(
          'h-full border-l border-white/[0.075] bg-[linear-gradient(180deg,rgba(13,14,16,0.34),rgba(9,10,12,0.28))] flex flex-col shrink-0 overflow-hidden',
          collapsed ? 'w-0 pointer-events-none' : 'w-[336px]'
        )}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-7 border-b border-white/[0.06] pb-2">
            <span className="text-sm font-semibold text-accent">Now Playing</span>
            <span className="text-sm text-tertiary">Lyrics</span>
          </div>
          <button
            onClick={onToggle}
            className={cn('text-tertiary hover:text-primary p-1', animations.controlButton)}
          >
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentTrack?.id ?? 'empty'}
            variants={staggerParent}
            initial="hidden"
            animate="show"
            className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col"
          >
            <motion.div variants={staggerItem} className="w-full aspect-square rounded-[7px] overflow-hidden mb-4 bg-black/30 flex items-center justify-center relative">
              {currentTrack?.cover_path && (
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-xl opacity-20 transform scale-110" 
                  style={{ backgroundImage: `url('tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}')` }}
                />
              )}
              {currentTrack?.cover_path ? (
                <img 
                  src={`tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}`} 
                  alt="Album Art" 
                  className="w-full h-full object-cover relative z-10"
                />
              ) : currentTrack ? (
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-white/[0.03] flex items-center justify-center text-accent text-6xl font-bold relative z-10">
                  {currentTrack.title?.[0] || '♪'}
                </div>
              ) : (
                <span className="text-tertiary text-4xl relative z-10">♪</span>
              )}
            </motion.div>

            <motion.div variants={staggerItem} className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="font-display text-[1.1rem] font-bold text-primary truncate">
                  {currentTrack?.title || 'Not Playing'}
                </h3>
                <p className="text-sm text-secondary truncate mt-1">
                  {currentTrack?.artist || 'Select a track'}
                </p>
              </div>
              <button 
                className={cn('p-1', animations.controlButton, currentTrack && isFavorite(currentTrack.id) ? 'text-accent' : 'text-tertiary hover:text-accent')}
                onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
              >
                <Heart size={20} fill={currentTrack && isFavorite(currentTrack.id) ? "currentColor" : "none"} />
              </button>
            </motion.div>

            <motion.div variants={staggerItem} className="mb-3">
              <div
                className="w-full h-1.5 bg-progress-bg rounded-full cursor-pointer group relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ratio = (e.clientX - rect.left) / rect.width
                  seek(ratio * duration)
                }}
              >
                <div
                  className={cn('h-full bg-accent rounded-full relative', animations.progressFill)}
                  style={{ width: `${progress}%` }}
                >
                  <span className={cn('absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 shadow-progress-thumb', animations.progressThumb)} />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-tertiary mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="flex items-center justify-center gap-5 my-5">
              <button
                onClick={toggleShuffle}
                className={cn(animations.controlButton, isShuffled ? "text-accent" : "text-tertiary hover:text-primary")}
              >
                <Shuffle size={18} />
              </button>

              <button onClick={prev} className={cn('text-primary hover:text-accent', animations.controlButton)}>
                <SkipBack size={24} />
              </button>

              <button
                onClick={togglePlay}
                className={cn('w-[3.75rem] h-[3.75rem] rounded-full bg-accent text-background flex items-center justify-center shadow-accent-glow', animations.controlButton)}
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={next} className={cn('text-primary hover:text-accent', animations.controlButton)}>
                <SkipForward size={24} />
              </button>

              <button
                onClick={toggleRepeat}
                className={cn(animations.controlButton, repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary")}
              >
                {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </motion.div>

            {currentTrack && (
              <motion.div variants={staggerItem} className="flex justify-center mb-6 pt-2">
                <QualityBadges
                  format={currentTrack.file_format || undefined}
                  bitrate={currentTrack.bitrate}
                  sampleRate={currentTrack.sample_rate}
                  bitDepth={currentTrack.bit_depth}
                />
              </motion.div>
            )}

            <motion.div variants={staggerItem} className="mt-1">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary">Queue</h3>
                <button
                  onClick={clear}
                  className="text-xs text-tertiary hover:text-primary transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {queue.slice(0, 5).map((item, index) => (
                  <div key={`${item.id}-${index}`} className="grid grid-cols-[32px_minmax(0,1fr)_42px] items-center gap-3 py-1">
                    <div className="grid h-8 w-8 place-items-center bg-white/[0.045] text-[11px] text-accent">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">{item.title}</p>
                      <p className="truncate text-xs text-secondary">{item.artist}</p>
                    </div>
                    <span className="text-right text-xs text-tertiary">{formatDuration(item.duration)}</span>
                  </div>
                ))}
                {queue.length === 0 && (
                  <p className="py-3 text-sm text-tertiary">Queue is empty.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.aside>

      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  )
}
