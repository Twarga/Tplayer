import { ipcMain, BrowserWindow } from 'electron'
import { getDb, getSetting, setSetting, getAllSettings } from './database'
import { scanFolders } from './library-scanner'
import { playTrack, pause, resume, togglePlay, nextTrack, prevTrack, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, addNext, removeFromQueue, clearQueue, reorderQueue, getQueue, onTrackEnded, setQueue } from './audio-engine'
import { isFFmpegAvailable } from './audio-decoder'
import { clearDownloadHistory, getDownloadHistory } from './yt-dlp'

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
  registerSystemHandlers()
}

function registerLibraryHandlers(): void {
  ipcMain.handle('library:scan', async (_, folders: string[]) => {
    return scanFolders(folders)
  })

  ipcMain.handle('library:get-tracks', async (_, opts?: { query?: string; sort?: string; dir?: string; limit?: number; offset?: number }) => {
    const db = getDb()
    let sql = 'SELECT * FROM tracks'
    const params: (string | number)[] = []
    
    if (opts?.query) {
      sql += ' WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?'
      const q = `%${opts.query}%`
      params.push(q, q, q)
    }
    
    if (opts?.sort) {
      const dir = opts.dir === 'desc' ? 'DESC' : 'ASC'
      const sortMap: Record<string, string> = {
        title: 'title',
        artist: 'artist',
        album: 'album',
        date_added: 'date_added',
        play_count: 'play_count',
        duration: 'duration',
      }
      const safeSort = sortMap[opts.sort]
      if (safeSort) {
        sql += ` ORDER BY ${safeSort} ${dir}`
      }
    } else {
      sql += ' ORDER BY date_added DESC'
    }
    
    if (opts?.limit) {
      sql += ' LIMIT ?'
      params.push(opts.limit)
      if (opts.offset) {
        sql += ' OFFSET ?'
        params.push(opts.offset)
      }
    }
    
    return db.prepare(sql).all(...params)
  })

  ipcMain.handle('library:get-track', async (_, id: number) => {
    return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id)
  })

  ipcMain.handle('library:toggle-favorite', async (_, id: number) => {
    getDb().prepare('UPDATE tracks SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
  })

  ipcMain.handle('library:get-covers', async (_, albums: string[]) => {
    if (!albums.length) return []
    const placeholders = albums.map(() => '?').join(',')
    return getDb().prepare(`SELECT * FROM covers WHERE album IN (${placeholders})`).all(...albums)
  })

  ipcMain.handle('library:get-downloads', async () => {
    return getDb().prepare('SELECT * FROM downloads ORDER BY created_at DESC').all()
  })
}

function registerPlayerHandlers(): void {
  ipcMain.handle('player:play', async (_, trackId: number) => {
    await playTrack(trackId)
  })

  ipcMain.handle('player:pause', async () => {
    pause()
  })

  ipcMain.handle('player:resume', async () => {
    resume()
  })

  ipcMain.handle('player:toggle-play', async () => {
    togglePlay()
  })

  ipcMain.handle('player:next', async () => {
    nextTrack()
  })

  ipcMain.handle('player:prev', async () => {
    prevTrack()
  })

  ipcMain.handle('player:track-ended', async () => {
    onTrackEnded()
  })

  ipcMain.handle('player:record-play', async (_, trackId: number) => {
    getDb().prepare("UPDATE tracks SET play_count = play_count + 1, last_played = datetime('now') WHERE id = ?").run(trackId)
  })

  ipcMain.handle('player:seek', async (_, time: number) => {
    seek(time)
  })

  ipcMain.handle('player:set-volume', async (_, volume: number) => {
    setVolume(volume)
    setSetting('volume', volume.toString())
  })

  ipcMain.handle('player:toggle-shuffle', async () => {
    toggleShuffle()
  })

  ipcMain.handle('player:toggle-repeat', async () => {
    cycleRepeat()
  })
}

