import { create } from 'zustand'
import { api } from '@/lib/ipc'
import { getToastStore } from './toastStore'
import { useLibraryStore } from './libraryStore'
import { usePlaylistStore } from './playlistStore'
import type {
  DownloadCancelledPayload,
  DownloadDonePayload,
  DownloadErrorPayload,
  DownloadProgressPayload,
  DownloadStartedPayload,
  BatchDownloadProgressPayload,
  BatchDownloadDonePayload,
  BatchDownloadErrorPayload,
  DownloadOptions,
} from '../../shared/ipc/contracts'
import type { Download as PersistedDownload, DownloadStatus, YtSearchResult } from '../../shared/types/domain'

interface DownloadItem {
  id: string
  videoId: string
  title: string
  status: DownloadStatus
  progress: number
  artist?: string | null
  trackId?: number | null
  createdAt?: string
  speed?: string
  eta?: string
  size?: string
  folder?: string
  path?: string
  error?: string
}

const DEFAULT_DOWNLOAD_SETTINGS: DownloadOptions = {
  audioFormat: 'mp3',
  audioQuality: 0,
  embedThumbnail: true,
  addMetadata: true,
}

interface YouTubeStore {
  searchResults: YtSearchResult[]
  isSearching: boolean
  searchError: string | null
  hasSearched: boolean
  lastQuery: string
  isHistoryLoading: boolean
  downloads: DownloadItem[]

  // Playlist state
  playlistInfo: YtSearchResult[] | null
  isFetchingPlaylist: boolean
  selectedVideoIds: Set<string>
  playlistUrl: string
  playlistError: string | null

  // Download settings
  downloadSettings: DownloadOptions

  // Batch download state
  batchProgress: BatchDownloadProgressPayload | null
  isBatchDownloading: boolean

  loadHistory: () => Promise<void>
  search: (query: string) => Promise<void>
  download: (url: string, videoId: string, title?: string) => Promise<void>
  cancelDownload: (videoId: string) => Promise<void>
  clearHistory: () => Promise<void>
  init: () => () => void

  // Playlist actions
  fetchPlaylist: (url: string) => Promise<void>
  toggleVideoSelection: (videoId: string) => void
  selectAllVideos: () => void
  deselectAllVideos: () => void
  downloadPlaylist: (url: string, selectedIds: string[], settings: DownloadOptions, createPlaylist?: boolean, playlistName?: string) => Promise<void>
  updateDownloadSettings: (settings: Partial<DownloadOptions>) => void
  loadDownloadSettings: () => Promise<void>
}

function mapPersistedDownload(download: PersistedDownload): DownloadItem {
  return {
    id: String(download.id),
    videoId: download.video_id,
    title: download.title,
    status: download.status,
    progress: download.progress,
    artist: download.artist,
    trackId: download.track_id,
    createdAt: download.created_at,
  }
}

