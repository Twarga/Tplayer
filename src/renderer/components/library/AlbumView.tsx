import { useMemo } from 'react'
import { Disc, Play } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '@/lib/ipc'

export function AlbumView() {
  const { tracks } = useLibraryStore()
  const { play } = usePlayerStore()

  const albums = useMemo(() => {
    const map = new Map<string, { title: string; artist: string; trackIds: number[]; count: number }>()
    for (const track of tracks) {
      const key = track.album
      if (!map.has(key)) {
        map.set(key, { title: track.album, artist: track.artist, trackIds: [], count: 0 })
      }
      map.get(key)!.trackIds.push(track.id)
      map.get(key)!.count++
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title))
  }, [tracks])

  const handlePlayAlbum = async (e: React.MouseEvent, trackIds: number[]) => {
    e.stopPropagation()
    if (trackIds.length === 0) return
    await api.queue.clear()
    for (const id of trackIds) {
      await api.queue.add(id)
    }
    play(trackIds[0])
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Albums</h1>
        <p className="text-sm text-secondary mt-2">Browse your collection by release and start full-album playback quickly.</p>
      </div>

      {albums.length === 0 ? (
        <div className="border-y border-white/[0.06] text-center py-16 text-secondary">No albums found</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {albums.map((album) => (
            <div
              key={album.title}
              className="group cursor-pointer border-b border-white/[0.06] pb-4 transition-colors hover:border-accent/35"
              onClick={(e) => handlePlayAlbum(e, album.trackIds)}
            >
              <div className="aspect-square bg-[radial-gradient(circle_at_top_left,rgba(255,176,0,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] mb-4 flex items-center justify-center relative overflow-hidden">
                <Disc size={48} className="text-tertiary" />
                <button
                  onClick={(e) => handlePlayAlbum(e, album.trackIds)}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-spring shadow-play-button hover:scale-105"
                >
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </button>
              </div>

              <h3 className="text-[15px] font-semibold text-primary truncate mb-1" title={album.title}>
                {album.title}
              </h3>
              <p className="text-xs text-secondary truncate" title={album.artist}>
                {album.artist} • {album.count} tracks
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
