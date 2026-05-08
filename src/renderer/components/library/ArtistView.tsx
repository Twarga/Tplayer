import { useMemo } from 'react'
import { Users, Play } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { api } from '@/lib/ipc'

export function ArtistView() {
  const { tracks } = useLibraryStore()
  const { play } = usePlayerStore()

  const artists = useMemo(() => {
    const map = new Map<string, { name: string; trackIds: number[]; count: number }>()
    for (const track of tracks) {
      const key = track.artist
      if (!map.has(key)) {
        map.set(key, { name: track.artist, trackIds: [], count: 0 })
      }
      map.get(key)!.trackIds.push(track.id)
      map.get(key)!.count++
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tracks])

  const handlePlayArtist = async (e: React.MouseEvent, trackIds: number[]) => {
    e.stopPropagation()
    if (trackIds.length === 0) return
    await api.queue.clear()
    for (const id of trackIds) {
      await api.queue.add(id)
    }
    play(trackIds[0])
  }

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Artists</h1>
        <p className="text-sm text-secondary mt-2">Move through your collection by artist when you want broader playback than a single album.</p>
      </div>

      {artists.length === 0 ? (
        <div className="surface-card rounded-[24px] text-center py-16 text-secondary">No artists found</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {artists.map((artist) => (
            <div
              key={artist.name}
              className="surface-card rounded-[24px] p-4 group hover:bg-surface-2 transition-colors cursor-pointer card-lift text-center border border-border-subtle"
              onClick={(e) => handlePlayArtist(e, artist.trackIds)}
            >
              <div className="aspect-square rounded-full bg-[radial-gradient(circle_at_top_left,rgba(232,168,124,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] mb-4 flex items-center justify-center relative overflow-hidden mx-auto w-[72%] shadow-md border border-white/[0.05]">
                <Users size={32} className="text-tertiary" />
                <button
                  onClick={(e) => handlePlayArtist(e, artist.trackIds)}
                  className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-accent/90 text-background flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-spring shadow-play-button hover:bg-accent"
                >
                  <Play size={20} fill="currentColor" className="ml-1" />
                </button>
              </div>

              <h3 className="text-[15px] font-semibold text-primary truncate mb-1" title={artist.name}>
                {artist.name}
              </h3>
              <p className="text-xs text-secondary truncate">
                {artist.count} tracks
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
