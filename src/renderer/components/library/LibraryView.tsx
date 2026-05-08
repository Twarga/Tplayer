import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { RefreshCw, Play, Pause, Heart, ArrowUpDown } from 'lucide-react'
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
  const {
    tracks,
    isLoading,
    error,
    loadTracks,
    toggleFavorite,
    isFavorite,
    sortField,
    sortDir,
    scanProgress,
    sort,
  } = useLibraryStore()
  const { currentTrack, isPlaying, play } = usePlayerStore()
  const { add: addToast } = useToast()

  useEffect(() => {
    loadTracks()
  }, [])

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 68,
    overscan: 10,
  })

  const sortOptions: Array<{ field: 'date_added' | 'title' | 'artist' | 'album' | 'play_count'; label: string }> = [
    { field: 'date_added', label: 'Recently added' },
    { field: 'title', label: 'Title' },
    { field: 'artist', label: 'Artist' },
    { field: 'album', label: 'Album' },
    { field: 'play_count', label: 'Most played' },
  ]

  const handlePlayTrack = async (startIndex: number) => {
    if (tracks.length === 0) return
    const trackIds = tracks.slice(startIndex).map((t) => t.id)
    await useQueueStore.getState().set(trackIds)
    play(tracks[startIndex].id)
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in" ref={parentRef}>
      <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.06] pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {sortOptions.map((option) => {
            const active = sortField === option.field
            return (
              <button
                key={option.field}
                onClick={() => sort(option.field, active && sortDir === 'asc' ? 'desc' : 'asc')}
                className={cn(
                  'h-10 px-1 border-b text-sm font-medium interactive-soft',
                  active
                    ? 'border-accent text-primary'
                    : 'border-transparent text-secondary hover:text-primary'
                )}
              >
                <span className="inline-flex items-center gap-2">
                  {option.label}
                  {active && <ArrowUpDown size={14} className="text-accent" />}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-tertiary">{tracks.length.toLocaleString()} tracks</p>
          <button onClick={() => handlePlayTrack(0)} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary">
            <Play size={16} fill="currentColor" /> Play All
          </button>
          <button onClick={() => loadTracks()} title="Refresh" className="text-tertiary hover:text-primary">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {scanProgress && (
          <div className="border-y border-white/[0.06] px-4 py-3 min-w-[260px]">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-medium text-primary">Scanning library</span>
              <span className="text-accent font-semibold">{scanProgress.processed} / {scanProgress.total}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${scanProgress.total > 0 ? (scanProgress.processed / scanProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[4.25rem] border-y border-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="border-y border-white/[0.06] text-center py-16">
          <p className="text-lg text-red-400 mb-2">Error loading library</p>
          <p className="text-sm text-secondary">{error}</p>
          <Button onClick={() => loadTracks()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      ) : tracks.length === 0 ? (
        <div className="border-y border-white/[0.06] text-center py-16">
          <p className="text-lg text-secondary mb-2">No music found</p>
          <p className="text-sm text-tertiary mb-6">Add a music folder in Settings to build your library.</p>
          <Button variant="outline" onClick={() => onViewChange?.('settings')}>
            Go to Settings
          </Button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[58px_minmax(0,1.4fr)_minmax(0,1fr)_90px_54px] gap-3 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-tertiary mb-1">
            <span>Play</span>
            <span>Track</span>
            <span>Album</span>
            <span className="text-right">Duration</span>
            <span />
          </div>
          <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const index = virtualRow.index
              const track = tracks[index]
              const active = currentTrack?.id === track.id

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
                    className={cn(
                      'grid grid-cols-[58px_minmax(0,1.4fr)_minmax(0,1fr)_90px_54px] gap-3 px-4 h-full cursor-pointer group transition-all items-center border-y border-transparent',
                      active
                        ? 'bg-accent/10 border-accent/20'
                        : 'hover:bg-white/[0.035] hover:border-white/[0.05]'
                    )}
                    onDoubleClick={() => handlePlayTrack(index)}
                  >
                    <div className="flex items-center justify-center w-11 h-11 bg-white/[0.04] relative shrink-0">
                      <span className={cn('text-sm text-tertiary group-hover:hidden', active && isPlaying && 'hidden')}>
                        {index + 1}
                      </span>
                      <button
                        className={cn(
                          'hidden absolute inset-0 items-center justify-center text-primary hover:text-accent hover:scale-110 active:scale-95 transition-all',
                          active && isPlaying ? 'flex' : 'group-hover:flex'
                        )}
                        onClick={(e) => { e.stopPropagation(); handlePlayTrack(index) }}
                      >
                        {isPlaying && active ? (
                          <Pause size={16} fill="currentColor" />
                        ) : (
                          <Play size={16} fill="currentColor" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      {track.cover_path ? (
                        <img src={`tplayer-img://media/${encodeURIComponent(track.cover_path)}`} className="w-11 h-11 object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-11 h-11 bg-white/[0.04] flex items-center justify-center text-tertiary shrink-0">♪</div>
                      )}
                      <div className="flex flex-col justify-center min-w-0">
                        <span className={cn('text-[14px] font-semibold truncate flex items-center gap-2', active ? 'text-accent' : 'text-primary')}>
                          {track.title}
                          {isPlaying && active && <PlayingBars />}
                        </span>
                        <span className="text-[12px] text-secondary truncate">{track.artist}</span>
                      </div>
                    </div>

                    <span className="text-[13px] text-secondary truncate flex items-center">{track.album}</span>

                    <span className="text-[13px] text-tertiary text-right flex items-center justify-end">
                      {formatDuration(track.duration)}
                    </span>

                    <button
                      className={cn(
                        'transition-all flex items-center justify-center active:scale-95',
                        isFavorite(track.id)
                          ? 'text-accent opacity-100'
                          : 'text-tertiary opacity-0 group-hover:opacity-100 hover:text-accent'
                      )}
                      onClick={async (e) => {
                        e.stopPropagation()
                        await toggleFavorite(track.id)
                        addToast('Toggled favorite', 'success')
                      }}
                    >
                      <Heart size={16} fill={isFavorite(track.id) ? 'currentColor' : 'none'} />
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
