import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: number
}

interface LibraryState {
  tracks: Track[]
  isLoading: boolean
  searchQuery: string
  sortField: string
  sortDir: 'asc' | 'desc'
  viewMode: 'list' | 'grid'
}

interface LibraryStore extends LibraryState {
  loadTracks: (query?: string) => Promise<void>
  search: (q: string) => void
  sort: (field: string, dir: 'asc' | 'desc') => void
  toggleFavorite: (id: number) => Promise<void>
  init: () => void
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  tracks: [],
  isLoading: false,
  searchQuery: '',
  sortField: 'title',
  sortDir: 'asc',

  init() {
    api.library.onFileAdded((track) => {
      set((s) => ({ tracks: [...s.tracks, track] }))
    })
    api.library.onFileRemoved(({ id }) => {
      set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }))
    })
  },

  loadTracks: async (query) => {
    set({ isLoading: true })
    const tracks = await api.library.getTracks({ query })
    set({ tracks, isLoading: false })
  },

  search(q) {
    set({ searchQuery: q })
  },

  sort(field, dir) {
    set({ sortField: field, sortDir: dir })
  },

  toggleFavorite: async (id) => {
    await api.library.toggleFavorite(id)
  },
}))