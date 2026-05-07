import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { NowPlayingPanel } from '@/components/layout/NowPlayingPanel'
import { MiniPlayerBar } from '@/components/layout/MiniPlayerBar'
import { HomeView } from '@/components/home/HomeView'
import { LibraryView } from '@/components/library/LibraryView'
import { PlaylistListView } from '@/components/playlist/PlaylistListView'
import { YouTubeView } from '@/components/youtube/YouTubeView'
import { EqualizerView } from '@/components/equalizer/EqualizerView'
import { SettingsView } from '@/components/settings/SettingsView'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEqStore } from '@/stores/eqStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboard'
import { ToastProvider } from '@/stores/toastStore'

function AppShell() {
  const [activeView, setActiveView] = useState('home')
  const [npPanelCollapsed, setNpPanelCollapsed] = useState(false)

  const { init: initPlayer, play } = usePlayerStore()
  const { init: initLibrary, loadTracks } = useLibraryStore()
  const { init: initPlaylist, loadPlaylists } = usePlaylistStore()
  const { load: loadSettings } = useSettingsStore()
  const { init: initEq } = useEqStore()

  useKeyboardShortcuts()

  useEffect(() => {
    initPlayer()
    initLibrary()
    initPlaylist()
    initEq()
    loadSettings()
    loadTracks()
    loadPlaylists()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.ctrlKey && e.key === '\\') {
        e.preventDefault()
        setNpPanelCollapsed((v) => !v)
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
      case 'equalizer':
        return <EqualizerView />
      case 'settings':
        return <SettingsView />
      default:
        return <HomeView />
    }
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-hidden">
            {renderView()}
          </main>
        </div>

        <NowPlayingPanel collapsed={npPanelCollapsed} />
      </div>

      <MiniPlayerBar
        onQueueToggle={() => setActiveView('queue')}
        onMiniPlayerToggle={() => {}}
      />
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