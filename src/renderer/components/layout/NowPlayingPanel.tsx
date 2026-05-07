import React, { useState } from 'react'
import { Heart, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { Slider } from '@/components/ui/slider'
import { formatDuration } from '@/lib/utils'

interface NowPlayingPanelProps {
  collapsed?: boolean
}

export function NowPlayingPanel({ collapsed = false }: NowPlayingPanelProps) {
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
    seek,
  } = usePlayerStore()

  if (collapsed) return null

  return (
    <aside className="w-[320px] min-w-[280px] h-full bg-surface-1 border-l border-border-subtle p-6 flex flex-col">
      <div className="flex gap-6 border-b border-border-subtle pb-3 mb-5">
        {(['playing', 'lyrics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium pb-3 relative capitalize ${
              activeTab === tab ? 'text-primary' : 'text-tertiary hover:text-secondary'
            }`}
          >
            {tab === 'playing' ? 'Now Playing' : tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
        ))}
      </div>

      <div className="w-full aspect-square rounded-lg overflow-hidden shadow-xl mb-5 bg-surface-2">
        {currentTrack ? (
          <div className="w-full h-full bg-gradient-to-br from-surface-3 to-surface-2 flex items-center justify-center text-tertiary">
            <span className="text-4xl font-bold">{currentTrack.title[0]}</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-3 to-surface-2 flex items-center justify-center text-tertiary">
            No track
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-primary truncate">
            {currentTrack?.title || 'No track'}
          </h3>
          <p className="text-sm text-secondary truncate">
            {currentTrack?.artist || 'Unknown artist'}
          </p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center text-tertiary hover:text-accent transition-colors">
          <Heart size={18} />
        </button>
      </div>

      <div className="mb-4">
        <div className="w-full h-1 bg-progress-bg rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = (e.clientX - rect.left) / rect.width
            seek(ratio * duration)
          }}
        >
          <div
            className="h-full bg-accent rounded-full relative transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(232,168,124,0.5)]" />
          </div>
        </div>
        <div className="flex justify-between text-[11px] text-tertiary mt-1">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 my-4">
        <button
          onClick={() => {}}
          className={`w-5 h-5 ${isShuffled ? 'text-accent' : 'text-tertiary'} hover:text-primary transition-colors`}
        >
          <Shuffle size={18} />
        </button>

        <button onClick={prev} className="w-6 h-6 text-primary hover:scale-110 transition-transform">
          <SkipBack size={22} />
        </button>

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

        <button onClick={next} className="w-6 h-6 text-primary hover:scale-110 transition-transform">
          <SkipForward size={22} />
        </button>

        <button
          onClick={() => {}}
          className={`w-5 h-5 ${repeatMode !== 'off' ? 'text-accent' : 'text-tertiary'} hover:text-primary transition-colors`}
        >
          {repeatMode === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {['FLAC', '24-bit', '44.1 kHz', 'Lossless'].map((badge) => (
          <span key={badge} className="px-2.5 py-1 text-[11px] font-semibold uppercase bg-surface-2 border border-border-default rounded-sm text-secondary">
            {badge}
          </span>
        ))}
      </div>

      <div className="border-t border-border-subtle pt-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-primary">Queue</span>
          <button className="text-xs text-tertiary hover:text-primary transition-colors">Clear</button>
        </div>
        <div className="text-center text-tertiary text-sm py-8">
          Queue is empty
        </div>
      </div>
    </aside>
  )
}