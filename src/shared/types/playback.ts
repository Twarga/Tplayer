import type { Track } from './domain'

export type RepeatMode = 'off' | 'all' | 'one'
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

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

export interface PlaybackStatePayload {
  state: PlaybackState
  trackId: number | null
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: RepeatMode
}

export interface TimeUpdatePayload {
  current: number
  duration: number
}

export interface TrackLoadPayload {
  id: number
  trackId: number
  title: string
  artist: string
  album: string
  duration: number
  url: string
  cover_path?: string | null
  file_format?: string | null
  bitrate?: number | null
  sample_rate?: number | null
  bit_depth?: number | null
  is_favorite?: number
  startTime?: number
}

export interface QueueEntry {
  id: number
  title: string
  artist: string
  album: string
  duration: number
}
