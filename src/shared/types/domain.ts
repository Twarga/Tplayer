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
  bit_depth?: number | null
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

export interface Playlist {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  track_count?: number
}

export interface PlaylistTrack {
  playlist_id: number
  track_id: number
  position: number
  added_at: string
}

export interface Cover {
  album: string
  artist: string
  image_blob: Buffer | null
  mime_type: string
}

export type DownloadStatus = 'pending' | 'downloading' | 'done' | 'failed'

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

export interface EqualizerBand {
  frequency: number
  gain: number
}

export interface EQPreset {
  name: string
  bands: number[]
}

export interface AudioQuality {
  format: string
  bitDepth: number | null
  sampleRate: number | null
  bitrate: number | null
  isLossless: boolean
}

export interface YtSearchResult {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
}

export type Theme = 'dark' | 'light'
export type SortField = 'title' | 'artist' | 'album' | 'date_added' | 'play_count' | 'duration'
export type SortDirection = 'asc' | 'desc'
export type AppView = 'home' | 'library' | 'playlist' | 'youtube' | 'equalizer' | 'settings'
