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
  PlaybackStatePayload,
  QueueEntry,
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
    onBatchAdded: (callback: (data: { count: number }) => void) => () => void
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
    seek: (time: number) => Promise<void>
    setVolume: (volume: number) => Promise<void>
    toggleShuffle: () => Promise<void>
    toggleRepeat: () => Promise<void>
    onPlaybackState: (callback: (data: PlaybackStatePayload) => void) => () => void
    onTimeUpdate: (callback: (data: TimeUpdatePayload) => void) => () => void
    onLoad: (callback: (data: TrackLoadPayload) => void) => () => void
    onSeekTo: (callback: (data: { time: number }) => void) => () => void
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
    download: (url: string, videoId: string) => Promise<void>
    cancelDownload: (videoId: string) => Promise<void>
    getHistory: () => Promise<Download[]>
    clearHistory: () => Promise<void>
    onDownloadProgress: (callback: (data: DownloadProgressPayload) => void) => () => void
    onDownloadDone: (callback: (data: DownloadDonePayload) => void) => () => void
    onDownloadError: (callback: (data: DownloadErrorPayload) => void) => () => void
    onDownloadStarted: (callback: (data: { id: string; videoId: string; folder: string }) => void) => () => void
    onDownloadCancelled: (callback: (data: { videoId: string }) => void) => () => void
    onHistoryCleared: (callback: () => void) => () => void
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
    checkYtDlp: () => Promise<boolean>
    log?: (...args: unknown[]) => void
  }
}
