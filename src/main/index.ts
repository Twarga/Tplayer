import { app, BrowserWindow, nativeTheme } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { registerAllHandlers, setMainWindow } from './ipc-registry'
import { startWatcher, stopWatcher } from './file-watcher'
import { initAudioEngine } from './audio-engine'
import { initMpris, shutdownMpris } from './mpris'
import { getSetting } from './database'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

function getPreloadPath(): string {
  return path.join(__dirname, '../preload/index.js')
}

function getRendererUrl(): string {
  if (process.env.ELECTRON_RENDERER_URL) {
    return process.env.ELECTRON_RENDERER_URL
  }
  return `file://${path.join(__dirname, '../renderer/index.html')}`
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0D0D0D',
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.once('ready-to-show', () => {
    win.show()
    console.log('[Tplayer] Window ready')
  })

  return win
}

app.whenReady().then(async () => {
  try {
    // Initialize database
    initDatabase()
    console.log('[Tplayer] Database initialized')

    // Initialize IPC handlers
    registerAllHandlers()
    console.log('[Tplayer] IPC handlers registered')

    // Create window
    mainWindow = createWindow()
    setMainWindow(mainWindow)

    mainWindow.loadURL(getRendererUrl())

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    // Initialize audio engine with saved volume
    const vol = parseFloat(getSetting('volume') || '0.8')
    initAudioEngine(vol)

    // Start file watcher
    startWatcher()

    // Initialize MPRIS
    initMpris()

    // Handle resize for always-on-top
    mainWindow.on('resize', () => {
      if (mainWindow) {
        const [width] = mainWindow.getSize()
        if (width < 1024 && !mainWindow.isMaximized()) {
          mainWindow.setAlwaysOnTop(true)
        } else {
          mainWindow.setAlwaysOnTop(false)
        }
      }
    })

  } catch (err) {
    console.error('[Tplayer] Failed to initialize:', err)
  }
})

app.on('window-all-closed', () => {
  stopWatcher()
  shutdownMpris()
  closeDatabase()
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && mainWindow === null) {
    mainWindow = createWindow()
    setMainWindow(mainWindow)
    mainWindow.loadURL(getRendererUrl())
  }
})

nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme:system-changed', {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    })
  }
})

export { mainWindow }