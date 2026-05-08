import { useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { Play, Pause, ChevronRight, MoreVertical } from 'lucide-react'
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
  const importRows = tracks.slice(0, 3)

  const handlePlay = useCallback((trackId: number) => {
    play(trackId)
  }, [play])

  const artwork = (track: (typeof tracks)[number]) =>
    track.cover_path
      ? `tplayer-img://media/${encodeURIComponent(track.cover_path)}`
      : undefined

  return (
    <div className="h-full overflow-y-auto px-8 pb-8 animate-fade-in">
      {highlightTracks.length > 0 && (
        <section className="mb-9">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[1.05rem] font-semibold text-primary">Continue listening</h2>
            <button
              className="grid h-8 w-8 place-items-center rounded-[6px] border border-white/[0.08] text-tertiary hover:text-primary hover:bg-white/[0.04] transition-colors"
              onClick={() => onViewChange?.('library')}
              title="Open library"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
            {highlightTracks.map((track) => (
              <button
                key={track.id}
                className="group overflow-hidden rounded-[7px] bg-white/[0.035] text-left transition-colors hover:bg-white/[0.055]"
                onClick={() => handlePlay(track.id)}
              >
                <div className="relative aspect-square overflow-hidden bg-black/25">
                  {artwork(track) ? (
                    <img src={artwork(track)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(210,166,86,0.22),rgba(255,255,255,0.025))] text-4xl font-bold text-accent">
                      {track.title?.[0] || 'T'}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(track.id) }}
                    className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-accent text-background opacity-0 shadow-play-button transition-all duration-300 ease-spring group-hover:opacity-100"
                  >
                    {isPlaying && currentTrack?.id === track.id ? (
                      <Pause size={20} fill="currentColor" />
                    ) : (
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                </div>
                <div className="px-3 py-3">
                  <p className="text-sm font-semibold text-primary truncate mb-0.5 flex items-center gap-2">
                    {track.title}
                    {isPlaying && currentTrack?.id === track.id && <PlayingBars />}
                  </p>
                  <p className="text-[13px] text-secondary truncate">{track.artist}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {recentTracks.length > 0 && (
        <section className="mb-9">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.05rem] font-semibold text-primary">Recently added</h2>
            <button
              className="grid h-8 w-8 place-items-center rounded-[6px] border border-white/[0.08] text-tertiary hover:text-primary hover:bg-white/[0.04] transition-colors"
              onClick={() => onViewChange?.('library')}
              title="See all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
            {recentTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => handlePlay(track.id)}
                className="group text-left"
              >
                <div className="aspect-square overflow-hidden rounded-[6px] bg-black/25">
                  {artwork(track) ? (
                    <img src={artwork(track)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/[0.04] text-xl font-bold text-accent">
                      {track.title?.[0] || 'T'}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-primary">{track.title}</p>
                <p className="mt-0.5 truncate text-xs text-secondary">{track.artist}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {importRows.length > 0 && (
        <section>
          <h2 className="mb-3 text-[1.05rem] font-semibold text-primary">YouTube imports</h2>
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {importRows.map((track) => (
              <button
                key={track.id}
                onClick={() => handlePlay(track.id)}
                className="grid w-full grid-cols-[48px_minmax(0,1fr)_64px_84px_84px_24px] items-center gap-3 py-2.5 text-left transition-colors hover:bg-white/[0.025]"
              >
                <div className="h-10 w-10 overflow-hidden rounded-[5px] bg-white/[0.05]">
                  {artwork(track) ? (
                    <img src={artwork(track)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-accent">
                      {track.title?.[0] || 'T'}
                    </div>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-primary">{track.title}</p>
                <p className="text-right text-xs text-secondary">{formatDuration(track.duration)}</p>
                <span className="justify-self-end rounded-[5px] bg-accent/14 px-2 py-1 text-[11px] font-semibold text-accent">MP3</span>
                <span className="text-right text-xs text-tertiary">local</span>
                <MoreVertical size={16} className="text-tertiary" />
              </button>
            ))}
          </div>
        </section>
      )}

      {tracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-white/[0.035] flex items-center justify-center mb-6">
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
