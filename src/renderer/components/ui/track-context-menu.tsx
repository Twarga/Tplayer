import type { ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Play, ListMusic, Heart, Plus } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { useQueueStore } from '@/stores/queueStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { useToast } from '@/stores/toastStore'
import { api } from '@/lib/ipc'
import { cn } from '@/lib/utils'

interface TrackContextMenuProps {
  trackId: number
  children: ReactNode
}

const menuItemClass = cn(
  'flex items-center gap-2.5 px-3 py-2 text-sm text-secondary rounded-md cursor-pointer outline-none',
  'hover:bg-white/[0.07] hover:text-primary focus:bg-white/[0.07] focus:text-primary transition-colors'
)

const separatorClass = 'h-px bg-white/[0.07] my-1'

export function TrackContextMenu({ trackId, children }: TrackContextMenuProps) {
  const { play } = usePlayerStore()
  const { add: addToQueue, addNext } = useQueueStore()
  const { toggleFavorite, isFavorite } = useLibraryStore()
  const { playlists } = usePlaylistStore()
  const { add: addToast } = useToast()

  const fav = isFavorite(trackId)

  const handlePlayNow = () => play(trackId)
  const handleAddNext = () => addNext(trackId)
  const handleAddLast = () => addToQueue(trackId)

  const handleToggleFavorite = async () => {
    await toggleFavorite(trackId)
    addToast(fav ? 'Removed from favorites' : 'Added to favorites', 'success')
  }

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      await api.playlist.addTracks(playlistId, [trackId])
      addToast('Added to playlist', 'success')
    } catch {
      addToast('Failed to add to playlist', 'error')
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {/* Wrap the trigger in a span so context-menu right-click opens it */}
        <span onContextMenu={(e) => e.preventDefault()} className="contents">
          {children}
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[200px] bg-[#1c1420] border border-white/[0.12] rounded-xl p-1.5 shadow-dropdown animate-scale-in"
          sideOffset={4}
          align="start"
        >
          <DropdownMenu.Item className={menuItemClass} onSelect={handlePlayNow}>
            <Play size={14} className="text-accent" />
            Play Now
          </DropdownMenu.Item>

          <DropdownMenu.Item className={menuItemClass} onSelect={handleAddNext}>
            <ListMusic size={14} />
            Play Next
          </DropdownMenu.Item>

          <DropdownMenu.Item className={menuItemClass} onSelect={handleAddLast}>
            <ListMusic size={14} />
            Add to Queue
          </DropdownMenu.Item>

          <DropdownMenu.Separator className={separatorClass} />

          {playlists.length > 0 && (
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className={cn(menuItemClass, 'justify-between')}>
                <span className="flex items-center gap-2.5">
                  <Plus size={14} />
                  Add to Playlist
                </span>
                <span className="text-tertiary text-xs">›</span>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="z-50 min-w-[180px] bg-[#1c1420] border border-white/[0.12] rounded-xl p-1.5 shadow-dropdown animate-scale-in"
                  sideOffset={6}
                >
                  {playlists.map((pl) => (
                    <DropdownMenu.Item
                      key={pl.id}
                      className={menuItemClass}
                      onSelect={() => handleAddToPlaylist(pl.id)}
                    >
                      {pl.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          )}

          <DropdownMenu.Separator className={separatorClass} />

          <DropdownMenu.Item className={menuItemClass} onSelect={handleToggleFavorite}>
            <Heart size={14} className={fav ? 'text-accent' : ''} fill={fav ? 'currentColor' : 'none'} />
            {fav ? 'Remove from Favorites' : 'Add to Favorites'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
