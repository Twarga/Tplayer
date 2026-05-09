import { useEffect, useState } from 'react'
import { Play, Plus, Trash2, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePlaylistStore } from '@/stores/playlistStore'
import { CreatePlaylistDialog } from '@/components/ui/create-playlist-dialog'
import { api } from '@/lib/ipc'
import { staggerParent, staggerItem } from '@/lib/animations'

/** 2×2 mosaic of cover images, falls back to first-letter initial */
function CoverMosaic({ name, covers }: { name: string; covers: string[] }) {
  if (covers.length === 0) {
    return (
      <span className="text-4xl text-accent font-bold">{name[0]}</span>
    )
  }
  const cells = [...covers.slice(0, 4)]
  while (cells.length < 4) cells.push('')
  return (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
      {cells.map((url, i) =>
        url ? (
          <img key={i} src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div key={i} className="bg-[var(--surface-3)]" />
        )
      )}
    </div>
  )
}

export function PlaylistListView() {
  const { playlists, loadPlaylists, createPlaylist, deletePlaylist, isLoading } = usePlaylistStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [covers, setCovers] = useState<Record<number, string[]>>({})

  useEffect(() => {
    loadPlaylists()
  }, [])

  // Fetch up to 4 cover URLs per playlist for mosaics
  useEffect(() => {
    if (playlists.length === 0) return
    const fetchCovers = async () => {
      const result: Record<number, string[]> = {}
      await Promise.all(
        playlists.map(async (p) => {
          try {
            const tracks = await api.playlist.getTracks(p.id)
            result[p.id] = tracks
              .slice(0, 4)
              .filter((t) => t.cover_path)
              .map((t) => `tplayer-img://media/${encodeURIComponent(t.cover_path!)}`)
          } catch {
            result[p.id] = []
          }
        })
      )
      setCovers(result)
    }
    void fetchCovers()
  }, [playlists])

  const handleCreate = async (name: string) => {
    await createPlaylist(name)
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg skeleton" />
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
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4"
        >
          {playlists.map((playlist) => (
            <motion.div
              key={playlist.id}
              variants={staggerItem}
              className="bg-surface-1 rounded-lg p-4 group hover:bg-surface-2 transition-colors cursor-pointer card-lift"
            >
              {/* Mosaic cover — Task 9 */}
              <div className="aspect-square rounded-md bg-surface-2 mb-3 flex items-center justify-center relative overflow-hidden">
                <CoverMosaic name={playlist.name} covers={covers[playlist.id] ?? []} />
                <button
                  onClick={(e) => { e.stopPropagation() }}
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
                  onDoubleClick={() => { setEditingId(playlist.id); setEditName(playlist.name) }}
                >
                  {playlist.name}
                </h3>
              )}

              <p className="text-xs text-secondary">{playlist.track_count || 0} tracks</p>

              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingId(playlist.id); setEditName(playlist.name) }}
                  className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-surface-3 transition-colors"
                  title="Rename"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => { if (confirm('Delete this playlist?')) deletePlaylist(playlist.id) }}
                  className="p-1.5 rounded text-tertiary hover:text-red-400 hover:bg-surface-3 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <CreatePlaylistDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onConfirm={handleCreate}
      />
    </div>
  )
}
