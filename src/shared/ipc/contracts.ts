import type {
  Cover,
  Download,
  Playlist,
  SortDirection,
  SortField,
  Track,
  YtSearchResult,
} from '../types/domain'
import type {
  PlaybackProgressPayload,
  PlaybackStatePayload,
  QueueEntry,
  SeekPayload,
  TimeUpdatePayload,
  TrackLoadPayload,
} from '../types/playback'

export interface ScanResult {
  added: number
  updated: number
  total: number
}

export interface ScanProgressPayload {
  current: number
  total: number
  file: string
  processed: number
  path: string
}

export interface DownloadProgressPayload {
  id: string
  videoId: string
  progress: number
  speed: string
  eta: string
  size: string
}

export interface DownloadStartedPayload {
  id: string
  videoId: string
  title: string
  folder: string
  status: 'downloading'
}

export interface PlaylistVideoInfo {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
}

export interface DownloadOptions {
  audioFormat: 'mp3' | 'm4a' | 'flac' | 'wav' | 'opus'
  audioQuality: number
  embedThumbnail: boolean
  addMetadata: boolean
  outputDir?: string
}

export interface BatchDownloadProgressPayload {
  playlistUrl: string
  completed: number
  total: number
  currentVideoId: string
  currentTitle: string
  currentProgress: number
}

export interface BatchDownloadDonePayload {
  playlistUrl: string
  completed: number
  failed: number
  total: number
}

export interface BatchDownloadErrorPayload {
  playlistUrl: string
  videoId: string
  error: string
}

export interface DownloadDonePayload {
  id: string
  videoId: string
  trackId: number | null
  path?: string
  title?: string
}

export interface DownloadErrorPayload {
  id: string
  videoId: string
  error: string
}

export interface DownloadCancelledPayload {
  id: string | null
  videoId: string
  error: string
}

export interface ToolAvailabilityPayload {
  available: boolean
  path: string
  source: 'settings' | 'bundled' | 'system' | 'fallback'
  error?: string
}

export interface GetTracksOptions {
  query?: string
  sort?: SortField | string
  dir?: SortDirection | string
  limit?: number
  offset?: number
}

export interface TplayerAPI {
  library: {
    scan: (folders: string[]) => Promise<ScanResult>
    getTracks: (opts?: GetTracksOptions) => Promise<Track[]>
    getTrack: (id: number) => Promise<Track | null>
    toggleFavorite: (id: number) => Promise<void>
    getCovers: (albums: string[]) => Promise<Cover[]>
    getDownloads: () => Promise<Download[]>
    onFileAdded: (callback: (track: Track) => void) => () => void
    onFileRemoved: (callback: (data: { id: number }) => void) => () => void
    onScanProgress: (callback: (data: ScanProgressPayload) => void) => () => void
    onBatchAdded: (callback: (data: { count: number; tracks: Track[] }) => void) => () => void
  }
  player: {
    play: (trackId: number) => Promise<void>
    pause: () => Promise<void>
    resume: () => Promise<void>
    togglePlay: () => Promise<void>
    next: () => Promise<void>
    prev: () => Promise<void>
    trackEnded: () => Promise<void>
    recordPlay: (trackId: number) => Promise<void>
    syncProgress: (payload: PlaybackProgressPayload) => Promise<void>
    seek: (time: number) => Promise<void>
    setVolume: (volume: number) => Promise<void>
    toggleShuffle: () => Promise<void>
    toggleRepeat: () => Promise<void>
    onPlaybackState: (callback: (data: PlaybackStatePayload) => void) => () => void
    onTimeUpdate: (callback: (data: TimeUpdatePayload) => void) => () => void
    onLoad: (callback: (data: TrackLoadPayload) => void) => () => void
    onSeekTo: (callback: (data: SeekPayload) => void) => () => void
  }
  queue: {
    add: (trackId: number) => Promise<void>
    addNext: (trackId: number) => Promise<void>
    set: (trackIds: number[]) => Promise<void>
    remove: (index: number) => Promise<void>
    reorder: (from: number, to: number) => Promise<void>
    clear: () => Promise<void>
    get: () => Promise<QueueEntry[]>
    onUpdated: (callback: (queue: QueueEntry[]) => void) => () => void
  }
  playlist: {
    list: () => Promise<Playlist[]>
    create: (name: string, desc?: string) => Promise<Playlist>
    delete: (id: number) => Promise<void>
    rename: (id: number, name: string) => Promise<void>
    getTracks: (id: number) => Promise<Track[]>
    addTracks: (playlistId: number, trackIds: number[]) => Promise<void>
    removeTrack: (playlistId: number, trackId: number) => Promise<void>
    reorder: (playlistId: number, fromPos: number, toPos: number) => Promise<void>
  }
  youtube: {
    search: (query: string) => Promise<YtSearchResult[]>
    getPlaylistInfo: (url: string) => Promise<PlaylistVideoInfo[]>
    download: (url: string, videoId: string, title?: string, options?: DownloadOptions) => Promise<DownloadStartedPayload>
    downloadBatch: (urls: string[], options: DownloadOptions, playlistUrl?: string) => Promise<void>
    cancelDownload: (videoId: string) => Promise<DownloadCancelledPayload>
    getHistory: () => Promise<Download[]>
    clearHistory: () => Promise<void>
    onDownloadProgress: (callback: (data: DownloadProgressPayload) => void) => () => void
    onDownloadDone: (callback: (data: DownloadDonePayload) => void) => () => void
    onDownloadError: (callback: (data: DownloadErrorPayload) => void) => () => void
    onDownloadStarted: (callback: (data: DownloadStartedPayload) => void) => () => void
    onDownloadCancelled: (callback: (data: DownloadCancelledPayload) => void) => () => void
    onHistoryCleared: (callback: () => void) => () => void
    onBatchProgress: (callback: (data: BatchDownloadProgressPayload) => void) => () => void
    onBatchDone: (callback: (data: BatchDownloadDonePayload) => void) => () => void
    onBatchError: (callback: (data: BatchDownloadErrorPayload) => void) => () => void
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    getAll: () => Promise<Record<string, string>>
    getFolders: () => Promise<string[]>
    addFolder: (path: string) => Promise<void>
    removeFolder: (path: string) => Promise<void>
    openFolderDialog: () => Promise<string | null>
  }
  eq: {
    setBands: (bands: number[]) => Promise<void>
    setPreset: (preset: string) => Promise<number[]>
    enable: (enabled: boolean) => Promise<void>
    getEnabled: () => Promise<boolean>
    onBandsChanged: (callback: (bands: number[]) => void) => () => void
  }
  lastfm: {
    auth: (apiKey: string, secret?: string) => Promise<string>
    isAuthd: () => Promise<boolean>
    disconnect: () => Promise<void>
    nowPlaying: (artist: string, track: string, album?: string) => Promise<void>
    scrobble: (artist: string, track: string, album?: string, timestamp?: number) => Promise<void>
  }
  system: {
    checkFfmpeg: () => Promise<boolean>
    checkYtDlp: () => Promise<ToolAvailabilityPayload>
    log?: (...args: unknown[]) => void
  }
}
