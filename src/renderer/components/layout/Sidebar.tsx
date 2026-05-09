import { useState } from 'react'
import { Home, Library, Settings, Plus, Download, Inbox, Music4, Disc3, UserRound } from 'lucide-react'
import { usePlaylistStore } from '@/stores/playlistStore'
import { CreatePlaylistDialog } from '@/components/ui/create-playlist-dialog'
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
        'flex items-center gap-3 w-full h-10 px-2.5 text-sm font-medium interactive-soft relative',
        active ? 'text-primary' : 'text-secondary hover:text-primary'
      )}
    >
      <div
        className={cn(
          'absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-accent transition-transform duration-slow origin-center',
          active ? 'scale-y-100' : 'scale-y-0'
        )}
      />
      <span className={cn('w-5 h-5 flex items-center justify-center', active ? 'text-accent' : '')}>{icon}</span>
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
  const { createPlaylist, loadPlaylists } = usePlaylistStore()

  const handleCreatePlaylist = async (name: string) => {
    await createPlaylist(name)
    await loadPlaylists()
  }

  return (
    <aside className="w-[188px] min-w-[188px] h-full bg-[#120d14] border-r border-white/[0.055] flex flex-col select-none overflow-hidden">
      <div className="px-4 pb-5 pt-5 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-accent font-bold text-sm">
          T
        </div>
        <div className="min-w-0">
          <span className="font-display font-bold text-primary text-base leading-none">Tplayer</span>
          <p className="text-[11px] text-tertiary mt-1 tracking-[0.1em] uppercase">Your music</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto">
        <NavItem icon={<Home size={18} />} label="Home" active={activeView === 'home'} onClick={() => onViewChange('home')} />
        <NavItem icon={<Library size={20} />} label="Library" active={activeView === 'library'} onClick={() => onViewChange('library')} />
        <NavItem icon={<Disc3 size={18} />} label="Albums" active={activeView === 'albums'} onClick={() => onViewChange('albums')} />
        <NavItem icon={<UserRound size={18} />} label="Artists" active={activeView === 'artists'} onClick={() => onViewChange('artists')} />
        <NavItem icon={<Music4 size={18} />} label="Playlists" active={activeView === 'playlists'} onClick={() => onViewChange('playlists')} />
        <NavItem icon={<Inbox size={18} />} label="Queue" active={activeView === 'queue'} onClick={() => onViewChange('queue')} />

        <div className="mt-4 border-t border-white/[0.055] pt-4" />
        <NavItem
          icon={<span className="text-red-500"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span>}
          label="YouTube Import"
          active={activeView === 'youtube'}
          onClick={() => onViewChange('youtube')}
        />
        <NavItem icon={<Download size={20} />} label="Downloads" active={activeView === 'downloads'} onClick={() => onViewChange('downloads')} />

        {playlists.length > 0 && (
          <div className="flex items-center justify-between px-2.5 pt-6 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-tertiary">Playlists</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-tertiary hover:text-primary interactive-soft"
              title="Create playlist"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

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

      <div className="px-3 pb-4 pt-3 flex flex-col gap-1 shrink-0 border-t border-white/[0.055]">
        <NavItem icon={<Settings size={20} />} label="Settings" active={activeView === 'settings'} onClick={() => onViewChange('settings')} />
      </div>

      <CreatePlaylistDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={handleCreatePlaylist}
      />
    </aside>
  )
}
