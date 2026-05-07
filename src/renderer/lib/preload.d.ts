export interface YtSearchResult {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
}

export interface PlaybackStatePayload {
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'error'
  trackId: number | null
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: 'off' | 'all' | 'one'
}

export interface Track {
  id: number
  file_path: string
  title: string
  artist: string
  album: string
  album_artist: string | null
  track_number: number | null
  disc_number: number | null
  year: number | null
  genre: string | null
  duration: number
  bitrate: number | null
  sample_rate: number | null
  file_size: number
  file_format: string
  has_cover: number
  cover_path: string | null
  date_added: string
  play_count: number
  skip_count: number
  last_played: string | null
  is_favorite: number
  rating: number
  bpm: number | null
  color_palette: string | null
}

export interface Playlist {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  track_count?: number
}

export interface TrackLoadPayload {
  trackId: number
  title: string
  artist: string
  album: string
  duration: number
  pcmData: Float32Array
  sampleRate: number
  channels: number
}

export interface TimeUpdatePayload {
  current: number
  duration: number
}

export interface QueueEntry {
  trackId: number
  title: string
  artist: string
  album: string
  duration: number
}

export interface DownloadProgressPayload {
  id: string
  videoId: string
  progress: number
}

export interface DownloadDonePayload {
  id: string
  trackId: number | null
  path?: string
}

export interface DownloadErrorPayload {
  id: string
  error: string
}

export interface ScanProgressPayload {
  current: number
  total: number
  file: string
}

export interface TplayerAPI {
  library: {
    scan: (folders: string[]) => Promise<{ added: number; updated: number; total: number }>
    getTracks: (opts?: { query?: string; sort?: string; dir?: string; limit?: number; offset?: number }) => Promise<Track[]>
    getTrack: (id: number) => Promise<Track | null>
    toggleFavorite: (id: number) => Promise<void>
    getCovers: (albums: string[]) => Promise<Array<{ album: string; artist: string; image_blob: Buffer; mime_type: string }>>
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
    seek: (time: number) => Promise<void>
    setVolume: (volume: number) => Promise<void>
    toggleShuffle: () => Promise<void>
    toggleRepeat: () => Promise<void>
    onPlaybackState: (callback: (data: PlaybackStatePayload) => void) => () => void
    onTimeUpdate: (callback: (data: TimeUpdatePayload) => void) => () => void
    onLoad: (callback: (data: TrackLoadPayload) => void) => () => void
    onEnded: (callback: () => void) => () => void
  }
  queue: {
    add: (trackId: number) => Promise<void>
    addNext: (trackId: number) => Promise<void>
    remove: (index: number) => Promise<void>
    reorder: (from: number, to: number) => Promise<void>
    clear: () => Promise<void>
    get: () => Promise<number[]>
    onUpdated: (callback: (queue: number[]) => void) => () => void
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
    getHistory: () => Promise<unknown[]>
    clearHistory: () => Promise<void>
    onDownloadProgress: (callback: (data: DownloadProgressPayload) => void) => () => void
    onDownloadDone: (callback: (data: DownloadDonePayload) => void) => () => void
    onDownloadError: (callback: (data: DownloadErrorPayload) => void) => () => void
    onDownloadStarted: (callback: (data: { id: string; videoId: string }) => void) => () => void
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
  }
  lastfm: {
    auth: (apiKey: string, secret?: string) => Promise<string>
    isAuthd: () => Promise<boolean>
    disconnect: () => Promise<void>
    nowPlaying: (artist: string, track: string, album?: string) => Promise<void>
    scrobble: (artist: string, track: string, album?: string, timestamp?: number) => Promise<void>
  }
}

declare global {
  interface Window {
    tplayerAPI: TplayerAPI
  }
}