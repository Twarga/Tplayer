import { useState, useEffect, useRef } from 'react'
import { Search, BarChart3, Bell, ChevronDown, User } from 'lucide-react'
import { useLibraryStore } from '@/stores/libraryStore'
import { Input } from '@/components/ui/input'

interface TopBarProps {
  onSearch?: (query: string) => void
}

export function TopBar({ onSearch }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('')
  const { search } = useLibraryStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="h-16 px-6 flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-[500px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-tertiary pointer-events-none" />
        <Input
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
        <button className="w-8 h-8 flex items-center justify-center text-tertiary hover:text-primary transition-colors">
          <BarChart3 size={20} />
        </button>

        <button className="w-8 h-8 flex items-center justify-center text-tertiary hover:text-primary transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-2 transition-colors">
          <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center">
            <User size={16} className="text-secondary" />
          </div>
          <span className="text-sm font-medium text-primary">Younes</span>
          <ChevronDown size={16} className="text-tertiary" />
        </button>
      </div>
    </div>
  )
}