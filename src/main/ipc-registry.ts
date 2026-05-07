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
  ipcMain.handle('library:scan', async () => {
    return { added: 0, updated: 0, total: 0 }
  })

  ipcMain.handle('library:get-tracks', async () => {
    return []
  })

  ipcMain.handle('library:get-track', async () => {
    return null
  })

  ipcMain.handle('library:toggle-favorite', async () => {
    // no-op
  })

  ipcMain.handle('library:get-covers', async () => {
    return []
  })
}

function registerPlayerHandlers(): void {
  ipcMain.handle('player:play', async () => {
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

  ipcMain.handle('player:seek', async () => {
    // no-op stub
  })

  ipcMain.handle('player:set-volume', async () => {
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

  ipcMain.handle('playlist:delete', async () => {
    // no-op stub
  })

  ipcMain.handle('playlist:rename', async () => {
    // no-op stub
  })

  ipcMain.handle('playlist:get-tracks', async () => {
    return []
  })

  ipcMain.handle('playlist:add-tracks', async () => {
    // no-op stub
  })

  ipcMain.handle('playlist:remove-track', async () => {
    // no-op stub
  })

  ipcMain.handle('playlist:reorder', async () => {
    // no-op stub
  })
}

function registerQueueHandlers(): void {
  ipcMain.handle('queue:add', async () => {
    // no-op stub
  })

  ipcMain.handle('queue:add-next', async () => {
    // no-op stub
  })

  ipcMain.handle('queue:remove', async () => {
    // no-op stub
  })

  ipcMain.handle('queue:reorder', async () => {
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
  ipcMain.handle('youtube:search', async () => {
    return []
  })

  ipcMain.handle('youtube:download', async () => {
    // no-op stub
  })

  ipcMain.handle('youtube:cancel-download', async () => {
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
  ipcMain.handle('settings:get', async () => {
    return null
  })

  ipcMain.handle('settings:set', async () => {
    // no-op stub
  })

  ipcMain.handle('settings:get-all', async () => {
    return {}
  })

  ipcMain.handle('settings:get-folders', async () => {
    return []
  })

  ipcMain.handle('settings:add-folder', async () => {
    // no-op stub
  })

  ipcMain.handle('settings:remove-folder', async () => {
    // no-op stub
  })

  ipcMain.handle('settings:open-folder-dialog', async () => {
    return null
  })
}

function registerEQHandlers(): void {
  ipcMain.handle('eq:set-bands', async () => {
    // no-op stub
  })

  ipcMain.handle('eq:set-preset', async () => {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  })

  ipcMain.handle('eq:enable', async () => {
    // no-op stub
  })

  ipcMain.handle('eq:get-enabled', async () => {
    return false
  })
}

function registerLastFMHandlers(): void {
  ipcMain.handle('lastfm:auth', async () => {
    return ''
  })

  ipcMain.handle('lastfm:is-authd', async () => {
    return false
  })

  ipcMain.handle('lastfm:disconnect', async () => {
    // no-op stub
  })

  ipcMain.handle('lastfm:now-playing', async () => {
    // no-op stub
  })

  ipcMain.handle('lastfm:scrobble', async () => {
    // no-op stub
  })
}