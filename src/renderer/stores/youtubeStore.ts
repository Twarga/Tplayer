import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface YtSearchResult {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
}

interface DownloadItem {
  id: string
  videoId: string
  title: string
  status: 'pending' | 'downloading' | 'done' | 'failed'
  progress: number
  error?: string
}

interface YouTubeStore {
  searchResults: YtSearchResult[]
  isSearching: boolean
  downloads: DownloadItem[]
  search: (query: string) => Promise<void>
  download: (url: string, videoId: string) => Promise<void>
  cancelDownload: (videoId: string) => Promise<void>
  clearHistory: () => Promise<void>
  init: () => void
}

export const useYouTubeStore = create<YouTubeStore>((set) => ({
  searchResults: [],
  isSearching: false,
  downloads: [],

  init() {
    api.youtube.onDownloadProgress(({ id, videoId, progress }) => {
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === id ? { ...d, progress, status: 'downloading' } : d
        ),
      }))
    })

    api.youtube.onDownloadDone(({ id, trackId }) => {
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === id ? { ...d, status: 'done', progress: 100 } : d
        ),
      }))
    })

    api.youtube.onDownloadError(({ id, error }) => {
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === id ? { ...d, status: 'failed', error } : d
        ),
      }))
    })
  },

  search: async (query) => {
    set({ isSearching: true })
    const results = await api.youtube.search(query)
    set({ searchResults: results, isSearching: false })
  },

  download: async (url, videoId) => {
    const item: DownloadItem = { id: Date.now().toString(), videoId, title: 'Downloading...', status: 'pending', progress: 0 }
    set((s) => ({ downloads: [...s.downloads, item] }))
    await api.youtube.download(url, videoId)
  },

  cancelDownload: async (videoId) => {
    await api.youtube.cancelDownload(videoId)
  },

  clearHistory: async () => {
    await api.youtube.clearHistory()
    set({ searchResults: [] })
  },
}))