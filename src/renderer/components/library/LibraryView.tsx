import { useEffect, useState } from 'react'
import { RefreshCw, Play, Heart } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'

interface LibraryViewProps {
  onPlayTrack: (id: number) => void
}

export function LibraryView({ onPlayTrack }: LibraryViewProps) {
  const { tracks, isLoading, error, loadTracks, toggleFavorite } = useLibraryStore()
  const { currentTrack, isPlaying } = usePlayerStore()

  useEffect(() => {
    loadTracks()
  }, [])

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Library</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => loadTracks()} title="Refresh">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-1 rounded-md animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-lg text-red-400 mb-2">Error loading library</p>
          <p className="text-sm text-secondary">{error}</p>
          <Button onClick={() => loadTracks()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-secondary mb-2">No music found</p>
          <p className="text-sm text-tertiary mb-6">Add a music folder in Settings to get started</p>
          <Button onClick={() => {}} variant="outline">
            Go to Settings
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[48px_1fr_1fr_80px_48px] gap-3 px-4 text-[11px] font-semibold uppercase text-tertiary mb-2">
            <span>#</span>
            <span>Title</span>
            <span>Album</span>
            <span className="text-right">Duration</span>
            <span></span>
          </div>

          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="grid grid-cols-[48px_1fr_1fr_80px_48px] gap-3 px-4 py-2.5 rounded-md hover:bg-surface-2 cursor-pointer group transition-colors items-center"
              onDoubleClick={() => onPlayTrack(track.id)}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded bg-surface-3 relative">
                <span className="text-sm text-tertiary group-hover:hidden">{index + 1}</span>
                <button 
                  className="hidden group-hover:flex absolute inset-0 items-center justify-center text-primary"
                  onClick={(e) => { e.stopPropagation(); onPlayTrack(track.id) }}
                >
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
              
              <div className="flex flex-col justify-center min-w-0">
                <span className={`text-[14px] font-medium truncate ${currentTrack?.id === track.id ? 'text-accent' : 'text-primary'}`}>
                  {track.title}
                </span>
                <span className="text-[12px] text-secondary truncate">{track.artist}</span>
              </div>
              
              <span className="text-[13px] text-secondary truncate flex items-center">{track.album}</span>
              
              <span className="text-[13px] text-tertiary text-right flex items-center justify-end">
                {formatDuration(track.duration)}
              </span>
              
              <button 
                className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-accent transition-all flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id) }}
              >
                <Heart size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}