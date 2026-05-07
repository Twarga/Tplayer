import React, { useEffect } from 'react'
import { Play, Plus } from 'lucide-react'
import { usePlaylistStore } from '@/stores/playlistStore'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export function PlaylistListView() {
  const { playlists, loadPlaylists, createPlaylist, deletePlaylist } = usePlaylistStore()

  useEffect(() => {
    loadPlaylists()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Playlists</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus size={16} className="mr-2" /> New Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input placeholder="Playlist name" id="playlist-name" />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => document.getElementById('playlist-name')?.closest('.dialog-content')?.remove()}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    const nameInput = document.getElementById('playlist-name') as HTMLInputElement
                    if (nameInput?.value) {
                      createPlaylist(nameInput.value)
                    }
                  }}
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-secondary mb-2">No playlists yet</p>
          <p className="text-sm text-tertiary">Create your first playlist to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-surface-1 rounded-lg p-4 cursor-pointer hover:bg-surface-2 transition-colors group"
            >
              <div className="aspect-square rounded-md bg-surface-2 mb-3 flex items-center justify-center">
                <span className="text-3xl text-accent font-bold">{playlist.name[0]}</span>
              </div>
              <p className="text-sm font-semibold text-primary truncate mb-1">{playlist.name}</p>
              <p className="text-xs text-tertiary">{playlist.track_count || 0} tracks</p>
              <button className="mt-3 w-full h-10 rounded-full bg-accent text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={18} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}