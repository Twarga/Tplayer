import { create } from 'zustand'
import { api } from '@/lib/ipc'
import type { QueueEntry } from '../../shared/types/playback'

interface QueueState {
  queue: QueueEntry[]
  history: QueueEntry[]
  isLoading: boolean
}

interface QueueStore extends QueueState {
  init: () => () => void
  loadQueue: () => Promise<void>
  add: (trackId: number) => Promise<void>
  addNext: (trackId: number) => Promise<void>
  set: (trackIds: number[]) => Promise<void>
  remove: (index: number) => Promise<void>
  reorder: (from: number, to: number) => Promise<void>
  clear: () => Promise<void>
}

export const useQueueStore = create<QueueStore>((set) => ({
  queue: [],
  history: [],
  isLoading: false,

  init() {
    const c = api.queue.onUpdated((tracks) => {
      set({ queue: tracks })
    })
    return () => c()
  },

  loadQueue: async () => {
    const tracks = await api.queue.get()
    set({ queue: tracks })
  },

  add: async (trackId) => {
    await api.queue.add(trackId)
  },

  addNext: async (trackId) => {
    await api.queue.addNext(trackId)
  },

  set: async (trackIds) => {
    await api.queue.set(trackIds)
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
