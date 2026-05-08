import { useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { Play, Pause, ChevronRight, Download, FolderOpen, ListMusic, Settings } from 'lucide-react'
import { PlayingBars } from '@/components/ui/PlayingBars'
import { formatDuration } from '@/lib/utils'

interface HomeViewProps {
  onViewChange?: (view: string) => void
}

export function HomeView({ onViewChange }: HomeViewProps) {
  const { tracks, loadTracks } = useLibraryStore()
  const { play, isPlaying, currentTrack } = usePlayerStore()

  useEffect(() => {
    if (tracks.length === 0) {
      loadTracks()
    }
  }, [])

  const recentTracks = tracks.slice(0, 6)
  const highlightTracks = tracks.slice(0, 4)

  const handlePlay = useCallback((trackId: number) => {
    play(trackId)
  }, [play])

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-8">
        {[
          {
            title: 'Open library',
            description: `${tracks.length} tracks ready for browsing and playback.`,
            icon: FolderOpen,
            view: 'library',
          },
          {
            title: 'Check queue',
            description: 'Inspect what plays next and reorder it cleanly.',
            icon: ListMusic,
            view: 'queue',
          },
          {
            title: 'Review downloads',
            description: 'Watch imported audio and recent download history.',
            icon: Download,
            view: 'downloads',
          },
          {
            title: 'Adjust settings',
            description: 'Manage folders, yt-dlp, and app behavior.',
            icon: Settings,
            view: 'settings',
          },
        ].map(({ title, description, icon: Icon, view }) => (
          <button
            key={view}
            onClick={() => onViewChange?.(view)}
            className="text-left rounded-xl border border-border-subtle bg-surface-1 p-4 hover:bg-surface-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-3 text-accent flex items-center justify-center mb-4">
              <Icon size={18} />
            </div>
            <h2 className="text-sm font-semibold text-primary">{title}</h2>
            <p className="text-xs text-secondary mt-2 leading-5">{description}</p>
          </button>
        ))}
      </section>

      {highlightTracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-primary">Pick up where you left off</h2>
            <button
              className="text-caption text-tertiary hover:text-primary flex items-center gap-1 transition-colors"
              onClick={() => onViewChange?.('library')}
            >
              Open library <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {highlightTracks.map((track) => (
              <div
                key={track.id}
                className="bg-surface-1 rounded-lg p-3 cursor-pointer card-lift group"
                onClick={() => handlePlay(track.id)}
              >
                <div className="aspect-square rounded-md bg-surface-2 mb-3 overflow-hidden relative">
                  <div className="w-full h-full bg-gradient-to-br from-accent/10 to-surface-2 flex items-center justify-center text-accent text-3xl font-bold">
                    {track.title?.[0] || '♪'}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(track.id) }}
                    className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center shadow-play-button opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-spring hover:scale-105 active:scale-95"
                  >
                    {isPlaying && currentTrack?.id === track.id ? (
                      <Pause size={20} fill="currentColor" />
                    ) : (
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-semibold text-primary truncate mb-0.5 flex items-center gap-2">
                  {track.title}
                  {isPlaying && currentTrack?.id === track.id && <PlayingBars />}
                </p>
                <p className="text-[13px] text-secondary truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentTracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-primary">Recently added</h2>
            <button
              className="text-caption text-tertiary hover:text-primary flex items-center gap-1 transition-colors"
              onClick={() => onViewChange?.('library')}
            >
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            {recentTracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handlePlay(track.id)}
                className="w-full grid grid-cols-[40px_minmax(0,1fr)_120px_72px] items-center gap-3 px-4 py-3 text-left bg-surface-1 hover:bg-surface-2 transition-colors border-b border-border-subtle last:border-b-0"
              >
                <div className="w-10 h-10 rounded-md bg-surface-3 flex items-center justify-center text-tertiary">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate flex items-center gap-2">
                    {track.title}
                    {isPlaying && currentTrack?.id === track.id && <PlayingBars />}
                  </p>
                  <p className="text-xs text-secondary truncate">{track.artist}</p>
                </div>
                <p className="text-xs text-secondary truncate">{track.album}</p>
                <p className="text-xs text-tertiary text-right">{formatDuration(track.duration)}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {tracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center mb-6">
            <Play size={32} className="text-tertiary" />
          </div>
          <h3 className="text-h3 text-primary mb-2">Start listening</h3>
          <p className="text-body text-secondary text-center max-w-sm mb-6">
            Add a music folder in Settings to import your library, or download from YouTube.
          </p>
        </div>
      )}
    </div>
  )
}
