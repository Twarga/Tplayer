import { ipcMain, BrowserWindow } from 'electron'
import { getDb, getSetting, setSetting, getAllSettings } from './database'
import { scanFolders } from './library-scanner'
import { playTrack, pause, resume, togglePlay, nextTrack, prevTrack, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, addNext, removeFromQueue, clearQueue, reorderQueue, getQueue, onTrackEnded, setQueue } from './audio-engine'
import { isFFmpegAvailable } from './audio-decoder'
import { clearDownloadHistory, getDownloadHistory } from './yt-dlp'
import { IPC_CHANNELS } from '../shared/ipc/channels'
import type { GetTracksOptions } from '../shared/ipc/contracts'

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
  ipcMain.handle(IPC_CHANNELS.library.scan, async (_, folders: string[]) => {
    return scanFolders(folders)
  })

  ipcMain.handle(IPC_CHANNELS.library.getTracks, async (_, opts?: GetTracksOptions) => {
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

  ipcMain.handle(IPC_CHANNELS.library.getTrack, async (_, id: number) => {
    return getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id)
  })

  ipcMain.handle(IPC_CHANNELS.library.toggleFavorite, async (_, id: number) => {
    getDb().prepare('UPDATE tracks SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
  })

  ipcMain.handle(IPC_CHANNELS.library.getCovers, async (_, albums: string[]) => {
    if (!albums.length) return []
    const placeholders = albums.map(() => '?').join(',')
    return getDb().prepare(`SELECT * FROM covers WHERE album IN (${placeholders})`).all(...albums)
  })

  ipcMain.handle(IPC_CHANNELS.library.getDownloads, async () => {
    return getDb().prepare('SELECT * FROM downloads ORDER BY created_at DESC').all()
  })
}

function registerPlayerHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.player.play, async (_, trackId: number) => {
    await playTrack(trackId)
  })

  ipcMain.handle(IPC_CHANNELS.player.pause, async () => {
    pause()
  })

  ipcMain.handle(IPC_CHANNELS.player.resume, async () => {
    resume()
  })

  ipcMain.handle(IPC_CHANNELS.player.togglePlay, async () => {
    togglePlay()
  })

  ipcMain.handle(IPC_CHANNELS.player.next, async () => {
    nextTrack()
  })

  ipcMain.handle(IPC_CHANNELS.player.prev, async () => {
    prevTrack()
  })

  ipcMain.handle(IPC_CHANNELS.player.trackEnded, async () => {
    onTrackEnded()
  })

  ipcMain.handle(IPC_CHANNELS.player.recordPlay, async (_, trackId: number) => {
    getDb().prepare("UPDATE tracks SET play_count = play_count + 1, last_played = datetime('now') WHERE id = ?").run(trackId)
  })

  ipcMain.handle(IPC_CHANNELS.player.seek, async (_, time: number) => {
    seek(time)
  })

  ipcMain.handle(IPC_CHANNELS.player.setVolume, async (_, volume: number) => {
    setVolume(volume)
    setSetting('volume', volume.toString())
  })

  ipcMain.handle(IPC_CHANNELS.player.toggleShuffle, async () => {
    toggleShuffle()
  })

  ipcMain.handle(IPC_CHANNELS.player.toggleRepeat, async () => {
    cycleRepeat()
  })
}

function registerPlaylistHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.playlist.list, async () => {
    return getDb().prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all()
  })

  ipcMain.handle(IPC_CHANNELS.playlist.create, async (_, name: string, desc?: string) => {
    const db = getDb()
    const result = db.prepare('INSERT INTO playlists (name, description) VALUES (?, ?)').run(name, desc || '')
    return db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.delete, async (_, id: number) => {
    getDb().prepare('DELETE FROM playlists WHERE id = ?').run(id)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.rename, async (_, id: number, name: string) => {
    getDb().prepare("UPDATE playlists SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.getTracks, async (_, id: number) => {
    return getDb().prepare(`
      SELECT t.*, pt.position 
      FROM tracks t 
      JOIN playlist_tracks pt ON t.id = pt.track_id 
      WHERE pt.playlist_id = ? 
      ORDER BY pt.position
    `).all(id)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.addTracks, async (_, playlistId: number, trackIds: number[]) => {
    const db = getDb()
    const maxPos = db.prepare('SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?').get(playlistId) as { maxPos: number | null }
    let pos = (maxPos?.maxPos ?? 0) + 1
    const insert = db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)')
    for (const trackId of trackIds) {
      insert.run(playlistId, trackId, pos++)
    }
    db.prepare("UPDATE playlists SET updated_at = datetime('now') WHERE id = ?").run(playlistId)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.removeTrack, async (_, playlistId: number, trackId: number) => {
    getDb().prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, trackId)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.reorder, async (_, playlistId: number, fromPos: number, toPos: number) => {
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
  ipcMain.handle(IPC_CHANNELS.queue.add, async (_, trackId: number) => {
    addToQueue(trackId)
  })

  ipcMain.handle(IPC_CHANNELS.queue.addNext, async (_, trackId: number) => {
    addNext(trackId)
  })

  ipcMain.handle(IPC_CHANNELS.queue.remove, async (_, index: number) => {
    removeFromQueue(index)
  })

  ipcMain.handle(IPC_CHANNELS.queue.reorder, async (_, from: number, to: number) => {
    reorderQueue(from, to)
  })

  ipcMain.handle(IPC_CHANNELS.queue.clear, async () => {
    clearQueue()
  })

  ipcMain.handle(IPC_CHANNELS.queue.set, async (_, trackIds: number[]) => {
    setQueue(trackIds)
  })

  ipcMain.handle(IPC_CHANNELS.queue.get, async () => {
    const ids = getQueue()
    if (!ids.length) return []
    const db = getDb()
    const placeholders = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT id, title, artist, album, duration FROM tracks WHERE id IN (${placeholders})`).all(...ids) as any[]
    return ids.map(id => rows.find(r => r.id === id)).filter(Boolean)
  })
}

function registerYouTubeHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.youtube.search, async (_, query: string) => {
    const { searchYoutube } = await import('./yt-dlp')
    return searchYoutube(query)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.download, async (_, url: string, videoId: string) => {
    const { downloadAudio } = await import('./yt-dlp')
    return downloadAudio(url, videoId)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.cancelDownload, async (_, videoId: string) => {
    const { cancelDownload } = await import('./yt-dlp')
    return cancelDownload(videoId)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.getHistory, async () => {
    return getDownloadHistory()
  })

  ipcMain.handle(IPC_CHANNELS.youtube.clearHistory, async () => {
    clearDownloadHistory()
  })
}

function registerSettingsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.settings.get, async (_, key: string) => {
    return getSetting(key)
  })

  ipcMain.handle(IPC_CHANNELS.settings.set, async (_, key: string, value: string) => {
    setSetting(key, value)
  })

  ipcMain.handle(IPC_CHANNELS.settings.getAll, async () => {
    return getAllSettings()
  })

  ipcMain.handle(IPC_CHANNELS.settings.getFolders, async () => {
    const raw = getSetting('music_folders')
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  })

  ipcMain.handle(IPC_CHANNELS.settings.addFolder, async (_, folderPath: string) => {
    const raw = getSetting('music_folders') || '[]'
    const folders = JSON.parse(raw)
    if (!folders.includes(folderPath)) {
      folders.push(folderPath)
      setSetting('music_folders', JSON.stringify(folders))
    }
  })

  ipcMain.handle(IPC_CHANNELS.settings.removeFolder, async (_, folderPath: string) => {
    const raw = getSetting('music_folders') || '[]'
    const folders = JSON.parse(raw).filter((f: string) => f !== folderPath)
    setSetting('music_folders', JSON.stringify(folders))
  })

  ipcMain.handle(IPC_CHANNELS.settings.openFolderDialog, async () => {
    const { dialog } = await import('electron')
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.filePaths[0] || null
  })
}

function registerEQHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.eq.setBands, async (_, bands: number[]) => {
    setSetting('eq_bands', JSON.stringify(bands))
    send(IPC_CHANNELS.eq.bandsChanged, bands)
  })

  ipcMain.handle(IPC_CHANNELS.eq.setPreset, async (_, preset: string) => {
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

  ipcMain.handle(IPC_CHANNELS.eq.enable, async (_, enabled: boolean) => {
    setSetting('eq_enabled', enabled.toString())
  })

  ipcMain.handle(IPC_CHANNELS.eq.getEnabled, async () => {
    const val = getSetting('eq_enabled')
    return val === 'true'
  })
}

function registerLastFMHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.lastfm.auth, async (_, apiKey: string) => {
    setSetting('lastfm_api_key', apiKey)
    return ''
  })

  ipcMain.handle(IPC_CHANNELS.lastfm.isAuthd, async () => {
    const key = getSetting('lastfm_api_key')
    return !!key && key.length > 0
  })

  ipcMain.handle(IPC_CHANNELS.lastfm.disconnect, async () => {
    setSetting('lastfm_api_key', '')
    setSetting('lastfm_session_key', '')
  })

  ipcMain.handle(IPC_CHANNELS.lastfm.nowPlaying, async (_, artist: string, track: string, album?: string) => {
    const { updateNowPlaying } = await import('./lastfm')
    return updateNowPlaying(artist, track, album)
  })

  ipcMain.handle(IPC_CHANNELS.lastfm.scrobble, async (_, artist: string, track: string, album?: string, timestamp?: number) => {
    const { scrobble } = await import('./lastfm')
    return scrobble(artist, track, album, timestamp)
  })
}

function registerSystemHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.system.checkFfmpeg, async () => {
    return isFFmpegAvailable()
  })

  ipcMain.handle(IPC_CHANNELS.system.checkYtDlp, async () => {
    const { spawnSync } = await import('child_process')
    try {
      const result = spawnSync('yt-dlp', ['--version'], { timeout: 5000 })
      return result.status === 0
    } catch {
      return false
    }
  })

  ipcMain.on(IPC_CHANNELS.system.log, (_event, ...args) => {
    console.log('[renderer]', ...args)
  })
}
