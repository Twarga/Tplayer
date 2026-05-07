import React from 'react'
import { Home, Library, Music, Disc, Users, ListMusic, Folder, Compass, Heart, Settings, ChevronDown, Plus } from 'lucide-react'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  count?: number
}

function NavItem({ icon, label, active, onClick, count }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full h-9 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-surface-3 text-primary'
          : 'text-secondary hover:bg-surface-2 hover:text-primary'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-tertiary">{count}</span>
      )}
    </button>
  )
}

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { playlists, createPlaylist } = usePlaylistStore()

  return (
    <aside className="w-[200px] min-w-[200px] h-full bg-sidebar-bg border-r border-border-subtle flex flex-col">
      <div className="px-4 pb-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-background font-bold text-sm">
          T
        </div>
        <span className="font-bold text-primary text-lg">Tplayer</span>
        <ChevronDown className="w-4 h-4 text-tertiary ml-auto" />
      </div>

      <nav className="flex flex-col gap-1 px-2">
        <NavItem icon={<Home size={20} />} label="Home" active={activeView === 'home'} onClick={() => onViewChange('home')} />
        <NavItem icon={<Library size={20} />} label="Library" active={activeView === 'library'} onClick={() => onViewChange('library')} />

        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-tertiary pt-4 px-3 pb-2">Your Music</p>

        <NavItem icon={<Music size={20} />} label="Songs" onClick={() => onViewChange('library')} />
        <NavItem icon={<Disc size={20} />} label="Albums" onClick={() => onViewChange('albums')} />
        <NavItem icon={<Users size={20} />} label="Artists" onClick={() => onViewChange('artists')} />
        <NavItem icon={<ListMusic size={20} />} label="Playlists" onClick={() => onViewChange('playlists')} />
        <NavItem icon={<Folder size={20} />} label="Folders" onClick={() => onViewChange('folders')} />

        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-tertiary pt-4 px-3 pb-2">Import & Discover</p>

        <NavItem
          icon={<span className="text-red-500"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span>}
          label="YouTube Import"
          onClick={() => onViewChange('youtube')}
        />
        <NavItem icon={<Compass size={20} />} label="Discover" onClick={() => onViewChange('discover')} />

        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-tertiary">Playlists</p>
          <button
            onClick={() => createPlaylist('New Playlist')}
            className="w-6 h-6 rounded-full hover:bg-surface-2 flex items-center justify-center text-tertiary hover:text-primary transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {playlists.map((playlist) => (
          <NavItem
            key={playlist.id}
            icon={<ListMusic size={20} />}
            label={playlist.name}
            active={activeView === 'playlist' + playlist.id}
            onClick={() => onViewChange('playlist' + playlist.id)}
          />
        ))}
      </nav>

      <div className="mt-auto px-2 pb-4 flex flex-col gap-1">
        <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => onViewChange('settings')} />
      </div>
    </aside>
  )
}