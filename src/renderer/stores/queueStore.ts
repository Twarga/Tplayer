import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface QueueEntry {
  trackId: number
  title: string
  artist: string
  album: string
  duration: number
}

interface QueueStore {
  queue: QueueEntry[]
  history: QueueEntry[]
  add: (trackId: number) => Promise<void>
  addNext: (trackId: number) => Promise<void>
  remove: (index: number) => Promise<void>
  reorder: (from: number, to: number) => Promise<void>
  clear: () => Promise<void>
  init: () => void
}

export const useQueueStore = create<QueueStore>((set) => ({
  queue: [],
  history: [],

  init() {
    api.queue.onUpdated((queueIds) => {
      // IDs to QueueEntry conversion would need track lookups
      // For now just store the IDs
      set({ queue: [] })
    })
  },

  add: async (trackId) => {
    await api.queue.add(trackId)
  },

  addNext: async (trackId) => {
    await api.queue.addNext(trackId)
  },

  remove: async (index) => {
    await api.queue.remove(index)
  },

  reorder: async (from, to) => {
    await api.queue.reorder(from, to)
  },

  clear: async () => {
    await api.queue.clear()
  },
}))