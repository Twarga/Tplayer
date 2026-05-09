import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Music, Disc, Users, ListMusic, X } from 'lucide-react'
import { useSearchStore } from '@/stores/searchStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { usePlayerStore } from '@/stores/playerStore'
import { cn } from '@/lib/utils'

interface SearchOverlayProps {
  onViewChange: (view: string) => void
}

type ResultItem =
  | { kind: 'track'; id: number; title: string; artist: string }
  | { kind: 'album'; title: string }
  | { kind: 'artist'; name: string }
  | { kind: 'playlist'; id: number; name: string }

export function SearchOverlay({ onViewChange }: SearchOverlayProps) {
  const { isOpen, close } = useSearchStore()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { tracks } = useLibraryStore()
  const { playlists } = usePlaylistStore()
  const { play } = usePlayerStore()

  const q = query.trim().toLowerCase()

  const results = useMemo<ResultItem[]>(() => {
    if (!q) return []
    const out: ResultItem[] = []

    // Tracks
    tracks
      .filter(t => t.title?.toLowerCase().includes(q) || t.artist?.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach(t => out.push({ kind: 'track', id: t.id, title: t.title, artist: t.artist }))

    // Albums
    const albumSet = new Set<string>()
    tracks.forEach(t => { if (t.album?.toLowerCase().includes(q)) albumSet.add(t.album) })
    Array.from(albumSet).slice(0, 3).forEach(a => out.push({ kind: 'album', title: a }))

    // Artists
    const artistSet = new Set<string>()
    tracks.forEach(t => { if (t.artist?.toLowerCase().includes(q)) artistSet.add(t.artist) })
    Array.from(artistSet).slice(0, 3).forEach(a => out.push({ kind: 'artist', name: a }))

    // Playlists
    playlists
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(p => out.push({ kind: 'playlist', id: p.id, name: p.name }))

    return out
  }, [q, tracks, playlists])

  // Reset selection when results change
  useEffect(() => setSelected(0), [results])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSelect = useCallback((item: ResultItem) => {
    if (item.kind === 'track') {
      play(item.id)
    } else if (item.kind === 'album') {
      onViewChange('albums')
    } else if (item.kind === 'artist') {
      onViewChange('artists')
    } else if (item.kind === 'playlist') {
      onViewChange(`playlist-${item.id}`)
    }
    close()
  }, [play, onViewChange, close])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) handleSelect(results[selected])
  }

  const iconFor = (kind: ResultItem['kind']) => {
    if (kind === 'track') return <Music size={14} className="text-accent shrink-0" />
    if (kind === 'album') return <Disc size={14} className="text-blue-400 shrink-0" />
    if (kind === 'artist') return <Users size={14} className="text-purple-400 shrink-0" />
    return <ListMusic size={14} className="text-green-400 shrink-0" />
  }

  const labelFor = (item: ResultItem) => {
    if (item.kind === 'track') return <><span className="font-medium">{item.title}</span><span className="text-tertiary"> — {item.artist}</span></>
    if (item.kind === 'album') return <><span className="text-xs text-blue-400 mr-2 uppercase tracking-wider">Album</span><span>{item.title}</span></>
    if (item.kind === 'artist') return <><span className="text-xs text-purple-400 mr-2 uppercase tracking-wider">Artist</span><span>{item.name}</span></>
    return <><span className="text-xs text-green-400 mr-2 uppercase tracking-wider">Playlist</span><span>{item.name}</span></>
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[15%] z-[61] w-full max-w-xl -translate-x-1/2 bg-[#1a1420] border border-white/[0.12] rounded-2xl shadow-modal overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
              <Search size={18} className="text-tertiary shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search tracks, albums, artists, playlists..."
                className="flex-1 bg-transparent text-primary placeholder:text-tertiary text-[15px] outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-tertiary hover:text-primary transition-colors">
                  <X size={16} />
                </button>
              )}
              <kbd className="text-[11px] text-muted bg-surface-2 px-1.5 py-0.5 rounded border border-white/[0.06]">Esc</kbd>
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto py-2">
                {results.map((item, i) => (
                  <button
                    key={i}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors',
                      i === selected ? 'bg-white/[0.07] text-primary' : 'text-secondary hover:bg-white/[0.04]'
                    )}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => handleSelect(item)}
                  >
                    {iconFor(item.kind)}
                    <span className="truncate">{labelFor(item)}</span>
                  </button>
                ))}
              </div>
            ) : query ? (
              <div className="py-10 text-center text-sm text-tertiary">
                No results for <span className="text-primary">"{query}"</span>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-tertiary">
                Start typing to search your library
              </div>
            )}

            {/* Footer hint */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[11px] text-muted">
              <span><kbd className="bg-surface-2 px-1 py-0.5 rounded border border-white/[0.06]">↑↓</kbd> navigate</span>
              <span><kbd className="bg-surface-2 px-1 py-0.5 rounded border border-white/[0.06]">↵</kbd> select</span>
              <span><kbd className="bg-surface-2 px-1 py-0.5 rounded border border-white/[0.06]">Esc</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
