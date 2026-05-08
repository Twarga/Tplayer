import { create } from 'zustand'
import { api } from '@/lib/ipc'
import { getToastStore } from './toastStore'
import { useLibraryStore } from './libraryStore'
import type {
  DownloadCancelledPayload,
  DownloadDonePayload,
  DownloadErrorPayload,
  DownloadProgressPayload,
  DownloadStartedPayload,
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
      api.youtube.onDownloadStarted(({ id, videoId, folder, title }) => {
        set((s) => ({
          downloads: s.downloads.some((d) => d.id === id)
            ? s.downloads.map((d) =>
                d.id === id ? { ...d, videoId, title, status: 'downloading' as const, folder } : d
              )
            : [{ id, videoId, title, status: 'downloading', progress: 0, folder }, ...s.downloads],
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

      api.youtube.onDownloadCancelled(({ id, videoId, error }: DownloadCancelledPayload) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.videoId === videoId || (id && d.id === id) ? { ...d, status: 'failed' as const, error } : d
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
      const message = err instanceof Error ? err.message : 'Search failed'
      set({ searchError: message, isSearching: false })
    }
  },

  download: async (url, videoId, title) => {
    try {
      const started: DownloadStartedPayload = await api.youtube.download(url, videoId, title)
      set((s) => ({
        downloads: [
          {
            id: started.id,
            videoId: started.videoId,
            title: started.title,
            status: started.status,
            progress: 0,
            folder: started.folder,
          },
          ...s.downloads.filter((d) => d.id !== started.id),
        ],
      }))
    } catch (err) {
      console.error('[youtubeStore] download failed:', err)
      const message = err instanceof Error ? err.message : 'Download failed'
      getToastStore().add(message, 'error')
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
