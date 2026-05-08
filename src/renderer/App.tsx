import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { NowPlayingPanel } from '@/components/layout/NowPlayingPanel'
import { MiniPlayerBar } from '@/components/layout/MiniPlayerBar'
import { HomeView } from '@/components/home/HomeView'
import { LibraryView } from '@/components/library/LibraryView'
import { AlbumView } from '@/components/library/AlbumView'
import { ArtistView } from '@/components/library/ArtistView'
import { PlaylistListView } from '@/components/playlist/PlaylistListView'
import { PlaylistDetailView } from '@/components/playlist/PlaylistDetailView'
import { YouTubeView } from '@/components/youtube/YouTubeView'
import { SettingsView } from '@/components/settings/SettingsView'
import { QueueView } from '@/components/queue/QueueView'
import { DownloadsView } from '@/components/downloads/DownloadsView'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePlaylistStore } from '@/stores/playlistStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useEqStore } from '@/stores/eqStore'
import { useQueueStore } from '@/stores/queueStore'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboard'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { ToastProvider } from '@/stores/toastStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EdgeCaseHandler } from '@/components/EdgeCaseHandler'
import { TooltipProvider } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { pageMotion, routeTransition } from '@/lib/animations'

const VIEW_META: Record<string, { title: string; subtitle: string }> = {
  home: {
    title: 'Overview',
    subtitle: 'Jump back into your library, queue, and imports without extra dashboard noise.',
  },
  library: {
    title: 'Library',
    subtitle: 'Browse and start playback from your local collection.',
  },
  songs: {
    title: 'Library',
    subtitle: 'Browse and start playback from your local collection.',
  },
  albums: {
    title: 'Albums',
    subtitle: 'Scan your collection by release instead of by file list.',
  },
  artists: {
    title: 'Artists',
    subtitle: 'Move through your library by artist and album.',
  },
  playlists: {
    title: 'Playlists',
    subtitle: 'Keep your saved listening flows in one place.',
  },
  youtube: {
    title: 'YouTube Import',
    subtitle: 'Search, import, and pull new tracks into the local library.',
  },
  downloads: {
    title: 'Downloads',
    subtitle: 'Track the status of imported audio and recent download history.',
  },
  queue: {
    title: 'Queue',
    subtitle: 'Inspect and reorder what plays next.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Control folders, tools, accounts, and playback behavior.',
  },
}

function AppShell() {
  const [activeView, setActiveView] = useState('library')
  const [npPanelOpen, setNpPanelOpen] = useState(true)

  const { init: initPlayer } = usePlayerStore()
  const { init: initLibrary, loadTracks } = useLibraryStore()
  const { loadPlaylists } = usePlaylistStore()
  const { load: loadSettings } = useSettingsStore()
  const { init: initEq } = useEqStore()
  const { init: initQueue, loadQueue } = useQueueStore()
  const { init: initYoutube } = useYouTubeStore()

  useAudioPlayer()
  useKeyboardShortcuts()

  useEffect(() => {
    const c1 = initPlayer()
    const c2 = initLibrary()
    initEq()
    const c3 = initQueue()
    const c4 = initYoutube()
    loadSettings().then(() => {
      loadTracks()
      loadPlaylists()
      loadQueue()
    })
    
    return () => {
      c1()
      c2()
      c3()
      c4()
    }
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
    if (activeView.startsWith('playlist-')) {
      const id = parseInt(activeView.replace('playlist-', ''), 10)
      return <PlaylistDetailView playlistId={id} />
    }

    switch (activeView) {
      case 'home':
        return <HomeView onViewChange={setActiveView} />
      case 'library':
      case 'songs':
        return <LibraryView onViewChange={setActiveView} />
      case 'albums':
        return <AlbumView />
      case 'artists':
        return <ArtistView />
      case 'playlists':
        return <PlaylistListView />
      case 'youtube':
        return <YouTubeView />
      case 'downloads':
        return <DownloadsView />
      case 'queue':
        return <QueueView />
      case 'settings':
        return <SettingsView />
      default:
        return <LibraryView onViewChange={setActiveView} />
    }
  }

  const viewMeta =
    activeView.startsWith('playlist-')
      ? {
          title: 'Playlist',
          subtitle: 'Focus on one saved queue and play through it cleanly.',
        }
      : VIEW_META[activeView] ?? VIEW_META.library

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen w-screen bg-background text-primary overflow-hidden flex flex-col">
        <div className="flex flex-1 overflow-hidden p-3 gap-3">
          <ErrorBoundary>
            <Sidebar activeView={activeView} onViewChange={setActiveView} />
          </ErrorBoundary>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0 rounded-[28px] border border-border-subtle bg-surface-panel shadow-card">
            <TopBar
              activeView={activeView}
              title={viewMeta.title}
              subtitle={viewMeta.subtitle}
              onViewChange={setActiveView}
            />
            <main className="flex-1 overflow-hidden relative px-2 pb-2">
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    variants={pageMotion}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={routeTransition}
                    className="absolute inset-0 overflow-hidden rounded-[24px]"
                  >
                    {renderView()}
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </main>
          </div>

          <NowPlayingPanel collapsed={!npPanelOpen} onToggle={() => setNpPanelOpen(false)} />
        </div>

        <ErrorBoundary>
          <MiniPlayerBar onQueueClick={() => setActiveView('queue')} />
        </ErrorBoundary>
      </div>
    </TooltipProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EdgeCaseHandler />
        <AppShell />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
