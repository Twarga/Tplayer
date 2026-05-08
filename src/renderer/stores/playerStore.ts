import { create } from 'zustand'
import { api } from '@/lib/ipc'
import { unlockAudio } from '@/lib/audioContext'
import type { PlaybackState, RepeatMode, TrackLoadPayload } from '../../shared/types/playback'

interface PlayerState {
  currentTrack: TrackLoadPayload | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: RepeatMode
  playbackState: PlaybackState
}

interface PlayerStore extends PlayerState {
  play: (trackId: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  next: () => Promise<void>
  prev: () => Promise<void>
  seek: (time: number) => Promise<void>
  setVolume: (v: number) => Promise<void>
  toggleShuffle: () => Promise<void>
  toggleRepeat: () => Promise<void>
  init: () => () => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isShuffled: false,
  repeatMode: 'off',
  playbackState: 'idle',

  init() {
    const cleanups = [
      api.player.onPlaybackState((data) => {
        set({
          playbackState: data.state,
          isPlaying: data.state === 'playing',
          currentTime: data.currentTime,
          duration: data.duration,
          volume: data.volume,
          isShuffled: data.isShuffled,
          repeatMode: data.repeatMode,
        })
      }),
      api.player.onTimeUpdate((data) => {
        set({ currentTime: data.current, duration: data.duration })
      }),
      api.player.onLoad((data) => {
        set({
          currentTrack: data,
          duration: data.duration,
          currentTime: data.startTime || 0,
        })
      }),
    ]

    return () => cleanups.forEach((c) => c())
  },

  play: async (trackId) => { unlockAudio(); await api.player.play(trackId) },
  pause: async () => { await api.player.pause() },
  resume: async () => { unlockAudio(); await api.player.resume() },
  togglePlay: async () => { unlockAudio(); await api.player.togglePlay() },
  next: async () => { await api.player.next() },
  prev: async () => { await api.player.prev() },
  seek: async (time) => {
    const { duration } = usePlayerStore.getState()
    const nextTime = Math.max(0, Math.min(time, duration || time))
    set({ currentTime: nextTime })
    window.dispatchEvent(new CustomEvent('tplayer:local-seek', { detail: { time: nextTime } }))
    await api.player.seek(nextTime)
  },
  setVolume: async (v) => { set({ volume: v }); await api.player.setVolume(v) },
  toggleShuffle: async () => { set(s => ({ isShuffled: !s.isShuffled })); await api.player.toggleShuffle() },
  toggleRepeat: async () => { 
    set(s => ({ repeatMode: s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off' }));
    await api.player.toggleRepeat() 
  },
}))
