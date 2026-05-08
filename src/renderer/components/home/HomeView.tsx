import { useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { Play, Pause, ChevronRight, MoreVertical, Radio, Shuffle, Sparkles } from 'lucide-react'
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
  const featuredTrack = currentTrack
    ? tracks.find((track) => track.id === currentTrack.id) ?? tracks[0]
    : tracks[0]

  const handlePlay = useCallback((trackId: number) => {
    play(trackId)
  }, [play])

  const artwork = (track: (typeof tracks)[number]) =>
    track.cover_path
      ? `tplayer-img://media/${encodeURIComponent(track.cover_path)}`
      : undefined

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      {featuredTrack && (
        <section className="mb-8 grid min-h-[420px] grid-cols-[minmax(320px,0.58fr)_minmax(280px,0.42fr)] overflow-hidden">
          <button
            onClick={() => handlePlay(featuredTrack.id)}
            className="group relative min-h-[420px] overflow-hidden bg-accent text-left text-black"
          >
            {artwork(featuredTrack) ? (
              <img
                src={artwork(featuredTrack)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover mix-blend-multiply grayscale-[0.1] contrast-125"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_30%,rgba(0,0,0,0.35),transparent_28%),linear-gradient(135deg,rgba(0,0,0,0.12),transparent)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(0,0,0,0.32))]" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-2">
              <h2 className="max-w-full truncate font-display text-[clamp(3.2rem,8vw,6.8rem)] font-extrabold leading-none text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.36)]">
                {featuredTrack.artist || featuredTrack.title}
              </h2>
            </div>
            <span className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-full bg-black/70 text-accent opacity-0 transition-opacity group-hover:opacity-100">
              {isPlaying && currentTrack?.id === featuredTrack.id ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="ml-1" />
              )}
            </span>
          </button>

          <aside className="bg-[linear-gradient(135deg,rgba(255,176,0,0.14),rgba(19,13,8,0.78)_38%,rgba(9,7,12,0.94))] px-7 py-7">
            <div className="mb-7 flex items-center gap-2 text-xs text-secondary">
              <Sparkles size={14} className="text-accent" />
              <span>Now playing</span>
            </div>
            <h2 className="text-2xl font-bold text-primary">{featuredTrack.title}</h2>
            <p className="mt-1 text-sm text-secondary">{featuredTrack.artist || 'Unknown artist'}</p>
            <p className="mt-6 max-w-sm text-sm leading-6 text-secondary">
              Your local library stays first: quick playback, clean queue control, and imported tracks ready beside your albums.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => handlePlay(featuredTrack.id)}
                className="grid h-12 w-12 place-items-center rounded-full bg-accent text-black shadow-accent-glow"
                title="Play featured track"
              >
                {isPlaying && currentTrack?.id === featuredTrack.id ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-0.5" />
                )}
              </button>
              <button className="flex items-center gap-2 text-sm text-secondary hover:text-primary">
                <Shuffle size={16} />
                Shuffle
              </button>
              <button className="flex items-center gap-2 text-sm text-secondary hover:text-primary">
                <Radio size={16} />
                Radio
              </button>
            </div>
            <div className="mt-10">
              <h3 className="mb-3 text-sm font-semibold text-primary">Top songs</h3>
              <div className="space-y-3">
                {tracks.slice(0, 5).map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handlePlay(track.id)}
                    className="grid w-full grid-cols-[38px_minmax(0,1fr)_48px] items-center gap-3 text-left"
                  >
                    <div className="h-9 w-9 overflow-hidden rounded-[5px] bg-white/[0.05]">
                      {artwork(track) ? (
                        <img src={artwork(track)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-accent/18 text-xs font-bold text-accent">
                          {track.title?.[0] || 'T'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-primary">{track.title}</p>
                      <p className="truncate text-xs text-secondary">{track.artist}</p>
                    </div>
                    <span className="text-right text-xs text-tertiary">{formatDuration(track.duration)}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      )}

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
