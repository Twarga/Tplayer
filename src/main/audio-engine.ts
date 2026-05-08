import { getDb } from './database'

import { send } from './ipc-registry'
import { syncMprisPlayerState } from './mpris'
import { updateNowPlaying, scrobble } from './lastfm'
import { IPC_CHANNELS } from '../shared/ipc/channels'
import type {
  PlaybackProgressPayload,
  PlayerExportState,
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

interface QueueItem {
  id: number
  trackId: number
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

let _queue: QueueItem[] = []
let _unshuffledQueue: QueueItem[] = []
let _history: QueueItem[] = []
let _currentQueueItem: QueueItem | null = null
let _currentTrack: Track | null = null
let _queueItemId = 1
const MAX_HISTORY = 50

function createQueueItem(trackId: number): QueueItem {
  const item: QueueItem = {
    id: _queueItemId++,
    trackId,
  }
  return item
}

function cloneQueueItems(items: QueueItem[]): QueueItem[] {
  return items.map((item) => createQueueItem(item.trackId))
}

function shuffleQueue(items: QueueItem[]): QueueItem[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function getRepeatSeed(): QueueItem[] {
  const upcoming = _state.isShuffled ? _unshuffledQueue : _queue
  return [..._history, ...upcoming]
}

function getTrack(id: number): Track | undefined {
  return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined
}

function emitQueueUpdated(): void {
  const db = getDb()
  const list: QueueEntry[] = []
  for (const item of _queue) {
    const t = db.prepare('SELECT id, title, artist, album, duration FROM tracks WHERE id = ?').get(item.trackId) as QueueEntry | undefined
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
  syncMprisPlayerState(getPlayerExportState())
}

function emitTimeUpdate(): void {
  const payload: TimeUpdatePayload = {
    current: _state.currentTime,
    duration: _state.duration,
  }
  send(IPC_CHANNELS.player.timeUpdate, payload)
  syncMprisPlayerState(getPlayerExportState())
}

function getPlayerExportState(): PlayerExportState {
  return {
    currentTrack: _currentTrack,
    currentTrackId: _state.currentTrackId,
    isPlaying: _state.isPlaying,
    currentTime: _state.currentTime,
    duration: _state.duration,
    volume: _state.volume,
    isShuffled: _state.isShuffled,
    repeatMode: _state.repeatMode,
    playbackState: _state.playbackState,
  }
}

export async function playTrack(trackId: number): Promise<void> {
  const queueItem = createQueueItem(trackId)
  return playQueueItem(queueItem)
}

async function playQueueItem(queueItem: QueueItem): Promise<void> {
  _state.playbackState = 'loading'
  emitPlaybackState()

  const track = getTrack(queueItem.trackId)
  if (!track) {
    _state.playbackState = 'error'
    emitPlaybackState()
    return
  }

  try {
    _currentQueueItem = queueItem
    _currentTrack = track
    _state.currentTrackId = queueItem.trackId
    _state.duration = track.duration
    _state.currentTime = 0
    _state.isPlaying = true
    _state.playbackState = 'playing'

    if (_history[_history.length - 1]?.id !== queueItem.id) {
      _history.push(queueItem)
      if (_history.length > MAX_HISTORY) _history.shift()
    }

    const payload: TrackLoadPayload = {
      id: queueItem.trackId,
      trackId: queueItem.trackId,
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

    updateNowPlaying(track.artist, track.title, track.album).catch(() => {})
    emitTimeUpdate()
    emitPlaybackState()
  } catch (err) {
    console.error('[audio-engine] playTrack failed:', err)
    _state.playbackState = 'error'
    emitPlaybackState()
  }
}

export function pause(): void {
  _state.isPlaying = false
  _state.playbackState = 'paused'
  send(IPC_CHANNELS.player.pause)
  emitPlaybackState()
}

export function resume(): void {
  _state.isPlaying = true
  _state.playbackState = 'playing'
  send(IPC_CHANNELS.player.resume)
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
    const repeatSeed = getRepeatSeed()
    if (_state.repeatMode === 'all' && repeatSeed.length > 0) {
      _history = []
      if (_currentQueueItem) {
        _history.push(_currentQueueItem)
      }
      const cycleQueue = cloneQueueItems(repeatSeed)
      if (_state.isShuffled) {
        _unshuffledQueue = cycleQueue
        _queue = shuffleQueue(cycleQueue)
      } else {
        _queue = cycleQueue
        _unshuffledQueue = []
      }
      emitQueueUpdated()
    } else {
      return
    }
  }

  const next = _queue.shift()
  if (!next) return

  if (_state.isShuffled) {
    const unIndex = _unshuffledQueue.findIndex((item) => item.id === next.id)
    if (unIndex !== -1) _unshuffledQueue.splice(unIndex, 1)
  }
  emitQueueUpdated()
  void playQueueItem(next)
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

  const current = _history.pop()
  if (!current) {
    seek(0)
    return
  }

  _queue.unshift(current)
  if (_state.isShuffled) {
    _unshuffledQueue.unshift(current)
  }

  const prev = _history.pop()
  if (!prev) {
    seek(0)
    return
  }
  emitQueueUpdated()
  void playQueueItem(prev)
}

export function toggleShuffle(): void {
  _state.isShuffled = !_state.isShuffled
  if (_state.isShuffled) {
    _unshuffledQueue = [..._queue]
    _queue = shuffleQueue(_queue)
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
  const queueItem = createQueueItem(trackId)
  _queue.push(queueItem)
  if (_state.isShuffled) {
    _unshuffledQueue.push(queueItem)
  }
  emitQueueUpdated()
}

export function addNext(trackId: number): void {
  const queueItem = createQueueItem(trackId)
  _queue.unshift(queueItem)
  if (_state.isShuffled) {
    _unshuffledQueue.unshift(queueItem)
  }
  emitQueueUpdated()
}

export function removeFromQueue(index: number): void {
  if (index < 0 || index >= _queue.length) return
  const [removed] = _queue.splice(index, 1)
  if (_state.isShuffled) {
    const unIndex = _unshuffledQueue.findIndex((item) => item.id === removed.id)
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
  const queueItems = trackIds.map((trackId) => createQueueItem(trackId))
  if (_state.isShuffled) {
    _unshuffledQueue = queueItems
    _queue = shuffleQueue(queueItems)
  } else {
    _queue = queueItems
    _unshuffledQueue = []
  }
  emitQueueUpdated()
}

export function reorderQueue(from: number, to: number): void {
  if (from < 0 || from >= _queue.length || to < 0 || to >= _queue.length || from === to) {
    return
  }

  _queue = moveItem(_queue, from, to)
  if (_state.isShuffled) {
    _unshuffledQueue = [..._queue]
  }
  emitQueueUpdated()
}

export function getQueue(): number[] {
  return _queue.map((item) => item.trackId)
}

export function getState(): PlayerState {
  return { ..._state }
}

export function getPlayerStateExport(): PlayerExportState {
  return getPlayerExportState()
}

export function onTrackEnded(): void {
  if (_state.currentTrackId !== null) {
    const track = getTrack(_state.currentTrackId)
    if (track) {
      scrobble(track.artist, track.title, track.album).catch(() => {})
    }
  }

  if (_state.repeatMode === 'one') {
    if (_currentQueueItem) {
      void playQueueItem(createQueueItem(_currentQueueItem.trackId))
    } else if (_state.currentTrackId !== null) {
      void playTrack(_state.currentTrackId)
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
      emitPlaybackState()
    }
    return
  }

  nextTrack()
}

export function initAudioEngine(volume = 0.8): void {
  _state.volume = volume
  _state.playbackState = 'idle'
  syncMprisPlayerState(getPlayerExportState())
}
