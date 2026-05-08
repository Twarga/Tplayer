import { useState } from 'react'
import { Home, Library, Settings, Plus, Download, Inbox, Music4, ListMusic, Disc3, UserRound, FolderOpen } from 'lucide-react'
import { usePlaylistStore } from '@/stores/playlistStore'
import { cn } from '@/lib/utils'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full h-10 px-3 rounded-[10px] text-sm font-medium interactive-soft relative border",
        active
          ? 'bg-[rgba(198,157,84,0.12)] text-primary shadow-card border-[rgba(198,157,84,0.18)]'
          : 'text-secondary border-transparent hover:bg-white/[0.03] hover:text-primary'
      )}
    >
      <div 
        className={cn(
          "absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-accent transition-transform duration-slow origin-center",
          active ? "scale-y-100" : "scale-y-0"
        )} 
      />
      <span className={cn("w-5 h-5 flex items-center justify-center", active ? "text-accent" : "")}>{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
    </button>
  )
}

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { playlists } = usePlaylistStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const { createPlaylist, loadPlaylists } = usePlaylistStore()

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await createPlaylist(newPlaylistName.trim())
      setNewPlaylistName('')
      setShowCreateDialog(false)
      await loadPlaylists()
    }
  }

  return (
    <aside className="w-[252px] min-w-[252px] h-full rounded-[18px] bg-[linear-gradient(180deg,rgba(12,13,15,0.98),rgba(9,10,12,0.96))] border border-white/7 flex flex-col select-none shadow-card overflow-hidden backdrop-glass">
      <div className="px-5 pb-5 pt-5 flex items-center gap-3 shrink-0 border-b border-white/[0.06]">
        <div className="w-11 h-11 rounded-full border border-accent/40 bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
          T
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-primary text-[1.08rem] leading-none">Tplayer</span>
          <p className="text-[11px] text-tertiary mt-1 tracking-[0.1em] uppercase">Your music</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 px-3 py-4 flex-1 overflow-y-auto">
        <NavItem icon={<Home size={18} />} label="Home" active={activeView === 'home'} onClick={() => onViewChange('home')} />
        <NavItem icon={<Library size={20} />} label="Library" active={activeView === 'library'} onClick={() => onViewChange('library')} />
        <div className="px-3 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary">Your music</p>
        </div>
        <NavItem icon={<ListMusic size={18} />} label="Songs" active={activeView === 'library'} onClick={() => onViewChange('library')} />
        <NavItem icon={<Disc3 size={18} />} label="Albums" active={activeView === 'albums'} onClick={() => onViewChange('albums')} />
        <NavItem icon={<UserRound size={18} />} label="Artists" active={activeView === 'artists'} onClick={() => onViewChange('artists')} />
        <NavItem icon={<Music4 size={18} />} label="Playlists" active={activeView === 'playlists'} onClick={() => onViewChange('playlists')} />
        <NavItem icon={<FolderOpen size={18} />} label="Folders" active={activeView === 'settings'} onClick={() => onViewChange('settings')} />
        <div className="px-3 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary">Import & discover</p>
        </div>
        <NavItem
          icon={<span className="text-red-500"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span>}
          label="YouTube Import"
          active={activeView === 'youtube'}
          onClick={() => onViewChange('youtube')}
        />
        <NavItem icon={<Download size={20} />} label="Downloads" active={activeView === 'downloads'} onClick={() => onViewChange('downloads')} />
        <NavItem icon={<Inbox size={20} />} label="Queue" active={activeView === 'queue'} onClick={() => onViewChange('queue')} />

        <div className="flex items-center justify-between px-3 pt-6 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary">Playlists</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="w-8 h-8 rounded-[10px] hover:bg-white/[0.05] flex items-center justify-center text-tertiary hover:text-primary interactive-soft"
            title="Create playlist"
          >
            <Plus size={14} />
          </button>
        </div>

        {playlists.map((playlist) => (
          <NavItem
            key={playlist.id}
            icon={<Music4 size={18} />}
            label={playlist.name}
            active={activeView === 'playlist-' + playlist.id}
            onClick={() => onViewChange('playlist-' + playlist.id)}
          />
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 flex flex-col gap-1 shrink-0 border-t border-white/[0.06] bg-white/[0.02]">
        <NavItem icon={<Settings size={20} />} label="Settings" active={activeView === 'settings'} onClick={() => onViewChange('settings')} />
      </div>

      {/* Create Playlist Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-surface-1 border border-border-default rounded-xl p-6 w-80 shadow-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-primary mb-4">Create Playlist</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="Playlist name"
              className="w-full h-10 px-3 rounded-md bg-input-bg border border-input-border text-primary placeholder:text-tertiary focus:border-accent focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 rounded-md text-sm text-secondary hover:text-primary hover:bg-surface-2 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 rounded-md text-sm bg-accent text-background hover:bg-accent-hover transition-all active:scale-95"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
