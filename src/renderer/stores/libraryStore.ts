import { create } from 'zustand'
import { api } from '@/lib/ipc'
import type { ScanProgressPayload } from '../../shared/ipc/contracts'
import type { SortDirection, SortField, Track } from '../../shared/types/domain'

interface LibraryState {
  tracks: Track[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortField: SortField
  sortDir: SortDirection
  viewMode: 'list' | 'grid'
  scanProgress: ScanProgressPayload | null
}

interface LibraryStore extends LibraryState {
  loadTracks: (query?: string) => Promise<void>
  search: (q: string) => void
  sort: (field: SortField, dir: SortDirection) => void
  toggleFavorite: (id: number) => Promise<void>
  isFavorite: (id: number) => boolean
  init: () => () => void
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  tracks: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortField: 'date_added',
  sortDir: 'desc',
  viewMode: 'list',
  scanProgress: null,

  init() {
    const c1 = api.library.onFileAdded((track) => {
      set((s) => ({ tracks: [...s.tracks, track] }))
    })
    const c2 = api.library.onFileRemoved(({ id }) => {
      set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }))
    })
    const c3 = api.library.onScanProgress((progress) => {
      set({ scanProgress: progress })
      if (progress.current === progress.total && progress.total > 0) {
        setTimeout(() => set({ scanProgress: null }), 3000)
      }
    })
    return () => { c1(); c2(); c3() }
  },

  loadTracks: async (query) => {
    set({ isLoading: true, error: null })
    try {
      const tracks = await api.library.getTracks({ 
        query: query || get().searchQuery || undefined,
        sort: get().sortField,
        dir: get().sortDir,
      })
      set({ tracks, isLoading: false })
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

  isFavorite: (id) => {
    const track = get().tracks.find(t => t.id === id)
    return track ? track.is_favorite === 1 : false
  },
}))
