import { getDb } from './database'
import { decodeAudioFile } from './audio-decoder'
import { send } from './ipc-registry'

export type RepeatMode = 'off' | 'all' | 'one'
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

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

interface Track {
  id: number
  file_path: string
  title: string
  artist: string
  album: string
  duration: number
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
let _history: number[] = []
const MAX_HISTORY = 50

function getTrack(id: number): Track | undefined {
  return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined
}

function emitPlaybackState(): void {
  send('player:playback-state', {
    state: _state.playbackState,
    trackId: _state.currentTrackId,
    currentTime: _state.currentTime,
    duration: _state.duration,
    volume: _state.volume,
    isShuffled: _state.isShuffled,
    repeatMode: _state.repeatMode,
  })
}

function emitTimeUpdate(): void {
  send('player:time-update', {
    current: _state.currentTime,
    duration: _state.duration,
  })
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
    const decoded = await decodeAudioFile(track.file_path)

    _state.currentTrackId = trackId
    _state.duration = decoded.duration
    _state.currentTime = 0
    _state.isPlaying = true
    _state.playbackState = 'playing'

    getDb().prepare('UPDATE tracks SET play_count = play_count + 1, last_played = datetime("now") WHERE id = ?').run(trackId)

    if (_history[_history.length - 1] !== trackId) {
      _history.push(trackId)
      if (_history.length > MAX_HISTORY) _history.shift()
    }

    send('player:load', {
      trackId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: decoded.duration,
      pcmData: decoded.pcmData,
      sampleRate: decoded.sampleRate,
      channels: decoded.channels,
    })

    emitPlaybackState()
  } catch {
    _state.playbackState = 'error'
    emitPlaybackState()
  }
}

export function pause(): void {
  _state.isPlaying = false
  _state.playbackState = 'paused'
  send('player:pause')
  emitPlaybackState()
}

export function resume(): void {
  _state.isPlaying = true
  _state.playbackState = 'playing'
  send('player:resume')
  emitPlaybackState()
}

export function togglePlay(): void {
  if (_state.isPlaying) pause()
  else resume()
}

export function seek(time: number): void {
  _state.currentTime = Math.max(0, Math.min(time, _state.duration))
  send('player:seek', time)
  emitTimeUpdate()
}

export function setVolume(volume: number): void {
  _state.volume = Math.max(0, Math.min(1, volume))
  send('player:set-volume', _state.volume)
}

export function nextTrack(): void {
  if (_queue.length === 0) return

  const next = _queue.shift()!
  if (_state.currentTrackId !== null) {
    _queue.push(_state.currentTrackId)
  }

  playTrack(next)
}

export function prevTrack(): void {
  if (_history.length === 0) {
    seek(0)
    return
  }

  const prev = _history.pop()!
  playTrack(prev)
}

export function toggleShuffle(): void {
  _state.isShuffled = !_state.isShuffled
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
  send('queue:updated', _queue)
}

export function addNext(trackId: number): void {
  _queue.unshift(trackId)
  send('queue:updated', _queue)
}

export function removeFromQueue(index: number): void {
  _queue.splice(index, 1)
  send('queue:updated', _queue)
}

export function clearQueue(): void {
  _queue = []
  send('queue:updated', _queue)
}

export function reorderQueue(from: number, to: number): void {
  const [item] = _queue.splice(from, 1)
  _queue.splice(to, 0, item)
  send('queue:updated', _queue)
}

export function getQueue(): number[] {
  return [..._queue]
}

export function getState(): PlayerState {
  return { ..._state }
}

export function onTrackEnded(): void {
  if (_state.repeatMode === 'one') {
    seek(0)
    resume()
    return
  }

  if (_queue.length === 0) {
    if (_state.repeatMode === 'all') {
      const lastTrackId = _history[_history.length - 1]
      if (lastTrackId !== undefined) {
        playTrack(lastTrackId)
      }
    } else {
      _state.isPlaying = false
      _state.playbackState = 'idle'
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