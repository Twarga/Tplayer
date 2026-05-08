import { app, BrowserWindow, nativeTheme, protocol, net } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import { createReadStream, statSync } from 'fs'
import { Readable } from 'stream'
import { initDatabase, closeDatabase, getMusicFolders } from './database'
import { registerAllHandlers, setMainWindow } from './ipc-registry'
import { startWatcher, stopWatcher } from './file-watcher'
import { initAudioEngine } from './audio-engine'
import { initMpris, shutdownMpris } from './mpris'
import { getSetting } from './database'
import { scanFolders } from './library-scanner'

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

function getAudioContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.mp3') return 'audio/mpeg'
  if (ext === '.flac') return 'audio/flac'
  if (ext === '.wav') return 'audio/wav'
  if (ext === '.ogg') return 'audio/ogg'
  if (ext === '.m4a' || ext === '.mp4') return 'audio/mp4'
  if (ext === '.aac') return 'audio/aac'
  return 'application/octet-stream'
}

function createAudioResponse(request: Request, filePath: string): Response {
  const stat = statSync(filePath)
  const size = stat.size
  const range = request.headers.get('range')
  const contentType = getAudioContentType(filePath)

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range)
    if (match) {
      const start = match[1] ? Number(match[1]) : 0
      const end = match[2] ? Number(match[2]) : size - 1
      const safeStart = Math.max(0, Math.min(start, size - 1))
      const safeEnd = Math.max(safeStart, Math.min(end, size - 1))
      const chunkSize = safeEnd - safeStart + 1

      return new Response(Readable.toWeb(createReadStream(filePath, { start: safeStart, end: safeEnd })) as ReadableStream, {
        status: 206,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Range': `bytes ${safeStart}-${safeEnd}/${size}`,
          'Content-Type': contentType,
        },
      })
    }
  }

  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
    status: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': String(size),
      'Content-Type': contentType,
    },
  })
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
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => {
    win.show()
    console.log('[Tplayer] Window ready')
  })

  return win
}

// Register custom protocol for serving local audio files to the renderer
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tplayer-audio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
  {
    scheme: 'tplayer-img',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
    },
  },
])

app.whenReady().then(async () => {
  protocol.handle('tplayer-audio', (request) => {
    const urlStr = request.url
    const encodedPath = urlStr.replace(/^tplayer-audio:\/\/media\//, '')
    const filePath = decodeURIComponent(encodedPath)
    console.log('[protocol] Serving audio file:', filePath)
    return createAudioResponse(request, filePath)
  })
  
  protocol.handle('tplayer-img', (request) => {
    const urlStr = request.url
    const encodedPath = urlStr.replace(/^tplayer-img:\/\/media\//, '')
    const filePath = decodeURIComponent(encodedPath)
    return net.fetch('file://' + filePath)
  })
  console.log('[Tplayer] Audio and Image protocols registered')

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

    if (getSetting('scan_on_startup') === 'true') {
      const folders = getMusicFolders()
      if (folders.length > 0) {
        scanFolders(folders).catch((err) => {
          console.error('[Tplayer] Startup scan failed:', err)
        })
      }
    }

    // Initialize MPRIS
    initMpris(mainWindow)

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
