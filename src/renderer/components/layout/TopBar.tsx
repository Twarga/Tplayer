import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { Input } from '@/components/ui/input'

interface TopBarProps {
  onSearch?: (query: string) => void
}

export function TopBar({ onSearch }: TopBarProps) {
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
    <div className="h-16 px-6 flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-[500px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-tertiary pointer-events-none" />
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={handleSearch}
          placeholder="Search songs, artists, albums..."
          className="pl-10 pr-16 h-10 bg-input-bg border-input-border"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted bg-surface-2 px-1.5 py-0.5 rounded">
          Ctrl K
        </span>
      </div>

      <div className="flex items-center gap-3">

        <button className="h-8 pl-1 pr-3 rounded-full bg-black/40 hover:bg-black/60 border border-border-default flex items-center gap-2 transition-colors group">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-background text-xs font-bold">
            U
          </div>
          <span className="text-sm font-medium text-primary">Local User</span>
          <ChevronDown size={14} className="text-tertiary group-hover:text-primary transition-colors" />
        </button>
      </div>
    </div>
  )
}
