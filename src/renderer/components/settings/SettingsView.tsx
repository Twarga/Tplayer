import { useEffect, useState } from 'react'
import { FolderOpen, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { api } from '@/lib/ipc'
// @ts-ignore – JSON import
import pkg from '../../../../package.json'

const ACCENT_COLORS = [
  { name: 'Amber', value: 'amber', color: '#E8A87C' },
  { name: 'Green', value: 'green', color: '#1DB954' },
  { name: 'Blue', value: 'blue', color: '#1E90FF' },
  { name: 'Purple', value: 'purple', color: '#8B5CF6' },
  { name: 'Orange', value: 'orange', color: '#F97316' },
  { name: 'Pink', value: 'pink', color: '#EC4899' },
]

export function SettingsView() {
  const { musicFolders, settings, load, set, addFolder, removeFolder, getBoolean } = useSettingsStore()
  const { loadTracks, scanProgress } = useLibraryStore()
  const { theme, accent, setTheme, setAccent } = useTheme()
  const [lastFmConnected, setLastFmConnected] = useState(false)
  const [lastFmBusy, setLastFmBusy] = useState(false)
  const [lastFmMessage, setLastFmMessage] = useState<string>('')

  useEffect(() => {
    void load()
    void refreshLastFmState()
  }, [])

  useEffect(() => {
    if (lastFmConnected) {
      setLastFmMessage(`Connected${settings.lastfm_username ? ` as ${settings.lastfm_username}` : ''}.`)
    }
  }, [lastFmConnected, settings.lastfm_username])

  const refreshLastFmState = async () => {
    try {
      const connected = await api.lastfm.isAuthd()
      setLastFmConnected(connected)
      setLastFmMessage(
        connected
          ? `Connected${settings.lastfm_username ? ` as ${settings.lastfm_username}` : ''}.`
          : 'Not connected.'
      )
    } catch (err) {
      console.error('[settings] lastfm status failed:', err)
      setLastFmConnected(false)
      setLastFmMessage('Unable to read Last.fm status.')
    }
  }

  const handleLastFmConnect = async () => {
    setLastFmBusy(true)
    setLastFmMessage('Waiting for Last.fm approval in your browser...')
    try {
      const username = await api.lastfm.auth(settings.lastfm_api_key || '', settings.lastfm_secret || '')
      await load()
      setLastFmConnected(true)
      setLastFmMessage(username ? `Connected as ${username}.` : 'Connected to Last.fm.')
    } catch (err) {
      console.error('[settings] lastfm auth failed:', err)
      setLastFmConnected(false)
      setLastFmMessage(err instanceof Error ? err.message : 'Last.fm connection failed.')
    } finally {
      setLastFmBusy(false)
    }
  }

  const handleLastFmDisconnect = async () => {
    setLastFmBusy(true)
    try {
      await api.lastfm.disconnect()
      await load()
      setLastFmConnected(false)
      setLastFmMessage('Disconnected from Last.fm.')
    } catch (err) {
      console.error('[settings] lastfm disconnect failed:', err)
      setLastFmMessage('Failed to disconnect Last.fm.')
    } finally {
      setLastFmBusy(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <div className="max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">Settings</h1>
        <p className="mb-8 max-w-2xl text-sm leading-6 text-secondary">
          Control your profile, folders, tools, accounts, and playback behavior.
        </p>

      <section className="mb-8 border-y border-white/[0.06] py-5">
        <h2 className="text-lg font-semibold text-primary mb-4">Profile</h2>
        <div className="max-w-xl">
          <p className="text-sm text-secondary mb-2">Display name</p>
          <Input
            value={settings.display_name || 'Twarga'}
            onChange={(e) => set('display_name', e.target.value)}
            placeholder="Your name"
          />
          <p className="text-xs text-tertiary mt-2">Shown in the top bar. Default is Twarga.</p>
        </div>
      </section>

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
        <h2 className="text-lg font-semibold text-primary mb-4">Library Behavior</h2>

        <div className="flex items-center justify-between bg-surface-1 rounded-md px-4 py-3 border border-border-subtle">
          <div>
            <p className="text-sm font-medium text-primary">Scan on startup</p>
            <p className="text-xs text-tertiary mt-1">Automatically scan configured music folders when the app launches.</p>
          </div>
          <Switch
            checked={getBoolean('scan_on_startup', true)}
            onCheckedChange={(checked) => set('scan_on_startup', checked ? 'true' : 'false')}
          />
        </div>
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
        <h2 className="text-lg font-semibold text-primary mb-4">Tools</h2>
        <div>
          <p className="text-sm text-secondary mb-3">`yt-dlp` Path</p>
          <Input
            value={settings.yt_dlp_path || ''}
            onChange={(e) => set('yt_dlp_path', e.target.value)}
            placeholder="Leave empty to use system path detection"
          />
          <p className="text-xs text-tertiary mt-2">Use this if `yt-dlp` is installed in a custom location.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Last.fm</h2>
        <p className="text-sm text-secondary mb-4">Connect your Last.fm account to scrobble plays.</p>
        <div className="space-y-4 border-y border-white/[0.06] py-4">
          <div>
            <p className="text-sm text-secondary mb-2">API Key</p>
            <Input
              value={settings.lastfm_api_key || ''}
              onChange={(e) => set('lastfm_api_key', e.target.value)}
              placeholder="Your Last.fm API key"
            />
          </div>
          <div>
            <p className="text-sm text-secondary mb-2">Shared Secret</p>
            <Input
              value={settings.lastfm_secret || ''}
              onChange={(e) => set('lastfm_secret', e.target.value)}
              placeholder="Your Last.fm shared secret"
              type="password"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={cn('text-sm font-medium', lastFmConnected ? 'text-green-400' : 'text-primary')}>
                {lastFmConnected ? 'Last.fm connected' : 'Last.fm not connected'}
              </p>
              <p className="text-xs text-tertiary mt-1">{lastFmMessage || 'Authorize in your browser, then return to Tplayer.'}</p>
            </div>
            <div className="flex gap-2">
              {lastFmConnected && (
                <Button variant="ghost" size="sm" onClick={handleLastFmDisconnect} disabled={lastFmBusy}>
                  Disconnect
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLastFmConnect}
                disabled={lastFmBusy || !(settings.lastfm_api_key || '').trim() || !(settings.lastfm_secret || '').trim()}
              >
                {lastFmBusy ? 'Waiting...' : lastFmConnected ? 'Reconnect' : 'Connect Last.fm'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-primary mb-4">About</h2>
        <p className="text-sm text-secondary">Tplayer v{pkg.version}</p>
        <p className="text-xs text-tertiary mt-1">A local-first desktop music player with YouTube import.</p>
      </section>
      </div>
    </div>
  )
}
