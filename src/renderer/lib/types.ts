// Track — main music library item
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
  file_size: number | null
  file_format: string | null
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

// Playlist
export interface Playlist {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  track_count?: number
}

// Playlist track junction entry
export interface PlaylistTrack {
  playlist_id: number
  track_id: number
  position: number
  added_at: string
}

// Queue entry
export type QueueEntry = Track & { queue_index: number }

// Playback state machine
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

// YouTube search result
export interface YtSearchResult {
  videoId: string
  title: string
  channel: string
  duration: number
  thumbnail: string
}

// Download status
export type DownloadStatus = 'pending' | 'downloading' | 'done' | 'failed'

// Download entry
export interface Download {
  id: number
  url: string
  video_id: string
  title: string
  artist: string | null
  status: DownloadStatus
  progress: number
  track_id: number | null
  created_at: string
}

// Equalizer band
export interface EqualizerBand {
  frequency: number
  gain: number
}

// Theme
export type Theme = 'dark' | 'light'

// Sort field options
export type SortField = 'title' | 'artist' | 'album' | 'date_added' | 'play_count' | 'duration'

// Sort direction
export type SortDirection = 'asc' | 'desc'

// Audio quality info
export interface AudioQuality {
  format: string
  bitDepth: number | null
  sampleRate: number | null
  bitrate: number | null
  isLossless: boolean
}

// App views
export type AppView = 'home' | 'library' | 'playlist' | 'youtube' | 'equalizer' | 'settings'

// Repeat modes
export type RepeatMode = 'off' | 'all' | 'one'

// EQ preset
export interface EQPreset {
  name: string
  bands: number[]
}

// Player state (for IPC events)
export interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: RepeatMode
  playbackState: PlaybackState
}

// Library scan result
export interface ScanResult {
  added: number
  updated: number
  total: number
}

// Cover art
export interface Cover {
  album: string
  artist: string
  image_blob: Buffer | null
  mime_type: string
}

// Settings
export interface Settings {
  music_folders: string[]
  theme: Theme
  accent_color: string
  volume: number
  eq_enabled: boolean
  eq_bands: number[]
  lastfm_api_key: string
  lastfm_session_key: string
  scan_on_startup: boolean
  close_to_tray: boolean
  show_mini_player: boolean
}

// IPC API type for preload script
export interface TplayerAPI {
  library: {
    scan: (folders: string[]) => Promise<ScanResult>
    getTracks: (opts?: { query?: string; sort?: SortField; dir?: SortDirection; limit?: number; offset?: number }) => Promise<Track[]>
    getTrack: (id: number) => Promise<Track | null>
    toggleFavorite: (id: number) => Promise<void>
    onFileAdded: (cb: (track: Track) => void) => () => void
    onFileRemoved: (cb: (data: { id: number }) => void) => () => void
    onScanProgress: (cb: (data: { current: number; total: number; file: string }) => void) => () => void
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
    onStateChange: (cb: (state: PlaybackState) => void) => () => void
    onTimeUpdate: (cb: (data: { current: number; duration: number }) => void) => () => void
    onTrackChange: (cb: (track: Track | null) => void) => () => void
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
  queue: {
    add: (trackId: number) => Promise<void>
    addNext: (trackId: number) => Promise<void>
    remove: (index: number) => Promise<void>
    reorder: (from: number, to: number) => Promise<void>
    clear: () => Promise<void>
    get: () => Promise<QueueEntry[]>
    onUpdated: (cb: (queue: QueueEntry[]) => void) => () => void
  }
  youtube: {
    search: (query: string) => Promise<YtSearchResult[]>
    download: (url: string, videoId: string) => Promise<void>
    cancelDownload: (videoId: string) => Promise<void>
    getHistory: () => Promise<Download[]>
    clearHistory: () => Promise<void>
    onProgress: (cb: (data: { videoId: string; progress: number }) => void) => () => void
    onDone: (cb: (data: { videoId: string; trackId: number }) => void) => () => void
    onError: (cb: (data: { videoId: string; error: string }) => void) => () => void
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
    auth: (apiKey: string) => Promise<string>
    isAuthd: () => Promise<boolean>
    disconnect: () => Promise<void>
    nowPlaying: (artist: string, track: string, album?: string) => Promise<void>
    scrobble: (artist: string, track: string, album?: string, timestamp?: number) => Promise<void>
  }
}

// Extend window type
declare global {
  interface Window {
    tplayerAPI: TplayerAPI
  }
}
