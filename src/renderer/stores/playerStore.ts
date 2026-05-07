import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface Track {
  id: number
  title: string
  artist: string
  album: string
  duration: number
}

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isShuffled: boolean
  repeatMode: 'off' | 'all' | 'one'
  playbackState: 'idle' | 'loading' | 'playing' | 'paused' | 'error'
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
  init: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isShuffled: false,
  repeatMode: 'off',
  playbackState: 'idle',

  init() {
    api.player.onPlaybackState((data) => {
      set({
        playbackState: data.state,
        currentTime: data.currentTime,
        duration: data.duration,
        volume: data.volume,
        isShuffled: data.isShuffled,
        repeatMode: data.repeatMode,
      })
    })

    api.player.onTimeUpdate((data) => {
      set({ currentTime: data.current, duration: data.duration })
    })

    api.player.onLoad((data) => {
      set({
        currentTrack: {
          id: data.trackId,
          title: data.title,
          artist: data.artist,
          album: data.album,
          duration: data.duration,
        },
        duration: data.duration,
        currentTime: 0,
      })
    })

    api.player.onEnded(() => {
      get().next()
    })
  },

  play: async (trackId) => { await api.player.play(trackId) },
  pause: async () => { await api.player.pause() },
  resume: async () => { await api.player.resume() },
  togglePlay: async () => { await api.player.togglePlay() },
  next: async () => { await api.player.next() },
  prev: async () => { await api.player.prev() },
  seek: async (time) => { await api.player.seek(time) },
  setVolume: async (v) => { await api.player.setVolume(v) },
  toggleShuffle: async () => { await api.player.toggleShuffle() },
  toggleRepeat: async () => { await api.player.toggleRepeat() },
}))