import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: number
}

interface QueueState {
  queue: Track[]
  history: Track[]
  isLoading: boolean
}

interface QueueStore extends QueueState {
  loadQueue: () => Promise<void>
  add: (trackId: number) => Promise<void>
  addNext: (trackId: number) => Promise<void>
  remove: (index: number) => Promise<void>
  reorder: (from: number, to: number) => Promise<void>
  clear: () => Promise<void>
}

export const useQueueStore = create<QueueStore>((set) => ({
  queue: [],
  history: [],
  isLoading: false,

  loadQueue: async () => {
    // Queue is managed in main process, we fetch track details
    const queueIds = await api.queue.get()
    if (!queueIds.length) {
      set({ queue: [] })
      return
    }
    // Fetch track details for each ID
    const tracks: Track[] = []
    for (const id of queueIds) {
      try {
        const track = await api.library.getTrack(id)
        if (track) tracks.push(track as Track)
      } catch { /* skip missing */ }
    }
    set({ queue: tracks })
  },

  add: async (trackId) => {
    await api.queue.add(trackId)
    const track = await api.library.getTrack(trackId)
    if (track) {
      set((s) => ({ queue: [...s.queue, track as Track] }))
    }
  },

  addNext: async (trackId) => {
    await api.queue.addNext(trackId)
    const track = await api.library.getTrack(trackId)
    if (track) {
      set((s) => ({ queue: [track as Track, ...s.queue] }))
    }
  },

  remove: async (index) => {
    await api.queue.remove(index)
    set((s) => ({ queue: s.queue.filter((_, i) => i !== index) }))
  },

  reorder: async (from, to) => {
    await api.queue.reorder(from, to)
    set((s) => {
      const newQueue = [...s.queue]
      const [item] = newQueue.splice(from, 1)
      newQueue.splice(to, 0, item)
      return { queue: newQueue }
    })
  },

  clear: async () => {
    await api.queue.clear()
    set({ queue: [] })
  },
}))