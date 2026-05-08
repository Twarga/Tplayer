import { getDb } from './database'

import { send } from './ipc-registry'
import { updateMprisPlayingState, updateMprisMeta } from './mpris'
import { updateNowPlaying, scrobble } from './lastfm'
import { IPC_CHANNELS } from '../shared/ipc/channels'
import type {
  PlaybackProgressPayload,
  PlaybackState,
  PlaybackStatePayload,
  QueueEntry,
  RepeatMode,
  TimeUpdatePayload,
  TrackLoadPayload,
} from '../shared/types/playback'
import type { Track } from '../shared/types/domain'

interface PlayerState {
  currentTrackId: number | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: RepeatMode
  playbackState: PlaybackState
}

let _state: PlayerState = {
  currentTrackId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isShuffled: false,
  repeatMode: 'off',
  playbackState: 'idle',
}

let _queue: number[] = []
let _unshuffledQueue: number[] = []
let _history: number[] = []
const MAX_HISTORY = 50



function getTrack(id: number): Track | undefined {
  return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined
}

function emitQueueUpdated(): void {
  const db = getDb()
  const list: QueueEntry[] = []
  for (const id of _queue) {
    const t = db.prepare('SELECT id, title, artist, album, duration FROM tracks WHERE id = ?').get(id) as QueueEntry | undefined
    if (t) list.push(t)
  }
  send(IPC_CHANNELS.queue.updated, list)
}

function emitPlaybackState(): void {
  const payload: PlaybackStatePayload = {
    state: _state.playbackState,
    trackId: _state.currentTrackId,
    currentTime: _state.currentTime,
    duration: _state.duration,
    volume: _state.volume,
    isShuffled: _state.isShuffled,
    repeatMode: _state.repeatMode,
  }
  send(IPC_CHANNELS.player.playbackState, payload)
}

function emitTimeUpdate(): void {
  const payload: TimeUpdatePayload = {
    current: _state.currentTime,
    duration: _state.duration,
  }
  send(IPC_CHANNELS.player.timeUpdate, payload)
}

export async function playTrack(trackId: number): Promise<void> {
  _state.playbackState = 'loading'
  emitPlaybackState()

  const track = getTrack(trackId)
  if (!track) {
    _state.playbackState = 'error'
    emitPlaybackState()
    return
  }

  try {
    _state.currentTrackId = trackId
    _state.duration = track.duration
    _state.currentTime = 0
    _state.isPlaying = true
    _state.playbackState = 'playing'

    if (_history[_history.length - 1] !== trackId) {
      _history.push(trackId)
      if (_history.length > MAX_HISTORY) _history.shift()
    }

    const payload: TrackLoadPayload = {
      id: trackId,
      trackId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      url: 'tplayer-audio://media/' + encodeURIComponent(track.file_path),
      cover_path: track.cover_path,
      file_format: track.file_format,
      bitrate: track.bitrate,
      sample_rate: track.sample_rate,
      startTime: 0,
    }

    send(IPC_CHANNELS.player.load, payload)

    updateMprisMeta(track.title, [track.artist], track.album, undefined, track.duration)
    updateMprisPlayingState('playing')
    updateNowPlaying(track.artist, track.title, track.album).catch(() => {})
    emitTimeUpdate()
    emitPlaybackState()
  } catch (err) {
    console.error('[audio-engine] playTrack failed:', err)
    _state.playbackState = 'error'
    updateMprisPlayingState('error')
    emitPlaybackState()
  }
}

export function pause(): void {
  _state.isPlaying = false
  _state.playbackState = 'paused'
  send(IPC_CHANNELS.player.pause)
  updateMprisPlayingState('paused')
  emitPlaybackState()
}

export function resume(): void {
  _state.isPlaying = true
  _state.playbackState = 'playing'
  send(IPC_CHANNELS.player.resume)
  updateMprisPlayingState('playing')
  emitPlaybackState()
}

export function togglePlay(): void {
  if (_state.isPlaying) pause()
  else resume()
}

export function seek(time: number): void {
  time = Math.max(0, Math.min(time, _state.duration))
  _state.currentTime = time

  if (_state.currentTrackId !== null) {
    send(IPC_CHANNELS.player.seekTo, { time })
    emitTimeUpdate()
  }
}

export function setVolume(volume: number): void {
  _state.volume = Math.max(0, Math.min(1, volume))
  send(IPC_CHANNELS.player.setVolume, _state.volume)
  emitPlaybackState()
}

export function syncPlaybackProgress(payload: PlaybackProgressPayload): void {
  if (_state.currentTrackId === null) return

  const duration = Number.isFinite(payload.duration) && payload.duration > 0
    ? payload.duration
    : _state.duration
  const currentTime = Number.isFinite(payload.currentTime)
    ? Math.max(0, Math.min(payload.currentTime, duration || payload.currentTime))
    : _state.currentTime

  _state.currentTime = currentTime
  _state.duration = duration
  emitTimeUpdate()
}

