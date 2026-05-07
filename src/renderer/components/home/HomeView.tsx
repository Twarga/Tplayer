import { useState, useEffect, useCallback } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { useQueueStore } from '@/stores/queueStore'
import { Play, Clock, ChevronRight } from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'

export function HomeView() {
  const { tracks, loadTracks } = useLibraryStore()
  const { play } = usePlayerStore()
  const { add: addToQueue } = useQueueStore()
  const [greeting, setGreeting] = useState('Good evening')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
    loadTracks()
  }, [])

  const recentTracks = tracks.slice(0, 6)

  const handlePlay = useCallback((trackId: number) => {
    play(trackId)
  }, [play])

  const handleAddToQueue = useCallback((trackId: number) => {
    addToQueue(trackId)
  }, [addToQueue])

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <h1 className="text-display text-primary mb-1">{greeting}</h1>
      <p className="text-body text-secondary mb-8">Enjoy your music</p>

      {/* Recently Played / Continue Listening */}
      {recentTracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-primary">Continue listening</h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {recentTracks.slice(0, 4).map((track) => (
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
                    className="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-accent text-background flex items-center justify-center shadow-play-button opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-spring hover:scale-105"
                  >
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-primary truncate mb-0.5">{track.title}</p>
                <p className="text-[13px] text-secondary truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      {tracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 text-primary">Recently added</h2>
            <button className="text-caption text-tertiary hover:text-primary flex items-center gap-1 transition-colors">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6">
            {tracks.slice(0, 8).map((track) => (
              <div
                key={track.id}
                className="w-[160px] flex-shrink-0 cursor-pointer group"
                onClick={() => handlePlay(track.id)}
              >
                <div className="aspect-square rounded-md bg-surface-2 mb-2 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-surface-3 to-surface-2 flex items-center justify-center text-accent text-2xl font-bold group-hover:scale-105 transition-transform duration-300">
                    {track.title?.[0] || '♪'}
                  </div>
                </div>
                <p className="text-[13px] font-medium text-primary truncate">{track.title}</p>
                <p className="text-xs text-secondary truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
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