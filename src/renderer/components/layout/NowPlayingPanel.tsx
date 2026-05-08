import { Heart, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Play, Pause, X } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { QualityBadges } from '@/components/player/QualityBadges'
import { cn, formatDuration } from '@/lib/utils'

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
      {/* Desktop Panel */}
      <aside
        className={cn(
          "h-full bg-surface-1 border-l border-border-subtle flex flex-col shrink-0 transition-all duration-300 ease-out overflow-hidden",
          collapsed ? "w-0 opacity-0" : "w-[320px] opacity-100"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex gap-6">
            <span className="text-sm font-medium pb-2 text-primary">
              Now Playing
            </span>
          </div>
          <button
            onClick={onToggle}
            className="text-tertiary hover:text-primary transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col">
            {/* Album Art */}
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl mb-5 bg-surface-2 flex items-center justify-center relative animate-scale-in">
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
                  className="w-full h-full object-cover relative z-10 rounded-xl"
                />
              ) : currentTrack ? (
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-surface-2 flex items-center justify-center text-accent text-6xl font-bold relative z-10 rounded-xl">
                  {currentTrack.title?.[0] || '♪'}
                </div>
              ) : (
                <span className="text-tertiary text-4xl relative z-10">♪</span>
              )}
            </div>

            {/* Track Info */}
            <div className="flex items-start justify-between mb-4 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="text-base font-semibold text-primary truncate">
                  {currentTrack?.title || 'Not Playing'}
                </h3>
                <p className="text-sm text-secondary truncate">
                  {currentTrack?.artist || 'Select a track'}
                </p>
              </div>
              <button 
                className={cn("transition-all p-1 active:scale-90 hover:scale-110", currentTrack && isFavorite(currentTrack.id) ? "text-accent" : "text-tertiary hover:text-accent")}
                onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
              >
                <Heart size={20} fill={currentTrack && isFavorite(currentTrack.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Progress */}
            <div className="mb-2 animate-fade-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
              <div
                className="w-full h-1 bg-progress-bg rounded-full cursor-pointer group relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const ratio = (e.clientX - rect.left) / rect.width
                  seek(ratio * duration)
                }}
              >
                <div
                  className="h-full bg-accent rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-progress-thumb" />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-tertiary mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-5 my-4 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <button
                onClick={toggleShuffle}
                className={cn("transition-all hover:scale-110 active:scale-90", isShuffled ? "text-accent" : "text-tertiary hover:text-primary")}
              >
                <Shuffle size={18} />
              </button>

              <button onClick={prev} className="text-primary hover:text-accent transition-all hover:scale-110 active:scale-90">
                <SkipBack size={24} />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-accent-glow"
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={next} className="text-primary hover:text-accent transition-all hover:scale-110 active:scale-90">
                <SkipForward size={24} />
              </button>

              <button
                onClick={toggleRepeat}
                className={cn("transition-all hover:scale-110 active:scale-90", repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary")}
              >
                {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            {/* Quality Badges */}
            {currentTrack && (
              <div className="flex justify-center mb-6">
                <QualityBadges
                  format={currentTrack.file_format || undefined}
                  bitrate={currentTrack.bitrate}
                  sampleRate={currentTrack.sample_rate}
                  bitDepth={currentTrack.bit_depth}
                />
              </div>
            )}
          </div>
      </aside>

      {/* Mobile overlay toggle */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  )
}
