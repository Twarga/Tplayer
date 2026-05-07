import { app, BrowserWindow, nativeTheme } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'

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

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0D0D0D',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.loadURL(getRendererUrl())

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('resize', () => {
    if (mainWindow) {
      const [width] = mainWindow.getSize()
      if (width < 1024 && mainWindow.isMaximized() === false) {
        mainWindow.setAlwaysOnTop(true)
      } else {
        mainWindow.setAlwaysOnTop(false)
      }
    }
  })
}

async function initApp(): Promise<void> {
  try {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 900,
      minHeight: 600,
      backgroundColor: '#0D0D0D',
      webPreferences: {
        preload: getPreloadPath(),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    mainWindow.loadURL(getRendererUrl())

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    if (mainWindow) {
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('[Tplayer] Window ready')
      })
    }

  } catch (error) {
    console.error('[Tplayer] Failed to initialize:', error)
  }
}

app.whenReady().then(() => {
  initApp()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

nativeTheme.on('updated', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('theme:system-changed', {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors
    })
  }
})

export { mainWindow }
