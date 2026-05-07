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
  searchError: string | null
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
  searchError: null,
  downloads: [],

  init() {
    api.youtube.onDownloadProgress(({ id, progress }: { id: string; progress: number }) => {
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === id ? { ...d, progress, status: 'downloading' as const } : d
        ),
      }))
    })

    api.youtube.onDownloadDone(({ id }: { id: string }) => {
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === id ? { ...d, status: 'done' as const, progress: 100 } : d
        ),
      }))
    })

    api.youtube.onDownloadError(({ id, error }: { id: string; error: string }) => {
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === id ? { ...d, status: 'failed' as const, error } : d
        ),
      }))
    })
  },

  search: async (query) => {
    set({ isSearching: true, searchError: null })
    try {
      const results = await api.youtube.search(query)
      set({ searchResults: results, isSearching: false })
    } catch (err) {
      console.error('[youtubeStore] search failed:', err)
      set({ searchError: 'Search failed', isSearching: false })
    }
  },

  download: async (url, videoId) => {
    const item: DownloadItem = { 
      id: Date.now().toString(), 
      videoId, 
      title: 'Downloading...', 
      status: 'pending', 
      progress: 0 
    }
    set((s) => ({ downloads: [item, ...s.downloads] }))
    try {
      await api.youtube.download(url, videoId)
    } catch (err) {
      console.error('[youtubeStore] download failed:', err)
      set((s) => ({
        downloads: s.downloads.map((d) =>
          d.id === item.id ? { ...d, status: 'failed' as const, error: 'Download failed' } : d
        ),
      }))
    }
  },

  cancelDownload: async (videoId) => {
    await api.youtube.cancelDownload(videoId)
  },

  clearHistory: async () => {
    await api.youtube.clearHistory()
    set({ downloads: [] })
  },
}))