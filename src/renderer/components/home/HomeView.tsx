import React, { useEffect, useState } from 'react'
import { Play, ChevronRight } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'

export function HomeView() {
  const { currentTrack, play } = usePlayerStore()
  const { tracks } = useLibraryStore()
  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })

  const recentTracks = tracks.slice(0, 4)

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h1 className="text-[32px] font-bold text-primary mb-1">{greeting}</h1>
      <p className="text-sm text-secondary mb-8">Enjoy your music</p>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">Continue listening</h2>
          <button className="text-xs text-tertiary hover:text-primary flex items-center gap-1 transition-colors">
            See all <ChevronRight size={14} />
          </button>
        </div>

        {currentTrack ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            <ContinueListeningCard
              title={currentTrack.title}
              artist={currentTrack.artist}
              progress={0}
              onPlay={() => play(currentTrack.id)}
            />
          </div>
        ) : (
          <p className="text-tertiary text-sm">No track playing. Choose something from your library!</p>
        )}
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">Recently added</h2>
          <button className="text-xs text-tertiary hover:text-primary flex items-center gap-1 transition-colors">
            See all <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {recentTracks.map((track) => (
            <div key={track.id} className="w-[140px] flex-shrink-0 group cursor-pointer"
              onClick={() => play(track.id)}>
              <div className="aspect-square rounded-md bg-surface-2 mb-2 overflow-hidden relative">
                <div className="w-full h-full bg-gradient-to-br from-surface-3 to-surface-2 flex items-center justify-center text-accent text-2xl font-bold">
                  {track.title[0]}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                    <Play size={20} fill="currentColor" />
                  </div>
                </div>
              </div>
              <p className="text-[13px] font-medium text-primary truncate">{track.title}</p>
              <p className="text-[12px] text-secondary truncate">{track.artist}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">YouTube imports</h2>
          <button className="text-xs text-tertiary hover:text-primary flex items-center gap-1 transition-colors">
            See all <ChevronRight size={14} />
          </button>
        </div>

        <p className="text-tertiary text-sm">No YouTube imports yet. Go to YouTube Import to download music!</p>
      </section>
    </div>
  )
}

interface ContinueListeningCardProps {
  title: string
  artist: string
  progress: number
  onPlay: () => void
}

function ContinueListeningCard({ title, artist, progress, onPlay }: ContinueListeningCardProps) {
  return (
    <div className="bg-surface-1 rounded-lg p-3 transition-transform hover:scale-[1.02] cursor-pointer group">
      <div className="aspect-square rounded-md bg-surface-2 mb-3 overflow-hidden relative">
        <div className="w-full h-full bg-gradient-to-br from-accent/20 to-surface-2 flex items-center justify-center text-accent text-3xl font-bold">
          {title[0]}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onPlay() }}
          className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-spring hover:scale-105 active:scale-95"
        >
          <Play size={20} fill="currentColor" />
        </button>
      </div>
      <p className="text-sm font-semibold text-primary truncate mb-1">{title}</p>
      <p className="text-[13px] text-secondary truncate">{artist}</p>
      {progress > 0 && (
        <div className="mt-2 h-[3px] bg-progress-bg rounded-full">
          <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}