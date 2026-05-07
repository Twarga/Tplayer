import React, { useEffect } from 'react'
import { Search, RefreshCw, Grid, List } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'

interface LibraryViewProps {
  onPlayTrack: (id: number) => void
}

export function LibraryView({ onPlayTrack }: LibraryViewProps) {
  const { tracks, isLoading, searchQuery, loadTracks, search, init } = useLibraryStore()

  useEffect(() => {
    init()
    loadTracks()
  }, [])

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Library</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => search(e.target.value)}
            className="w-64"
          />
          <Button variant="ghost" size="icon" onClick={() => loadTracks()}>
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-1 rounded-md animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-secondary mb-2">No music found</p>
          <p className="text-sm text-tertiary">Add a music folder in Settings to get started</p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[40px_40px_1fr_1fr_80px_40px] gap-2 px-4 text-[11px] font-semibold uppercase text-tertiary mb-2">
            <span>#</span>
            <span></span>
            <span>Title</span>
            <span>Album</span>
            <span>Duration</span>
            <span></span>
          </div>

          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="grid grid-cols-[40px_40px_1fr_1fr_80px_40px] gap-2 px-4 py-2 rounded-md hover:bg-surface-2 cursor-pointer group transition-colors"
              onDoubleClick={() => onPlayTrack(track.id)}
            >
              <span className="text-[13px] text-tertiary flex items-center justify-center">
                {index + 1}
              </span>
              <div className="w-10 h-10 rounded bg-surface-3 flex items-center justify-center text-accent text-sm font-bold">
                {track.title[0]}
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[14px] font-medium text-primary truncate">{track.title}</span>
                <span className="text-[12px] text-secondary truncate">{track.artist}</span>
              </div>
              <span className="text-[13px] text-secondary truncate flex items-center">{track.album}</span>
              <span className="text-[13px] text-tertiary flex items-center">{formatDuration(track.duration)}</span>
              <button className="opacity-0 group-hover:opacity-100 text-tertiary hover:text-accent transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}