function registerPlaylistHandlers(): void {
  ipcMain.handle('playlist:list', async () => {
    return getDb().prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all()
  })

  ipcMain.handle('playlist:create', async (_, name: string, desc?: string) => {
    const db = getDb()
    const result = db.prepare('INSERT INTO playlists (name, description) VALUES (?, ?)').run(name, desc || '')
    return db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid)
  })

  ipcMain.handle('playlist:delete', async (_, id: number) => {
    getDb().prepare('DELETE FROM playlists WHERE id = ?').run(id)
  })

  ipcMain.handle('playlist:rename', async (_, id: number, name: string) => {
    getDb().prepare("UPDATE playlists SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id)
  })

  ipcMain.handle('playlist:get-tracks', async (_, id: number) => {
    return getDb().prepare(`
      SELECT t.*, pt.position 
      FROM tracks t 
      JOIN playlist_tracks pt ON t.id = pt.track_id 
      WHERE pt.playlist_id = ? 
      ORDER BY pt.position
    `).all(id)
  })

  ipcMain.handle('playlist:add-tracks', async (_, playlistId: number, trackIds: number[]) => {
    const db = getDb()
    const maxPos = db.prepare('SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?').get(playlistId) as { maxPos: number | null }
    let pos = (maxPos?.maxPos ?? 0) + 1
    const insert = db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)')
    for (const trackId of trackIds) {
      insert.run(playlistId, trackId, pos++)
    }
    db.prepare("UPDATE playlists SET updated_at = datetime('now') WHERE id = ?").run(playlistId)
  })

  ipcMain.handle('playlist:remove-track', async (_, playlistId: number, trackId: number) => {
    getDb().prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, trackId)
  })

  ipcMain.handle('playlist:reorder', async (_, playlistId: number, fromPos: number, toPos: number) => {
    const db = getDb()
    db.prepare('UPDATE playlist_tracks SET position = -1 WHERE playlist_id = ? AND position = ?').run(playlistId, fromPos)
    if (fromPos < toPos) {
      db.prepare('UPDATE playlist_tracks SET position = position - 1 WHERE playlist_id = ? AND position > ? AND position <= ?').run(playlistId, fromPos, toPos)
    } else {
      db.prepare('UPDATE playlist_tracks SET position = position + 1 WHERE playlist_id = ? AND position >= ? AND position < ?').run(playlistId, toPos, fromPos)
    }
    db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND position = -1').run(toPos, playlistId)
  })
}

