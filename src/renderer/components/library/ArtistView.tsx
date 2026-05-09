import { useMemo } from 'react'
import { Users, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { staggerParent, staggerItem } from '@/lib/animations'

export function ArtistView() {
  const { tracks } = useLibraryStore()
  const { play } = usePlayerStore()

  const artists = useMemo(() => {
    const map = new Map<string, { name: string; trackIds: number[]; count: number; coverPath: string | null }>()
    for (const track of tracks) {
      const key = track.artist || 'Unknown Artist'
      if (!map.has(key)) {
        map.set(key, { name: key, trackIds: [], count: 0, coverPath: track.cover_path ?? null })
      }
      const entry = map.get(key)!
      entry.trackIds.push(track.id)
      entry.count++
      if (!entry.coverPath && track.cover_path) {
        entry.coverPath = track.cover_path
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [tracks])

  const handlePlayArtist = async (e: React.MouseEvent, trackIds: number[]) => {
    e.stopPropagation()
    if (trackIds.length === 0) return
    await useQueueStore.getState().set(trackIds)
    play(trackIds[0])
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Artists</h1>
        <p className="text-sm text-secondary mt-2">Move through your collection by artist when you want broader playback than a single album.</p>
      </div>

      {artists.length === 0 ? (
        <div className="border-y border-white/[0.06] text-center py-16 text-secondary">No artists found</div>
      ) : (
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5"
        >
          {artists.map((artist) => (
            <motion.div
              key={artist.name}
              variants={staggerItem}
              className="group cursor-pointer border-b border-white/[0.06] pb-4 text-center transition-colors hover:border-accent/35"
              onClick={(e) => handlePlayArtist(e, artist.trackIds)}
            >
              <div className="aspect-square rounded-full bg-[radial-gradient(circle_at_top_left,rgba(255,176,0,0.14),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] mb-4 flex items-center justify-center relative overflow-hidden mx-auto w-[72%]">
                {artist.coverPath ? (
                  <img
                    src={`tplayer-img://media/${encodeURIComponent(artist.coverPath)}`}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Users size={32} className="text-tertiary" />
                )}
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
