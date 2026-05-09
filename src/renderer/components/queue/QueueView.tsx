import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, X, GripVertical } from 'lucide-react'
import { useQueueStore } from '@/stores/queueStore'
import { usePlayerStore } from '@/stores/playerStore'
import { cn, formatDuration } from '@/lib/utils'
import { PlayingBars } from '@/components/ui/PlayingBars'
import { animations, staggerItem, staggerParent } from '@/lib/animations'

export function QueueView() {
  const { queue, loadQueue, remove, clear, reorder } = useQueueStore()
  const { play, currentTrack, isPlaying } = usePlayerStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

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
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="space-y-1"
        >
          {queue.map((track, index) => (
            <motion.div
              key={`${track.id}-${index}`}
              variants={staggerItem}
              layout
            >
              <div
                draggable
                onDragStart={(e) => {
                  setDraggedIndex(index)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedIndex !== null && draggedIndex !== index) {
                    reorder(draggedIndex, index)
                  }
                  setDraggedIndex(null)
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md group interactive-soft",
                  currentTrack?.id === track.id
                    ? "bg-accent/[0.08] border border-accent/20"
                    : "hover:bg-surface-2 border border-transparent",
                  draggedIndex === index ? "opacity-50" : ""
                )}
              >
                <div className="text-tertiary opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                  <GripVertical size={16} />
                </div>

                <div className="w-8 h-8 rounded bg-surface-3 flex items-center justify-center text-tertiary text-xs shrink-0">
                  {index + 1}
                </div>

                <button
                  onClick={() => play(track.id)}
                  className={cn("w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent opacity-0 group-hover:opacity-100 shrink-0", animations.controlButton)}
                >
                  <Play size={14} fill="currentColor" />
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-semibold truncate flex items-center gap-2",
                    currentTrack?.id === track.id ? "text-accent" : "text-primary"
                  )}>
                    {track.title}
                    {isPlaying && currentTrack?.id === track.id && <PlayingBars />}
                  </p>
                  <p className="text-xs text-secondary truncate">{track.artist}</p>
                </div>

                <span className="text-xs text-tertiary shrink-0">
                  {formatDuration(track.duration)}
                </span>

                <button
                  onClick={() => remove(index)}
                  className={cn("text-tertiary hover:text-red-400 opacity-0 group-hover:opacity-100 shrink-0 p-1", animations.controlButton)}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
