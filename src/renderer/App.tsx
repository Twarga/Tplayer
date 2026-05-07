import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { NowPlayingPanel } from '@/components/layout/NowPlayingPanel'
import { MiniPlayerBar } from '@/components/layout/MiniPlayerBar'
import { HomeView } from '@/components/home/HomeView'
import { LibraryView } from '@/components/library/LibraryView'
import { PlaylistListView } from '@/components/playlist/PlaylistListView'
import { YouTubeView } from '@/components/youtube/YouTubeView'
import { SettingsView } from '@/components/settings/SettingsView'
import { QueueView } from '@/components/queue/QueueView'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEqStore } from '@/stores/eqStore'
import { useQueueStore } from '@/stores/queueStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboard'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { ToastProvider } from '@/stores/toastStore'

function AppShell() {
  const [activeView, setActiveView] = useState('home')
  const [npPanelOpen, setNpPanelOpen] = useState(true)

  const { init: initPlayer, play } = usePlayerStore()
  const { init: initLibrary, loadTracks } = useLibraryStore()
  const { loadPlaylists } = usePlaylistStore()
  const { load: loadSettings } = useSettingsStore()
  const { init: initEq } = useEqStore()
  const { loadQueue } = useQueueStore()

  useAudioPlayer()
  useKeyboardShortcuts()

  useEffect(() => {
    initPlayer()
    initLibrary()
    initEq()
    loadSettings().then(() => {
      loadTracks()
      loadPlaylists()
      loadQueue()
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault()
        setNpPanelOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />
      case 'library':
        return <LibraryView onPlayTrack={(id) => play(id)} />
      case 'playlists':
        return <PlaylistListView />
      case 'youtube':
        return <YouTubeView />
      case 'queue':
        return <QueueView />
      case 'settings':
        return <SettingsView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="h-screen w-screen bg-background text-primary overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar />
          <main className="flex-1 overflow-hidden relative">
            {renderView()}
          </main>
        </div>

        <NowPlayingPanel collapsed={!npPanelOpen} onToggle={() => setNpPanelOpen(false)} />
      </div>

      <MiniPlayerBar />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App