export const useYouTubeStore = create<YouTubeStore>((set, get) => ({
  searchResults: [],
  isSearching: false,
  searchError: null,
  hasSearched: false,
  lastQuery: '',
  isHistoryLoading: false,
  downloads: [],

  playlistInfo: null,
  isFetchingPlaylist: false,
  selectedVideoIds: new Set(),
  playlistUrl: '',
  playlistError: null,

  downloadSettings: { ...DEFAULT_DOWNLOAD_SETTINGS },

  batchProgress: null,
  isBatchDownloading: false,

  loadHistory: async () => {
    set({ isHistoryLoading: true })
    try {
      const history = await api.youtube.getHistory()
      set((s) => ({
        downloads: history.map(mapPersistedDownload).map((download) => {
          const existing = s.downloads.find((item) => item.id === download.id)
          return existing ? { ...download, ...existing } : download
        }),
        isHistoryLoading: false,
      }))
    } catch (err) {
      console.error('[youtubeStore] failed to load history:', err)
      set({ isHistoryLoading: false })
    }
  },

  init() {
    void get().loadHistory()
    void get().loadDownloadSettings()

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

      api.youtube.onBatchProgress((payload: BatchDownloadProgressPayload) => {
        set({ batchProgress: payload })
      }),

      api.youtube.onBatchDone((payload: BatchDownloadDonePayload) => {
        set({ isBatchDownloading: false })
        const { completed, failed, total } = payload
        getToastStore().add(`Batch complete: ${completed}/${total} done${failed > 0 ? `, ${failed} failed` : ''}`, 'success')
        useLibraryStore.getState().loadTracks()
      }),

      api.youtube.onBatchError((payload: BatchDownloadErrorPayload) => {
        console.error('[youtubeStore] batch error:', payload)
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
      const started: DownloadStartedPayload = await api.youtube.download(url, videoId, title, get().downloadSettings)
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

  fetchPlaylist: async (url) => {
    set({ isFetchingPlaylist: true, playlistError: null, playlistUrl: url, selectedVideoIds: new Set() })
    try {
      const videos = await api.youtube.getPlaylistInfo(url)
      set({ playlistInfo: videos, isFetchingPlaylist: false })
      if (videos.length > 0) {
        set({ selectedVideoIds: new Set(videos.map((v) => v.videoId)) })
      }
    } catch (err) {
      console.error('[youtubeStore] playlist fetch failed:', err)
      const message = err instanceof Error ? err.message : 'Failed to fetch playlist'
      set({ playlistInfo: null, isFetchingPlaylist: false, playlistError: message })
    }
  },

  toggleVideoSelection: (videoId) => {
    set((s) => {
      const next = new Set(s.selectedVideoIds)
      if (next.has(videoId)) {
        next.delete(videoId)
      } else {
        next.add(videoId)
      }
      return { selectedVideoIds: next }
    })
  },

  selectAllVideos: () => {
    const { playlistInfo } = get()
    if (!playlistInfo) return
    set({ selectedVideoIds: new Set(playlistInfo.map((v) => v.videoId)) })
  },

  deselectAllVideos: () => {
    set({ selectedVideoIds: new Set() })
  },

  downloadPlaylist: async (url, selectedIds, settings, createPlaylist, playlistName) => {
    if (selectedIds.length === 0) {
      getToastStore().add('No videos selected', 'error')
      return
    }

    const { playlistInfo } = get()
    if (!playlistInfo) return

    const selectedVideos = playlistInfo.filter((v) => selectedIds.includes(v.videoId))
    const urls = selectedVideos.map((v) => `https://youtube.com/watch?v=${v.videoId}`)

    set({ isBatchDownloading: true, batchProgress: null })

    try {
      await api.youtube.downloadBatch(urls, settings, url)

      if (createPlaylist && playlistName) {
        // Wait a moment for downloads to complete and tracks to be scanned
        setTimeout(async () => {
          try {
            await useLibraryStore.getState().loadTracks()
            const allTracks = useLibraryStore.getState().tracks
            const trackIds: number[] = []

            // Find tracks that match the downloaded files by title similarity
            for (const video of selectedVideos) {
              const match = allTracks.find((t) =>
                t.title.toLowerCase().includes(video.title.toLowerCase().slice(0, 20)) ||
                video.title.toLowerCase().includes(t.title.toLowerCase().slice(0, 20))
              )
              if (match) trackIds.push(match.id)
            }

            if (trackIds.length > 0) {
              const newPlaylist = await api.playlist.create(playlistName, `Imported from YouTube playlist`)
              await api.playlist.addTracks(newPlaylist.id, trackIds)
              await usePlaylistStore.getState().loadPlaylists()
              getToastStore().add(`Created playlist "${playlistName}" with ${trackIds.length} tracks`, 'success')
            }
          } catch (err) {
            console.error('[youtubeStore] auto-playlist creation failed:', err)
          }
        }, 2000)
      }
    } catch (err) {
      console.error('[youtubeStore] batch download failed:', err)
      const message = err instanceof Error ? err.message : 'Batch download failed'
      getToastStore().add(message, 'error')
      set({ isBatchDownloading: false })
    }
  },

  updateDownloadSettings: (settings) => {
    set((s) => {
      const next = { ...s.downloadSettings, ...settings }
      api.settings.set('youtube_download_settings', JSON.stringify(next)).catch(() => {})
      return { downloadSettings: next }
    })
  },

  loadDownloadSettings: async () => {
    try {
      const raw = await api.settings.get('youtube_download_settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        set({ downloadSettings: { ...DEFAULT_DOWNLOAD_SETTINGS, ...parsed } })
      }
    } catch (err) {
      console.error('[youtubeStore] failed to load download settings:', err)
    }
  },
}))
