import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { RefreshCw, Play, Pause, Heart } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { useToast } from '@/stores/toastStore'
import { Button } from '@/components/ui/button'
import { PlayingBars } from '@/components/ui/PlayingBars'
import { formatDuration, cn } from '@/lib/utils'

interface LibraryViewProps {
  onViewChange?: (view: string) => void
}

export function LibraryView({ onViewChange }: LibraryViewProps) {
  const { tracks, isLoading, error, loadTracks, toggleFavorite, isFavorite } = useLibraryStore()
  const { currentTrack, isPlaying, play } = usePlayerStore()
  const { add: addToast } = useToast()

  useEffect(() => {
    loadTracks()
  }, [])

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 61,
    overscan: 10,
  })

  const handlePlayTrack = async (startIndex: number) => {
    if (tracks.length === 0) return
    const trackIds = tracks.slice(startIndex).map(t => t.id)
    await useQueueStore.getState().set(trackIds)
    play(tracks[startIndex].id)
  }

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in" ref={parentRef}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Library</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => handlePlayTrack(0)} className="gap-2">
            <Play size={16} fill="currentColor" /> Play All
          </Button>
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
          <Button variant="outline" onClick={() => onViewChange?.('settings')}>
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
          <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const index = virtualRow.index
              const track = tracks[index]
              return (
                <div
                  key={track.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className="grid grid-cols-[48px_1fr_1fr_80px_48px] gap-3 px-4 h-full rounded-md hover:bg-surface-2 cursor-pointer group transition-colors items-center"
                    onDoubleClick={() => handlePlayTrack(index)}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-surface-3 relative shrink-0">
                      <span className="text-sm text-tertiary group-hover:hidden">{index + 1}</span>
                      <button 
                        className="hidden group-hover:flex absolute inset-0 items-center justify-center text-primary hover:text-accent hover:scale-110 active:scale-95 transition-all"
                        onClick={(e) => { e.stopPropagation(); handlePlayTrack(index) }}
                      >
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Pause size={16} fill="currentColor" />
                        ) : (
                          <Play size={16} fill="currentColor" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      {track.cover_path ? (
                        <img src={`tplayer-img://media/${encodeURIComponent(track.cover_path)}`} className="w-10 h-10 rounded object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-surface-3 flex items-center justify-center text-tertiary shrink-0">♪</div>
                      )}
                      <div className="flex flex-col justify-center min-w-0">
                        <span className={`text-[14px] font-medium truncate flex items-center gap-2 ${currentTrack?.id === track.id ? 'text-accent' : 'text-primary'}`}>
                          {track.title}
                          {isPlaying && currentTrack?.id === track.id && <PlayingBars />}
                        </span>
                        <span className="text-[12px] text-secondary truncate">{track.artist}</span>
                      </div>
                    </div>
                    
                    <span className="text-[13px] text-secondary truncate flex items-center">{track.album}</span>
                    
                    <span className="text-[13px] text-tertiary text-right flex items-center justify-end">
                      {formatDuration(track.duration)}
                    </span>
                    
                    <button 
                      className={cn("opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center active:scale-95", isFavorite(track.id) ? "text-accent opacity-100" : "text-tertiary hover:text-accent")}
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        await toggleFavorite(track.id);
                        addToast('Toggled favorite', 'success');
                      }}
                    >
                      <Heart size={16} fill={isFavorite(track.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