function registerQueueHandlers(): void {
  ipcMain.handle('queue:add', async (_, trackId: number) => {
    addToQueue(trackId)
  })

  ipcMain.handle('queue:add-next', async (_, trackId: number) => {
    addNext(trackId)
  })

  ipcMain.handle('queue:remove', async (_, index: number) => {
    removeFromQueue(index)
  })

  ipcMain.handle('queue:reorder', async (_, from: number, to: number) => {
    reorderQueue(from, to)
  })

  ipcMain.handle('queue:clear', async () => {
    clearQueue()
  })

  ipcMain.handle('queue:set', async (_, trackIds: number[]) => {
    setQueue(trackIds)
  })

  ipcMain.handle('queue:get', async () => {
    const ids = getQueue()
    if (!ids.length) return []
    const db = getDb()
    const placeholders = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT id, title, artist, album, duration FROM tracks WHERE id IN (${placeholders})`).all(...ids) as any[]
    return ids.map(id => rows.find(r => r.id === id)).filter(Boolean)
  })
}

function registerYouTubeHandlers(): void {
  ipcMain.handle('youtube:search', async (_, query: string) => {
    const { searchYoutube } = await import('./yt-dlp')
    return searchYoutube(query)
  })

  ipcMain.handle('youtube:download', async (_, url: string, videoId: string) => {
    const { downloadAudio } = await import('./yt-dlp')
    return downloadAudio(url, videoId)
  })

  ipcMain.handle('youtube:cancel-download', async (_, videoId: string) => {
    const { cancelDownload } = await import('./yt-dlp')
    return cancelDownload(videoId)
  })

  ipcMain.handle('youtube:get-history', async () => {
    return getDownloadHistory()
  })

  ipcMain.handle('youtube:clear-history', async () => {
    clearDownloadHistory()
  })
}

function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', async (_, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle('settings:set', async (_, key: string, value: string) => {
    setSetting(key, value)
  })

  ipcMain.handle('settings:get-all', async () => {
    return getAllSettings()
  })

  ipcMain.handle('settings:get-folders', async () => {
    const raw = getSetting('music_folders')
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  })

  ipcMain.handle('settings:add-folder', async (_, folderPath: string) => {
    const raw = getSetting('music_folders') || '[]'
    const folders = JSON.parse(raw)
    if (!folders.includes(folderPath)) {
      folders.push(folderPath)
      setSetting('music_folders', JSON.stringify(folders))
    }
  })

  ipcMain.handle('settings:remove-folder', async (_, folderPath: string) => {
    const raw = getSetting('music_folders') || '[]'
    const folders = JSON.parse(raw).filter((f: string) => f !== folderPath)
    setSetting('music_folders', JSON.stringify(folders))
  })

  ipcMain.handle('settings:open-folder-dialog', async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.filePaths[0] || null
  })
}

function registerEQHandlers(): void {
  ipcMain.handle('eq:set-bands', async (_, bands: number[]) => {
    setSetting('eq_bands', JSON.stringify(bands))
    send('eq:bands-changed', bands)
  })

  ipcMain.handle('eq:set-preset', async (_, preset: string) => {
    const presets: Record<string, number[]> = {
      Flat: [0,0,0,0,0,0,0,0,0,0],
      Rock: [5,4,3,1,-1,-1,0,2,3,4],
      Pop: [-1,1,3,4,3,0,-1,-1,-1,-2],
      Jazz: [3,2,1,2,-1,-1,0,1,2,3],
      Classical: [4,3,2,1,-1,0,0,2,3,4],
      HipHop: [5,4,1,-2,-1,1,2,0,1,2],
      Electronic: [5,4,1,-1,-2,-1,0,1,3,4],
      VocalBoost: [-2,-1,0,2,4,4,3,1,0,-1],
      BassBoost: [6,5,4,2,0,-1,0,1,2,3],
    }
    return presets[preset] || presets.Flat
  })

  ipcMain.handle('eq:enable', async (_, enabled: boolean) => {
    setSetting('eq_enabled', enabled.toString())
  })

  ipcMain.handle('eq:get-enabled', async () => {
    const val = getSetting('eq_enabled')
    return val === 'true'
  })
}

function registerLastFMHandlers(): void {
  ipcMain.handle('lastfm:auth', async (_, apiKey: string) => {
    setSetting('lastfm_api_key', apiKey)
    return ''
  })

  ipcMain.handle('lastfm:is-authd', async () => {
    const key = getSetting('lastfm_api_key')
    return !!key && key.length > 0
  })

  ipcMain.handle('lastfm:disconnect', async () => {
    setSetting('lastfm_api_key', '')
    setSetting('lastfm_session_key', '')
  })

  ipcMain.handle('lastfm:now-playing', async (_, artist: string, track: string, album?: string) => {
    const { updateNowPlaying } = await import('./lastfm')
    return updateNowPlaying(artist, track, album)
  })

  ipcMain.handle('lastfm:scrobble', async (_, artist: string, track: string, album?: string, timestamp?: number) => {
    const { scrobble } = await import('./lastfm')
    return scrobble(artist, track, album, timestamp)
  })
}

function registerSystemHandlers(): void {
  ipcMain.handle('system:check-ffmpeg', async () => {
    return isFFmpegAvailable()
  })

  ipcMain.handle('system:check-yt-dlp', async () => {
    const { spawnSync } = await import('child_process')
    try {
      const result = spawnSync('yt-dlp', ['--version'], { timeout: 5000 })
      return result.status === 0
    } catch {
      return false
    }
  })

  ipcMain.on('system:log', (_event, ...args) => {
    console.log('[renderer]', ...args)
  })
}
