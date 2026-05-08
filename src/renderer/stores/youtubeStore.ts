import { create } from 'zustand'
import { api } from '@/lib/ipc'
import { getToastStore } from './toastStore'
import { useLibraryStore } from './libraryStore'
import type {
  DownloadDonePayload,
  DownloadErrorPayload,
  DownloadProgressPayload,
} from '../../shared/ipc/contracts'
import type { YtSearchResult } from '../../shared/types/domain'

interface DownloadItem {
  id: string
  videoId: string
  title: string
  status: 'pending' | 'downloading' | 'done' | 'failed'
  progress: number
  speed?: string
  eta?: string
  size?: string
  folder?: string
  path?: string
  error?: string
}

interface YouTubeStore {
  searchResults: YtSearchResult[]
  isSearching: boolean
  searchError: string | null
  downloads: DownloadItem[]
  search: (query: string) => Promise<void>
  download: (url: string, videoId: string, title?: string) => Promise<void>
  cancelDownload: (videoId: string) => Promise<void>
  clearHistory: () => Promise<void>
  init: () => () => void
}

export const useYouTubeStore = create<YouTubeStore>((set) => ({
  searchResults: [],
  isSearching: false,
  searchError: null,
  downloads: [],

  init() {
    const cleanups = [
      api.youtube.onDownloadStarted(({ id, folder }) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.id === id ? { ...d, status: 'downloading' as const, folder } : d
          ),
        }))
      }),

      api.youtube.onDownloadProgress(({ id, progress, speed, eta, size }: DownloadProgressPayload) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.id === id ? { ...d, progress, speed, eta, size, status: 'downloading' as const } : d
          ),
        }))
      }),

      api.youtube.onDownloadDone(({ id, title, path }: DownloadDonePayload) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.id === id ? { ...d, status: 'done' as const, progress: 100, title: title || d.title, path } : d
          ),
        }))
        getToastStore().add(`Download complete: ${title || 'Track'}`, 'success')
        useLibraryStore.getState().loadTracks()
      }),

      api.youtube.onDownloadError(({ id, error }: DownloadErrorPayload) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.id === id ? { ...d, status: 'failed' as const, error } : d
          ),
        }))
        getToastStore().add(`Download failed: ${error}`, 'error')
      }),

      api.youtube.onDownloadCancelled(({ videoId }: { videoId: string }) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.videoId === videoId ? { ...d, status: 'failed' as const, error: 'Cancelled' } : d
          ),
        }))
      })
    ]
    return () => cleanups.forEach(c => c())
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

  download: async (url, videoId, title) => {
    const item: DownloadItem = {
      id: Date.now().toString(),
      videoId,
      title: title || 'Downloading...',
      status: 'pending',
      progress: 0,
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
