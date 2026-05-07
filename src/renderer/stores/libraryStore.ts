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
  error: string | null
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

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortField: 'date_added',
  sortDir: 'desc',
  viewMode: 'list',

  init() {
    api.library.onFileAdded((track) => {
      set((s) => ({ tracks: [...s.tracks, track as Track] }))
    })
    api.library.onFileRemoved(({ id }) => {
      set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }))
    })
  },

  loadTracks: async (query) => {
    set({ isLoading: true, error: null })
    try {
      const tracks = await api.library.getTracks({ 
        query: query || get().searchQuery || undefined,
        sort: get().sortField,
        dir: get().sortDir,
      })
      set({ tracks: tracks as Track[], isLoading: false })
    } catch (err) {
      console.error('[libraryStore] loadTracks failed:', err)
      set({ error: 'Failed to load tracks', isLoading: false })
    }
  },

  search(q) {
    set({ searchQuery: q })
    // Auto-load with new query
    get().loadTracks(q)
  },

  sort(field, dir) {
    set({ sortField: field, sortDir: dir })
    get().loadTracks()
  },

  toggleFavorite: async (id) => {
    await api.library.toggleFavorite(id)
    // Refresh to get updated state
    get().loadTracks()
  },
}))