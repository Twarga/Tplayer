import { useState } from 'react'
import { Heart, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Play, Pause, X } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { cn, formatDuration } from '@/lib/utils'

interface NowPlayingPanelProps {
  collapsed: boolean
  onToggle: () => void
}

export function NowPlayingPanel({ collapsed, onToggle }: NowPlayingPanelProps) {
  const [activeTab, setActiveTab] = useState<'playing' | 'lyrics'>('playing')
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
            <button
              onClick={() => setActiveTab('playing')}
              className={cn(
                "text-sm font-medium pb-2 border-b-2 transition-colors",
                activeTab === 'playing'
                  ? "text-primary border-accent"
                  : "text-tertiary border-transparent hover:text-secondary"
              )}
            >
              Now Playing
            </button>
            <button
              onClick={() => setActiveTab('lyrics')}
              className={cn(
                "text-sm font-medium pb-2 border-b-2 transition-colors",
                activeTab === 'lyrics'
                  ? "text-primary border-accent"
                  : "text-tertiary border-transparent hover:text-secondary"
              )}
            >
              Lyrics
            </button>
          </div>
          <button
            onClick={onToggle}
            className="text-tertiary hover:text-primary transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {activeTab === 'playing' && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col">
            {/* Album Art */}
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl mb-5 bg-surface-2 flex items-center justify-center">
              {currentTrack ? (
                <div className="w-full h-full bg-gradient-to-br from-accent/20 to-surface-2 flex items-center justify-center text-accent text-6xl font-bold">
                  {currentTrack.title?.[0] || '♪'}
                </div>
              ) : (
                <span className="text-tertiary text-4xl">♪</span>
              )}
            </div>

            {/* Track Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="text-base font-semibold text-primary truncate">
                  {currentTrack?.title || 'Not Playing'}
                </h3>
                <p className="text-sm text-secondary truncate">
                  {currentTrack?.artist || 'Select a track'}
                </p>
              </div>
              <button className="text-tertiary hover:text-accent transition-colors p-1">
                <Heart size={20} />
              </button>
            </div>

            {/* Progress */}
            <div className="mb-2">
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
            <div className="flex items-center justify-center gap-5 my-4">
              <button
                onClick={toggleShuffle}
                className={cn("transition-colors", isShuffled ? "text-accent" : "text-tertiary hover:text-primary")}
              >
                <Shuffle size={18} />
              </button>

              <button onClick={prev} className="text-primary hover:text-accent transition-colors">
                <SkipBack size={24} />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-accent-glow"
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>

              <button onClick={next} className="text-primary hover:text-accent transition-colors">
                <SkipForward size={24} />
              </button>

              <button
                onClick={toggleRepeat}
                className={cn("transition-colors", repeatMode !== 'off' ? "text-accent" : "text-tertiary hover:text-primary")}
              >
                {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            {/* Quality Badges */}
            {currentTrack && (
              <div className="flex gap-2 flex-wrap justify-center mb-6">
                <span className="px-2.5 py-1 text-[11px] font-semibold uppercase bg-surface-2 border border-border-default rounded-sm text-secondary">
                  MP3
                </span>
                <span className="px-2.5 py-1 text-[11px] font-semibold uppercase bg-surface-2 border border-border-default rounded-sm text-secondary">
                  320kbps
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="flex-1 flex items-center justify-center text-tertiary text-sm">
            Lyrics not available
          </div>
        )}
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