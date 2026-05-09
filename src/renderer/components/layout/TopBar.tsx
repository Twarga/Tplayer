import { useState, useEffect, useRef } from 'react'
import { Search, Bell, SlidersHorizontal, UserRound } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Input } from '@/components/ui/input'

interface TopBarProps {
  activeView: string
  title: string
  subtitle: string
  onViewChange?: (view: string) => void
  onSearch?: (query: string) => void
}

export function TopBar({ title, subtitle, onViewChange, onSearch }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('')
  const { search } = useLibraryStore()
  const { settings } = useSettingsStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)
  const displayName = (settings.display_name || 'Twarga').trim() || 'Twarga'

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
    <div className="px-8 pt-6 pb-4 flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <div className="relative max-w-[520px] mb-7">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-tertiary pointer-events-none" />
          <Input
            ref={inputRef}
            value={searchValue}
            onChange={handleSearch}
            placeholder="Search songs, artists, albums..."
            className="pl-10 pr-16 h-10 rounded-full bg-[#151018]/85 border-white/[0.11] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted bg-surface-2 px-2 py-1 rounded-md border border-white/[0.06]">
            Ctrl K
          </span>
        </div>

        <div>
          <h1 className="font-display text-[2.05rem] font-bold text-primary mt-1 truncate">{title}</h1>
          <p className="text-sm text-secondary mt-1.5 max-w-2xl leading-6">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 pt-0.5">
        <button
          onClick={() => onViewChange?.('settings')}
          className="text-secondary hover:text-accent interactive-soft"
          title="Audio settings"
        >
          <SlidersHorizontal size={18} />
        </button>
        <button className="text-secondary hover:text-accent interactive-soft" title="Notifications">
          <Bell size={16} />
        </button>
        <button
          onClick={() => onViewChange?.('settings')}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary interactive-soft"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/14 text-accent">
            <UserRound size={15} />
          </span>
          <span>{displayName}</span>
        </button>
      </div>
    </div>
  )
}