export function nextTrack(): void {
  if (_queue.length === 0) {
    if (_state.repeatMode === 'all' && _history.length > 0) {
      _queue = [..._history]
      if (_state.isShuffled) {
        _unshuffledQueue = [..._queue]
        for (let i = _queue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[_queue[i], _queue[j]] = [_queue[j], _queue[i]]
        }
      }
      emitQueueUpdated()
    } else {
      return
    }
  }

  const next = _queue.shift()!
  if (_state.isShuffled) {
    _unshuffledQueue = _unshuffledQueue.filter(id => id !== next)
  }
  emitQueueUpdated()
  playTrack(next)
}

export function prevTrack(): void {
  if (_state.currentTime > 3) {
    seek(0)
    return
  }

  if (_history.length <= 1) {
    seek(0)
    return
  }

  // Pop current track
  const current = _history.pop()!
  _queue.unshift(current)
  if (_state.isShuffled) {
    _unshuffledQueue.unshift(current)
  }

  // Pop and play previous track
  const prev = _history.pop()!
  emitQueueUpdated()
  playTrack(prev)
}

export function toggleShuffle(): void {
  _state.isShuffled = !_state.isShuffled
  if (_state.isShuffled) {
    _unshuffledQueue = [..._queue]
    for (let i = _queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[_queue[i], _queue[j]] = [_queue[j], _queue[i]]
    }
  } else {
    _queue = [..._unshuffledQueue]
    _unshuffledQueue = []
  }
  emitQueueUpdated()
  emitPlaybackState()
}

export function cycleRepeat(): void {
  const modes: RepeatMode[] = ['off', 'all', 'one']
  const idx = modes.indexOf(_state.repeatMode)
  _state.repeatMode = modes[(idx + 1) % modes.length]
  emitPlaybackState()
}

export function addToQueue(trackId: number): void {
  _queue.push(trackId)
  if (_state.isShuffled) {
    _unshuffledQueue.push(trackId)
  }
  emitQueueUpdated()
}

export function addNext(trackId: number): void {
  _queue.unshift(trackId)
  if (_state.isShuffled) {
    _unshuffledQueue.unshift(trackId)
  }
  emitQueueUpdated()
}

export function removeFromQueue(index: number): void {
  const [removed] = _queue.splice(index, 1)
  if (_state.isShuffled) {
    const unIndex = _unshuffledQueue.indexOf(removed)
    if (unIndex !== -1) _unshuffledQueue.splice(unIndex, 1)
  }
  emitQueueUpdated()
}

export function clearQueue(): void {
  _queue = []
  _unshuffledQueue = []
  emitQueueUpdated()
}

export function setQueue(trackIds: number[]): void {
  _queue = [...trackIds]
  if (_state.isShuffled) {
    _unshuffledQueue = [...trackIds]
    for (let i = _queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[_queue[i], _queue[j]] = [_queue[j], _queue[i]]
    }
  }
  emitQueueUpdated()
}

export function reorderQueue(from: number, to: number): void {
  const [item] = _queue.splice(from, 1)
  _queue.splice(to, 0, item)
  if (_state.isShuffled) {
    // reordering while shuffled only affects shuffled queue,
    // we can leave unshuffled alone or move it there too?
    // Usually, dragging in a shuffled queue means you want it to play next in the current order.
    // unshuffled queue doesn't need to be reordered.
  } else {
    // Wait, if we are NOT shuffled, reorderQueue changes _queue, which is the unshuffled queue.
    // That's fine.
  }
  emitQueueUpdated()
}

export function getQueue(): number[] {
  return [..._queue]
}

export function getState(): PlayerState {
  return { ..._state }
}

export function onTrackEnded(): void {
  if (_state.currentTrackId !== null) {
    const track = getTrack(_state.currentTrackId)
    if (track) {
      scrobble(track.artist, track.title, track.album).catch(() => {})
    }
  }

  if (_state.repeatMode === 'one') {
    if (_state.currentTrackId !== null) {
      playTrack(_state.currentTrackId)
    }
    return
  }

  if (_queue.length === 0) {
    if (_state.repeatMode === 'all' && _history.length > 0) {
      nextTrack()
    } else {
      _state.isPlaying = false
      _state.playbackState = 'idle'
      _state.currentTime = 0
      emitTimeUpdate()
      updateMprisPlayingState('idle')
      emitPlaybackState()
    }
    return
  }

  nextTrack()
}

export function initAudioEngine(volume = 0.8): void {
  _state.volume = volume
  _state.playbackState = 'idle'
}
