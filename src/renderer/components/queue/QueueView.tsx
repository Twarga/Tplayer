import { useEffect } from 'react'
import { Play, X, GripVertical } from 'lucide-react'
import { useQueueStore } from '@/stores/queueStore'
import { usePlayerStore } from '@/stores/playerStore'
import { cn, formatDuration } from '@/lib/utils'

export function QueueView() {
  const { queue, loadQueue, remove, clear } = useQueueStore()
  const { play, currentTrack } = usePlayerStore()

  useEffect(() => {
    loadQueue()
  }, [])

  return (
    <div className="p-6 overflow-y-auto h-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Queue</h1>
        {queue.length > 0 && (
          <button
            onClick={clear}
            className="text-sm text-tertiary hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-secondary mb-2">Queue is empty</p>
          <p className="text-sm text-tertiary">Add songs from your library to get started</p>
        </div>
      ) : (
        <div className="space-y-1">
          {queue.map((track, index) => (
            <div
              key={`${track.id}-${index}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md group transition-colors",
                currentTrack?.id === track.id ? "bg-surface-3" : "hover:bg-surface-2"
              )}
            >
              <button className="text-tertiary opacity-0 group-hover:opacity-100 cursor-grab transition-opacity">
                <GripVertical size={16} />
              </button>

              <div className="w-8 h-8 rounded bg-surface-3 flex items-center justify-center text-tertiary text-xs shrink-0">
                {index + 1}
              </div>

              <button
                onClick={() => play(track.id)}
                className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <Play size={14} fill="currentColor" />
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  currentTrack?.id === track.id ? "text-accent" : "text-primary"
                )}>
                  {track.title}
                </p>
                <p className="text-xs text-secondary truncate">{track.artist}</p>
              </div>

              <span className="text-xs text-tertiary shrink-0">
                {formatDuration(track.duration)}
              </span>

              <button
                onClick={() => remove(index)}
                className="text-tertiary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}