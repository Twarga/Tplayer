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
import type { Download as PersistedDownload, DownloadStatus, YtSearchResult } from '../../shared/types/domain'

interface DownloadItem {
  id: string
  videoId: string
  title: string
  status: DownloadStatus
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
  hasSearched: boolean
  lastQuery: string
  downloads: DownloadItem[]
  search: (query: string) => Promise<void>
  download: (url: string, videoId: string, title?: string) => Promise<void>
  cancelDownload: (videoId: string) => Promise<void>
  clearHistory: () => Promise<void>
  init: () => () => void
}

function mapPersistedDownload(download: PersistedDownload): DownloadItem {
  return {
    id: String(download.id),
    videoId: download.video_id,
    title: download.title,
    status: download.status,
    progress: download.progress,
  }
}

export const useYouTubeStore = create<YouTubeStore>((set, get) => ({
  searchResults: [],
  isSearching: false,
  searchError: null,
  hasSearched: false,
  lastQuery: '',
  downloads: [],

  init() {
    void api.youtube.getHistory()
      .then((history) => {
        set((s) => ({
          downloads: history.map(mapPersistedDownload).map((download) => {
            const existing = s.downloads.find((item) => item.id === download.id)
            return existing ? { ...download, ...existing } : download
          }),
        }))
      })
      .catch((err) => {
        console.error('[youtubeStore] failed to load history:', err)
      })

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
            d.id === id ? { ...d, status: 'done' as const, progress: 100, title: title || d.title, path, error: undefined } : d
          ),
        }))
        getToastStore().add(`Download complete: ${title || 'Track'}`, 'success')
        useLibraryStore.getState().loadTracks()
      }),

      api.youtube.onDownloadError(({ id, error }: DownloadErrorPayload) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.id === id ? { ...d, status: 'failed' as const, error, speed: undefined, eta: undefined } : d
          ),
        }))
        getToastStore().add(`Download failed: ${error}`, 'error')
      }),

      api.youtube.onDownloadCancelled(({ id, videoId, error }: DownloadCancelledPayload) => {
        set((s) => ({
          downloads: s.downloads.map((d) =>
            d.videoId === videoId || (id && d.id === id)
              ? { ...d, status: 'cancelled' as const, error, speed: undefined, eta: undefined }
              : d
          ),
        }))
      }),

      api.youtube.onHistoryCleared(() => {
        set({ downloads: [] })
      }),
    ]
    return () => cleanups.forEach(c => c())
  },

  search: async (query) => {
    const trimmed = query.trim()
    if (!trimmed) {
      set({
        searchResults: [],
        isSearching: false,
        searchError: null,
        hasSearched: false,
        lastQuery: '',
      })
      return
    }

    set({ isSearching: true, searchError: null, hasSearched: true, lastQuery: trimmed })
    try {
      const results = await api.youtube.search(trimmed)
      set({ searchResults: results, isSearching: false })
    } catch (err) {
      console.error('[youtubeStore] search failed:', err)
      const message = err instanceof Error ? err.message : 'Search failed'
      set({ searchResults: [], searchError: message, isSearching: false })
    }
  },

  download: async (url, videoId, title) => {
    const existing = get().downloads.find((item) => item.videoId === videoId && item.status === 'downloading')
    if (existing) {
      getToastStore().add(`Already downloading: ${existing.title}`, 'error')
      return
    }

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
          ...s.downloads.filter((d) => d.id !== started.id && d.videoId !== started.videoId),
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
