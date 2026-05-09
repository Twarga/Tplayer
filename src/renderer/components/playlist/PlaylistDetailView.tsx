import { useEffect, useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Play, Pause, Trash2 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { TrackContextMenu } from '@/components/ui/track-context-menu'
import { formatDuration } from '@/lib/utils'
import { api } from '@/lib/ipc'

interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: number
  cover_path?: string | null
}

interface PlaylistDetailViewProps {
  playlistId: number
}

export function PlaylistDetailView({ playlistId }: PlaylistDetailViewProps) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { play, isPlaying, currentTrack } = usePlayerStore()
  const { playlists } = usePlaylistStore()
  const playlist = playlists.find(p => p.id === playlistId)
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 61,
    overscan: 10,
  })

  const loadTracks = async () => {
    setIsLoading(true)
    try {
      const data = await api.playlist.getTracks(playlistId)
      setTracks(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTracks()
  }, [playlistId])

  const handleRemoveTrack = async (e: React.MouseEvent, trackId: number) => {
    e.stopPropagation()
    await api.playlist.removeTrack(playlistId, trackId)
    loadTracks()
  }

  const handlePlayAll = async () => {
    if (tracks.length === 0) return
    await api.queue.clear()
    for (const track of tracks) {
      await api.queue.add(track.id)
    }
    play(tracks[0].id)
  }

  if (!playlist) return null

  // Build mosaic cover cells from loaded tracks
  const mosaicCovers = tracks
    .slice(0, 4)
    .filter((t) => t.cover_path)
    .map((t) => `tplayer-img://media/${encodeURIComponent(t.cover_path!)}`)

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in" ref={parentRef}>
      {/* Header */}
      <div className="flex items-end gap-6 mb-8 mt-4">
        {/* Mosaic / cover — Task 9 */}
        <div className="w-48 h-48 rounded-lg shadow-lg overflow-hidden shrink-0 bg-surface-2">
          {mosaicCovers.length > 0 ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {[...mosaicCovers, ...Array(Math.max(0, 4 - mosaicCovers.length)).fill('')].map((url, i) =>
                url ? (
                  <img key={i} src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div key={i} className="bg-surface-3" />
                )
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl text-accent font-bold">{playlist.name[0]}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Playlist</span>
          <h1 className="text-5xl font-black text-primary tracking-tight">{playlist.name}</h1>
          <p className="text-sm text-secondary mt-2">
            {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handlePlayAll}
              className="w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 transition-transform shadow-play-button"
            >
              <Play size={24} fill="currentColor" className="ml-1" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 mt-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-md skeleton" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16 mt-8 border-t border-border-subtle">
          <p className="text-lg text-secondary mb-2">This playlist is empty</p>
          <p className="text-sm text-tertiary">Go to your library and add some tracks here.</p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="grid grid-cols-[48px_1fr_1fr_80px_48px] gap-3 px-4 text-[11px] font-semibold uppercase text-tertiary mb-2 border-b border-border-subtle pb-2">
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
                  <TrackContextMenu trackId={track.id}>
                  <div
                    className="grid grid-cols-[48px_1fr_1fr_80px_48px] gap-3 px-4 h-full rounded-md hover:bg-surface-2 cursor-pointer group transition-colors items-center"
                    onDoubleClick={() => play(track.id)}
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-surface-3 relative text-tertiary group-hover:text-primary shrink-0">
                      <span className="text-sm group-hover:hidden">{index + 1}</span>
                      <button
                        className="hidden group-hover:flex absolute inset-0 items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); play(track.id) }}
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
                        <img src={`tplayer-img://media/${encodeURIComponent(track.cover_path)}`} className="w-10 h-10 rounded object-cover shrink-0" alt="" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-surface-3 flex items-center justify-center text-tertiary shrink-0">♪</div>
                      )}
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[14px] font-medium text-primary truncate">
                          {track.title}
                        </span>
                        <span className="text-[12px] text-secondary truncate">{track.artist}</span>
                      </div>
                    </div>

                    <span className="text-[13px] text-secondary truncate flex items-center">{track.album}</span>

                    <span className="text-[13px] text-tertiary text-right flex items-center justify-end">
                      {formatDuration(track.duration)}
                    </span>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-2 transition-opacity">
                      <button
                        className="text-tertiary hover:text-red-400 p-1 active:scale-95 transition-transform"
                        onClick={(e) => handleRemoveTrack(e, track.id)}
                        title="Remove from playlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  </TrackContextMenu>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
