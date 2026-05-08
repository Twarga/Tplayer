import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { RefreshCw, Play, Pause, Heart, ArrowUpDown, Clock3, Disc3, Sparkles } from 'lucide-react'
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
    searchQuery,
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

  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0)
  const hours = totalDuration / 3600
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
    <div className="p-6 overflow-y-auto h-full animate-fade-in" ref={parentRef}>
      <section className="surface-card rounded-[26px] border border-border-subtle overflow-hidden mb-6">
        <div className="px-6 py-6 md:px-7 md:py-7 bg-[radial-gradient(circle_at_top_left,rgba(232,168,124,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-2/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-4">
                <Sparkles size={12} />
                Core Library
              </div>
              <h1 className="text-3xl font-bold text-primary">Browse fast, queue cleanly, and keep the player in motion.</h1>
              <p className="mt-3 text-sm text-secondary max-w-2xl leading-6">
                The library is the working home of Tplayer. Search, sort, and start playback without fighting decorative UI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => handlePlayTrack(0)} className="gap-2">
                <Play size={16} fill="currentColor" /> Play All
              </Button>
              <Button variant="ghost" size="icon" onClick={() => loadTracks()} title="Refresh">
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border-subtle p-6 md:grid-cols-[repeat(3,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))]">
          <LibraryStat icon={Disc3} label="Tracks" value={tracks.length.toLocaleString()} />
          <LibraryStat icon={Clock3} label="Listening time" value={hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(totalDuration / 60)}m`} />
          <LibraryStat icon={ArrowUpDown} label="Sorted by" value={sortOptions.find((option) => option.field === sortField)?.label || 'Custom'} />
          <LibraryStat label="Filter" value={searchQuery ? `"${searchQuery}"` : 'All music'} />
        </div>
      </section>

      <div className="flex flex-col gap-4 mb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {sortOptions.map((option) => {
            const active = sortField === option.field
            return (
              <button
                key={option.field}
                onClick={() => sort(option.field, active && sortDir === 'asc' ? 'desc' : 'asc')}
                className={cn(
                  'h-10 px-4 rounded-[0.95rem] border text-sm font-medium interactive-soft',
                  active
                    ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] border-white/[0.08] text-primary shadow-card'
                    : 'bg-surface-1/75 border-border-subtle text-secondary hover:text-primary hover:bg-surface-2'
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

        {scanProgress && (
          <div className="rounded-[1rem] border border-border-subtle bg-surface-1 px-4 py-3 min-w-[260px]">
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
            <div key={i} className="h-[4.25rem] surface-card rounded-[18px] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="surface-card rounded-[24px] text-center py-16">
          <p className="text-lg text-red-400 mb-2">Error loading library</p>
          <p className="text-sm text-secondary">{error}</p>
          <Button onClick={() => loadTracks()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      ) : tracks.length === 0 ? (
        <div className="surface-card rounded-[24px] text-center py-16">
          <p className="text-lg text-secondary mb-2">No music found</p>
          <p className="text-sm text-tertiary mb-6">Add a music folder in Settings to build your library.</p>
          <Button variant="outline" onClick={() => onViewChange?.('settings')}>
            Go to Settings
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
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
                      'grid grid-cols-[58px_minmax(0,1.4fr)_minmax(0,1fr)_90px_54px] gap-3 px-4 h-full rounded-[18px] cursor-pointer group transition-all items-center border',
                      active
                        ? 'bg-accent/10 border-accent/20 shadow-card'
                        : 'bg-surface-1/72 border-transparent hover:bg-surface-2/95 hover:border-white/[0.05]'
                    )}
                    onDoubleClick={() => handlePlayTrack(index)}
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-[14px] bg-surface-3 relative shrink-0">
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
                        <img src={`tplayer-img://media/${encodeURIComponent(track.cover_path)}`} className="w-11 h-11 rounded-[14px] object-cover shrink-0 shadow-card" alt="" />
                      ) : (
                        <div className="w-11 h-11 rounded-[14px] bg-surface-3 flex items-center justify-center text-tertiary shrink-0">♪</div>
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

function LibraryStat({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-[20px] border border-border-subtle bg-surface-1/85 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-tertiary font-semibold">
        {Icon ? <Icon size={13} className="text-accent" /> : null}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-primary truncate">{value}</p>
    </div>
  )
}
