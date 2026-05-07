import { ipcMain, BrowserWindow } from 'electron'

let _mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  _mainWindow = win
}

export function send(channel: string, ...args: unknown[]): void {
  if (_mainWindow && !_mainWindow.isDestroyed()) {
    _mainWindow.webContents.send(channel, ...args)
  }
}

export function registerAllHandlers(): void {
  registerLibraryHandlers()
  registerPlayerHandlers()
  registerPlaylistHandlers()
  registerQueueHandlers()
  registerYouTubeHandlers()
  registerSettingsHandlers()
  registerEQHandlers()
  registerLastFMHandlers()
}

function registerLibraryHandlers(): void {
  ipcMain.handle('library:scan', async (_, folders: string[]) => {
    return { added: 0, updated: 0, total: 0 }
  })

  ipcMain.handle('library:get-tracks', async (_, opts?: { query?: string; sort?: string; dir?: string; limit?: number; offset?: number }) => {
    return []
  })

  ipcMain.handle('library:get-track', async (_, id: number) => {
    return null
  })

  ipcMain.handle('library:toggle-favorite', async (_, id: number) => {
    // no-op
  })

  ipcMain.handle('library:get-covers', async (_, albums: string[]) => {
    return []
  })
}

function registerPlayerHandlers(): void {
  ipcMain.handle('player:play', async (_, trackId: number) => {
    // no-op stub
  })

  ipcMain.handle('player:pause', async () => {
    // no-op stub
  })

  ipcMain.handle('player:resume', async () => {
    // no-op stub
  })

  ipcMain.handle('player:toggle-play', async () => {
    // no-op stub
  })

  ipcMain.handle('player:next', async () => {
    // no-op stub
  })

  ipcMain.handle('player:prev', async () => {
    // no-op stub
  })

  ipcMain.handle('player:seek', async (_, time: number) => {
    // no-op stub
  })

  ipcMain.handle('player:set-volume', async (_, volume: number) => {
    // no-op stub
  })

  ipcMain.handle('player:toggle-shuffle', async () => {
    // no-op stub
  })

  ipcMain.handle('player:toggle-repeat', async () => {
    // no-op stub
  })
}

function registerPlaylistHandlers(): void {
  ipcMain.handle('playlist:list', async () => {
    return []
  })

  ipcMain.handle('playlist:create', async (_, name: string, desc?: string) => {
    return { id: 0, name, description: desc ?? '', created_at: '', updated_at: '' }
  })

  ipcMain.handle('playlist:delete', async (_, id: number) => {
    // no-op stub
  })

  ipcMain.handle('playlist:rename', async (_, id: number, name: string) => {
    // no-op stub
  })

  ipcMain.handle('playlist:get-tracks', async (_, id: number) => {
    return []
  })

  ipcMain.handle('playlist:add-tracks', async (_, playlistId: number, trackIds: number[]) => {
    // no-op stub
  })

  ipcMain.handle('playlist:remove-track', async (_, playlistId: number, trackId: number) => {
    // no-op stub
  })

  ipcMain.handle('playlist:reorder', async (_, playlistId: number, fromPos: number, toPos: number) => {
    // no-op stub
  })
}

function registerQueueHandlers(): void {
  ipcMain.handle('queue:add', async (_, trackId: number) => {
    // no-op stub
  })

  ipcMain.handle('queue:add-next', async (_, trackId: number) => {
    // no-op stub
  })

  ipcMain.handle('queue:remove', async (_, index: number) => {
    // no-op stub
  })

  ipcMain.handle('queue:reorder', async (_, from: number, to: number) => {
    // no-op stub
  })

  ipcMain.handle('queue:clear', async () => {
    // no-op stub
  })

  ipcMain.handle('queue:get', async () => {
    return []
  })
}

function registerYouTubeHandlers(): void {
  ipcMain.handle('youtube:search', async (_, query: string) => {
    return []
  })

  ipcMain.handle('youtube:download', async (_, url: string, videoId: string) => {
    // no-op stub
  })

  ipcMain.handle('youtube:cancel-download', async (_, videoId: string) => {
    // no-op stub
  })

  ipcMain.handle('youtube:get-history', async () => {
    return []
  })

  ipcMain.handle('youtube:clear-history', async () => {
    // no-op stub
  })
}

function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (_, key: string) => {
    return null
  })

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    // no-op stub
  })

  ipcMain.handle('settings:get-all', async () => {
    return {}
  })

  ipcMain.handle('settings:get-folders', async () => {
    return []
  })

  ipcMain.handle('settings:add-folder', async (_, path: string) => {
    // no-op stub
  })

  ipcMain.handle('settings:remove-folder', async (_, path: string) => {
    // no-op stub
  })

  ipcMain.handle('settings:open-folder-dialog', async () => {
    return null
  })
}

function registerEQHandlers(): void {
  ipcMain.handle('eq:set-bands', async (_, bands: number[]) => {
    // no-op stub
  })

  ipcMain.handle('eq:set-preset', async (_, preset: string) => {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  })

  ipcMain.handle('eq:enable', async (_, enabled: boolean) => {
    // no-op stub
  })

  ipcMain.handle('eq:get-enabled', async () => {
    return false
  })
}

function registerLastFMHandlers(): void {
  ipcMain.handle('lastfm:auth', async (_, apiKey: string) => {
    return ''
  })

  ipcMain.handle('lastfm:is-authd', async () => {
    return false
  })

  ipcMain.handle('lastfm:disconnect', async () => {
    // no-op stub
  })

  ipcMain.handle('lastfm:now-playing', async (_, artist: string, track: string, album?: string) => {
    // no-op stub
  })

  ipcMain.handle('lastfm:scrobble', async (_, artist: string, track: string, album?: string, timestamp?: number) => {
    // no-op stub
  })
}
