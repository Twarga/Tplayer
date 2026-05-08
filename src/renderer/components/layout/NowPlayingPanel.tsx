import { Heart, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Play, Pause, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <motion.aside
        animate={collapsed ? 'closed' : 'open'}
        variants={panelMotion}
        className={cn(
          'h-full rounded-[32px] bg-[linear-gradient(180deg,rgba(14,16,19,0.98),rgba(11,12,14,0.92))] border border-white/[0.08] flex flex-col shrink-0 overflow-hidden surface-panel shadow-card',
          collapsed ? 'w-0 pointer-events-none' : 'w-[336px]'
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tertiary">Playback Detail</span>
            <span className="text-sm font-medium text-primary">Now Playing</span>
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
            className="flex-1 overflow-y-auto px-5 py-5 flex flex-col bg-[radial-gradient(circle_at_top,rgba(232,168,124,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)]"
          >
            <motion.div variants={staggerItem} className="w-full aspect-square rounded-[1.65rem] overflow-hidden shadow-2xl mb-5 bg-surface-2 flex items-center justify-center relative border border-white/[0.07]">
              {currentTrack?.cover_path && (
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-xl opacity-40 transform scale-110" 
                  style={{ backgroundImage: `url('tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}')` }}
                />
              )}
              {currentTrack?.cover_path ? (
                <img 
                  src={`tplayer-img://media/${encodeURIComponent(currentTrack.cover_path)}`} 
                  alt="Album Art" 
                  className="w-full h-full object-cover relative z-10 rounded-[1.65rem]"
                />
              ) : currentTrack ? (
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-surface-2 flex items-center justify-center text-accent text-6xl font-bold relative z-10 rounded-[1.65rem]">
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
