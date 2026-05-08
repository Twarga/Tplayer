import { useEffect } from 'react'
import { FolderOpen, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

const ACCENT_COLORS = [
  { name: 'Amber', value: 'amber', color: '#E8A87C' },
  { name: 'Green', value: 'green', color: '#1DB954' },
  { name: 'Blue', value: 'blue', color: '#1E90FF' },
  { name: 'Purple', value: 'purple', color: '#8B5CF6' },
  { name: 'Orange', value: 'orange', color: '#F97316' },
  { name: 'Pink', value: 'pink', color: '#EC4899' },
]

export function SettingsView() {
  const { musicFolders, load, addFolder, removeFolder } = useSettingsStore()
  const { loadTracks, scanProgress } = useLibraryStore()
  const { theme, accent, setTheme, setAccent } = useTheme()

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 overflow-y-auto h-full max-w-2xl">
      <h1 className="text-2xl font-bold text-primary mb-8">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Music Folders</h2>

        {musicFolders.length === 0 ? (
          <p className="text-sm text-tertiary mb-4">No music folders added yet.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {musicFolders.map((folder) => (
              <div key={folder} className="flex items-center justify-between bg-surface-1 rounded-md px-4 py-3">
                <div className="flex items-center gap-3">
                  <FolderOpen size={18} className="text-tertiary" />
                  <span className="text-sm text-primary">{folder}</span>
                </div>
                <button
                  onClick={() => removeFolder(folder)}
                  className="text-tertiary hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={addFolder} variant="outline" size="sm">
            <Plus size={16} className="mr-2" /> Add Folder
          </Button>
          {musicFolders.length > 0 && (
            <Button onClick={() => loadTracks()} variant="ghost" size="sm" disabled={!!scanProgress}>
              <RefreshCw size={16} className={cn("mr-2", scanProgress ? "animate-spin" : "")} /> 
              {scanProgress ? 'Scanning...' : 'Rescan All'}
            </Button>
          )}
        </div>

        {scanProgress && (
          <div className="mt-4 p-4 bg-surface-1 rounded-md border border-border-subtle">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Scanning Library</p>
                <p className="text-xs text-tertiary truncate max-w-[400px]" title={scanProgress.path}>
                  {scanProgress.path}
                </p>
              </div>
              <span className="text-xs font-semibold text-accent">
                {scanProgress.processed} / {scanProgress.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${scanProgress.total > 0 ? (scanProgress.processed / scanProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Appearance</h2>

        <div className="mb-4">
          <p className="text-sm text-secondary mb-3">Theme</p>
          <div className="flex gap-3">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? 'bg-accent text-background'
                    : 'bg-surface-2 text-secondary hover:bg-surface-3 hover:text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-secondary mb-3">Accent Color</p>
          <div className="flex gap-3">
            {ACCENT_COLORS.map(({ name, value, color }) => (
              <button
                key={value}
                onClick={() => setAccent(value)}
                className={`w-10 h-10 rounded-full transition-transform hover:scale-110 ${
                  accent === value ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
                }`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Last.fm</h2>
        <p className="text-sm text-secondary mb-3">Connect your Last.fm account to scrobble plays.</p>
        <Button variant="outline" size="sm">
          Connect Last.fm
        </Button>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">About</h2>
        <p className="text-sm text-secondary">Tplayer v0.1.0</p>
        <p className="text-xs text-tertiary mt-1">A beautiful Spotify-like music player for Linux</p>
      </section>
    </div>
  )
}
