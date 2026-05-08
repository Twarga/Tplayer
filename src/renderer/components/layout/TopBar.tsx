import { useState, useEffect, useRef } from 'react'
import { Search, Download, Library, ListMusic, Settings, PlaySquare } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TopBarProps {
  activeView: string
  title: string
  subtitle: string
  onViewChange?: (view: string) => void
  onSearch?: (query: string) => void
}

export function TopBar({ activeView, title, subtitle, onViewChange, onSearch }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('')
  const { search } = useLibraryStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    
    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      search(value)
      onSearch?.(value)
    }, 300)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="px-7 pt-6 pb-5 flex items-start justify-between gap-6 border-b border-border-subtle bg-surface-panel/80 backdrop-glass">
      <div className="min-w-0 flex-1">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-tertiary">Tplayer</p>
          <h1 className="font-display text-[2rem] font-bold text-primary mt-1 truncate">{title}</h1>
          <p className="text-sm text-secondary mt-1.5 max-w-2xl leading-6">{subtitle}</p>
        </div>

        <div className="relative max-w-[520px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-tertiary pointer-events-none" />
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={handleSearch}
            placeholder="Search songs, artists, albums..."
            className="pl-10 pr-16 h-11 rounded-xl bg-input-bg border-input-border shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted bg-surface-2 px-2 py-1 rounded-lg border border-border-subtle">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 pt-1">
        {[
          { view: 'library', label: 'Library', icon: Library },
          { view: 'queue', label: 'Queue', icon: ListMusic },
          { view: 'playlists', label: 'Playlists', icon: PlaySquare },
          { view: 'downloads', label: 'Downloads', icon: Download },
          { view: 'settings', label: 'Settings', icon: Settings },
        ].map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => onViewChange?.(view)}
            className={cn(
              'h-11 px-3.5 rounded-xl border flex items-center gap-2 text-sm interactive-soft',
              activeView === view
                ? 'bg-surface-2 border-border-default text-primary shadow-card'
                : 'bg-surface-1/60 border-border-subtle text-secondary hover:text-primary hover:bg-surface-2'
            )}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
