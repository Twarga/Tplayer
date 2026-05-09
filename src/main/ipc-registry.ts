import { ipcMain, BrowserWindow } from 'electron'
import {
  addMusicFolder,
  addTracksToPlaylist,
  createPlaylist,
  deletePlaylist,
  getAllSettings,
  getCoversByAlbums,
  getDownloads,
  getMusicFolders,
  getPlaylistTracks,
  getPlaylists,
  getQueueTracksByIds,
  getSetting,
  getTrackById,
  getTracks,
  recordTrackPlay,
  removeMusicFolder,
  removeTrackFromPlaylist,
  renamePlaylist,
  reorderPlaylistTracks,
  setSetting,
  toggleFavoriteTrack,
} from './database'
import { scanFolders } from './library-scanner'
import { playTrack, pause, resume, togglePlay, nextTrack, prevTrack, seek, setVolume, toggleShuffle, cycleRepeat, addToQueue, addNext, removeFromQueue, clearQueue, reorderQueue, getQueue, onTrackEnded, setQueue, syncPlaybackProgress } from './audio-engine'
import { isFFmpegAvailable } from './audio-decoder'
import { clearDownloadHistory } from './yt-dlp'
import { updateWatchedFolders } from './file-watcher'
import { IPC_CHANNELS } from '../shared/ipc/channels'

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

  ipcMain.handle(IPC_CHANNELS.library.getTracks, async (_, opts) => {
    return getTracks(opts)
  })

  ipcMain.handle(IPC_CHANNELS.library.getTrack, async (_, id: number) => {
    return getTrackById(id)
  })

  ipcMain.handle(IPC_CHANNELS.library.toggleFavorite, async (_, id: number) => {
    toggleFavoriteTrack(id)
  })

  ipcMain.handle(IPC_CHANNELS.library.getCovers, async (_, albums: string[]) => {
    return getCoversByAlbums(albums)
  })

  ipcMain.handle(IPC_CHANNELS.library.getDownloads, async () => {
    return getDownloads()
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
    recordTrackPlay(trackId)
  })

  ipcMain.handle(IPC_CHANNELS.player.syncProgress, async (_, payload) => {
    syncPlaybackProgress(payload)
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
    return getPlaylists()
  })

  ipcMain.handle(IPC_CHANNELS.playlist.create, async (_, name: string, desc?: string) => {
    return createPlaylist(name, desc || '')
  })

  ipcMain.handle(IPC_CHANNELS.playlist.delete, async (_, id: number) => {
    deletePlaylist(id)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.rename, async (_, id: number, name: string) => {
    renamePlaylist(id, name)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.getTracks, async (_, id: number) => {
    return getPlaylistTracks(id)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.addTracks, async (_, playlistId: number, trackIds: number[]) => {
    addTracksToPlaylist(playlistId, trackIds)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.removeTrack, async (_, playlistId: number, trackId: number) => {
    removeTrackFromPlaylist(playlistId, trackId)
  })

  ipcMain.handle(IPC_CHANNELS.playlist.reorder, async (_, playlistId: number, fromPos: number, toPos: number) => {
    reorderPlaylistTracks(playlistId, fromPos, toPos)
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
    return getQueueTracksByIds(getQueue())
  })
}

function registerYouTubeHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.youtube.search, async (_, query: string) => {
    const { searchYoutube } = await import('./yt-dlp')
    return searchYoutube(query)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.getPlaylistInfo, async (_, url: string) => {
    const { fetchPlaylistVideos } = await import('./yt-dlp')
    return fetchPlaylistVideos(url)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.download, async (_, url: string, videoId: string, title?: string, options?: any) => {
    const { downloadAudio } = await import('./yt-dlp')
    return downloadAudio(url, videoId, title, options)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.downloadBatch, async (_, urls: string[], options: any, playlistUrl?: string) => {
    const { downloadBatch } = await import('./yt-dlp')
    return downloadBatch(urls, options, playlistUrl)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.cancelDownload, async (_, videoId: string) => {
    const { cancelDownload } = await import('./yt-dlp')
    return cancelDownload(videoId)
  })

  ipcMain.handle(IPC_CHANNELS.youtube.getHistory, async () => {
    return getDownloads()
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
    return getMusicFolders()
  })

  ipcMain.handle(IPC_CHANNELS.settings.addFolder, async (_, folderPath: string) => {
    addMusicFolder(folderPath)
    updateWatchedFolders()
  })

  ipcMain.handle(IPC_CHANNELS.settings.removeFolder, async (_, folderPath: string) => {
    removeMusicFolder(folderPath)
    updateWatchedFolders()
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
  ipcMain.handle(IPC_CHANNELS.lastfm.auth, async (_, apiKey: string, secret?: string) => {
    const { auth } = await import('./lastfm')
    return auth(apiKey, secret || '')
  })

  ipcMain.handle(IPC_CHANNELS.lastfm.isAuthd, async () => {
    const { isAuthd } = await import('./lastfm')
    return isAuthd()
  })

  ipcMain.handle(IPC_CHANNELS.lastfm.disconnect, async () => {
    const { disconnect } = await import('./lastfm')
    disconnect()
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
    const { checkYtDlpAvailability } = await import('./yt-dlp')
    return checkYtDlpAvailability()
  })

  ipcMain.on(IPC_CHANNELS.system.log, (_event, ...args) => {
    console.log('[renderer]', ...args)
  })
}
