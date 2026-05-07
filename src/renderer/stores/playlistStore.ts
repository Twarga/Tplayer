import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface Playlist {
  id: number
  name: string
  description: string
  track_count?: number
}

interface PlaylistStore {
  playlists: Playlist[]
  activePlaylistId: number | null
  playlistTracks: Array<{ id: number; title: string; artist: string; album: string; duration: number }>
  loadPlaylists: () => Promise<void>
  createPlaylist: (name: string, desc?: string) => Promise<void>
  deletePlaylist: (id: number) => Promise<void>
  renamePlaylist: (id: number, name: string) => Promise<void>
  selectPlaylist: (id: number) => Promise<void>
  addTracks: (playlistId: number, trackIds: number[]) => Promise<void>
  removeTrack: (playlistId: number, trackId: number) => Promise<void>
  reorderTrack: (playlistId: number, from: number, to: number) => Promise<void>
}

export const usePlaylistStore = create<PlaylistStore>((set) => ({
  playlists: [],
  activePlaylistId: null,
  playlistTracks: [],

  loadPlaylists: async () => {
    const playlists = await api.playlist.list()
    set({ playlists })
  },

  createPlaylist: async (name, desc) => {
    await api.playlist.create(name, desc)
    const playlists = await api.playlist.list()
    set({ playlists })
  },

  deletePlaylist: async (id) => {
    await api.playlist.delete(id)
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }))
  },

  renamePlaylist: async (id, name) => {
    await api.playlist.rename(id, name)
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
    }))
  },

  selectPlaylist: async (id) => {
    set({ activePlaylistId: id })
    const tracks = await api.playlist.getTracks(id)
    set({ playlistTracks: tracks })
  },

  addTracks: async (playlistId, trackIds) => {
    await api.playlist.addTracks(playlistId, trackIds)
    if (playlistId === set.getState().activePlaylistId) {
      const tracks = await api.playlist.getTracks(playlistId)
      set({ playlistTracks: tracks })
    }
  },

  removeTrack: async (playlistId, trackId) => {
    await api.playlist.removeTrack(playlistId, trackId)
    set((s) => ({
      playlistTracks: s.playlistTracks.filter((t) => t.id !== trackId),
    }))
  },

  reorderTrack: async (playlistId, from, to) => {
    await api.playlist.reorder(playlistId, from, to)
  },
}))