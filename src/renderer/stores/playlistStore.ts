import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface Playlist {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  track_count?: number
}

interface PlaylistStore {
  playlists: Playlist[]
  activePlaylistId: number | null
  playlistTracks: Array<{ id: number; title: string; artist: string; album: string; duration: number; position: number }>
  isLoading: boolean
  loadPlaylists: () => Promise<void>
  createPlaylist: (name: string, desc?: string) => Promise<void>
  deletePlaylist: (id: number) => Promise<void>
  renamePlaylist: (id: number, name: string) => Promise<void>
  selectPlaylist: (id: number) => Promise<void>
  addTracks: (playlistId: number, trackIds: number[]) => Promise<void>
  removeTrack: (playlistId: number, trackId: number) => Promise<void>
  reorderTrack: (playlistId: number, from: number, to: number) => Promise<void>
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  playlists: [],
  activePlaylistId: null,
  playlistTracks: [],
  isLoading: false,

  loadPlaylists: async () => {
    set({ isLoading: true })
    try {
      const playlists = await api.playlist.list()
      set({ playlists: playlists as Playlist[], isLoading: false })
    } catch (err) {
      console.error('[playlistStore] load failed:', err)
      set({ isLoading: false })
    }
  },

  createPlaylist: async (name, desc) => {
    if (!name.trim()) return
    await api.playlist.create(name.trim(), desc)
    await get().loadPlaylists()
  },

  deletePlaylist: async (id) => {
    await api.playlist.delete(id)
    set((s) => ({ 
      playlists: s.playlists.filter((p) => p.id !== id),
      activePlaylistId: s.activePlaylistId === id ? null : s.activePlaylistId 
    }))
  },

  renamePlaylist: async (id, name) => {
    await api.playlist.rename(id, name)
    set((s) => ({
      playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)),
    }))
  },

  selectPlaylist: async (id) => {
    set({ activePlaylistId: id })
    try {
      const tracks = await api.playlist.getTracks(id)
      set({ playlistTracks: tracks as unknown as PlaylistStore['playlistTracks'] })
    } catch (err) {
      console.error('[playlistStore] select failed:', err)
    }
  },

  addTracks: async (playlistId, trackIds) => {
    await api.playlist.addTracks(playlistId, trackIds)
    if (playlistId === get().activePlaylistId) {
      await get().selectPlaylist(playlistId)
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
    if (playlistId === get().activePlaylistId) {
      await get().selectPlaylist(playlistId)
    }
  },
}))