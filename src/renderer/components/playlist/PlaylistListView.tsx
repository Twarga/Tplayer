import { useEffect, useState } from 'react'
import { Play, Plus, Trash2, Edit3 } from 'lucide-react'
import { usePlaylistStore } from '@/stores/playlistStore'

export function PlaylistListView() {
  const { playlists, loadPlaylists, createPlaylist, deletePlaylist, isLoading } = usePlaylistStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadPlaylists()
  }, [])

  const handleCreate = async () => {
    if (newName.trim()) {
      await createPlaylist(newName.trim())
      setNewName('')
      setShowCreate(false)
    }
  }

  const handleRename = async (id: number) => {
    if (editName.trim()) {
      await usePlaylistStore.getState().renamePlaylist(id, editName.trim())
      setEditingId(null)
      setEditName('')
    }
  }

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Playlists</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded-md text-sm font-medium hover:bg-accent-hover transition-colors btn-press"
        >
          <Plus size={16} />
          New Playlist
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-1 rounded-lg skeleton" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-secondary mb-2">No playlists yet</p>
          <p className="text-sm text-tertiary mb-6">Create your first playlist to organize your music</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-accent text-background rounded-md text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Create Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-surface-1 rounded-lg p-4 group hover:bg-surface-2 transition-colors cursor-pointer card-lift"
            >
              <div className="aspect-square rounded-md bg-surface-2 mb-3 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl text-accent font-bold">{playlist.name[0]}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); }}
                  className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-spring shadow-play-button hover:scale-105"
                >
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </button>
              </div>

              {editingId === playlist.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename(playlist.id)}
                  onBlur={() => handleRename(playlist.id)}
                  autoFocus
                  className="w-full bg-input-bg border border-input-border rounded px-2 py-1 text-sm text-primary mb-1"
                />
              ) : (
                <h3
                  className="text-sm font-semibold text-primary truncate mb-0.5"
                  onDoubleClick={() => { setEditingId(playlist.id); setEditName(playlist.name); }}
                >
                  {playlist.name}
                </h3>
              )}

              <p className="text-xs text-secondary">{playlist.track_count || 0} tracks</p>

              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingId(playlist.id); setEditName(playlist.name); }}
                  className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-surface-3 transition-colors"
                  title="Rename"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this playlist?')) deletePlaylist(playlist.id); }}
                  className="p-1.5 rounded text-tertiary hover:text-red-400 hover:bg-surface-3 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-1 border border-border-default rounded-xl p-6 w-80 shadow-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-4">Create Playlist</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Playlist name"
              className="w-full h-10 px-3 rounded-md bg-input-bg border border-input-border text-primary placeholder:text-tertiary focus:border-accent focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-md text-sm text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-md text-sm bg-accent text-background hover:bg-accent-hover transition-colors btn-press"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
