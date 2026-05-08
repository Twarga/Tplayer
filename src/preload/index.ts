import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { TplayerAPI } from '../shared/ipc/contracts'
import { IPC_CHANNELS } from '../shared/ipc/channels'

type CleanupFn = () => void

function createListener<T>(channel: string) {
  return (callback: (payload: T) => void): CleanupFn => {
    const listener = (_event: IpcRendererEvent, payload: T) => callback(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

function createVoidListener(channel: string) {
  return (callback: () => void): CleanupFn => {
    const listener = (_event: IpcRendererEvent) => callback()
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  }
}

const tplayerAPI: TplayerAPI = {
  library: {
    scan: (folders: string[]) => ipcRenderer.invoke(IPC_CHANNELS.library.scan, folders),
    getTracks: (opts?: { query?: string; sort?: string; dir?: string; limit?: number; offset?: number }) =>
      ipcRenderer.invoke(IPC_CHANNELS.library.getTracks, opts),
    getTrack: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.library.getTrack, id),
    toggleFavorite: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.library.toggleFavorite, id),
    getCovers: (albums: string[]) => ipcRenderer.invoke(IPC_CHANNELS.library.getCovers, albums),
    getDownloads: () => ipcRenderer.invoke(IPC_CHANNELS.library.getDownloads),
    onFileAdded: createListener(IPC_CHANNELS.library.fileAdded),
    onFileRemoved: createListener(IPC_CHANNELS.library.fileRemoved),
    onScanProgress: createListener(IPC_CHANNELS.library.scanProgress),
    onBatchAdded: createListener(IPC_CHANNELS.library.batchAdded),
  },

  player: {
    play: (trackId: number) => ipcRenderer.invoke(IPC_CHANNELS.player.play, trackId),
    pause: () => ipcRenderer.invoke(IPC_CHANNELS.player.pause),
    resume: () => ipcRenderer.invoke(IPC_CHANNELS.player.resume),
    togglePlay: () => ipcRenderer.invoke(IPC_CHANNELS.player.togglePlay),
    next: () => ipcRenderer.invoke(IPC_CHANNELS.player.next),
    prev: () => ipcRenderer.invoke(IPC_CHANNELS.player.prev),
    trackEnded: () => ipcRenderer.invoke(IPC_CHANNELS.player.trackEnded),
    recordPlay: (trackId: number) => ipcRenderer.invoke(IPC_CHANNELS.player.recordPlay, trackId),
    syncProgress: (payload) => ipcRenderer.invoke(IPC_CHANNELS.player.syncProgress, payload),
    seek: (time: number) => ipcRenderer.invoke(IPC_CHANNELS.player.seek, time),
    setVolume: (volume: number) => ipcRenderer.invoke(IPC_CHANNELS.player.setVolume, volume),
    toggleShuffle: () => ipcRenderer.invoke(IPC_CHANNELS.player.toggleShuffle),
    toggleRepeat: () => ipcRenderer.invoke(IPC_CHANNELS.player.toggleRepeat),
    onPlaybackState: createListener(IPC_CHANNELS.player.playbackState),
    onTimeUpdate: createListener(IPC_CHANNELS.player.timeUpdate),
    onLoad: createListener(IPC_CHANNELS.player.load),
    onSeekTo: createListener(IPC_CHANNELS.player.seekTo),
  },

  queue: {
    add: (trackId: number) => ipcRenderer.invoke(IPC_CHANNELS.queue.add, trackId),
    addNext: (trackId: number) => ipcRenderer.invoke(IPC_CHANNELS.queue.addNext, trackId),
    set: (trackIds: number[]) => ipcRenderer.invoke(IPC_CHANNELS.queue.set, trackIds),
    remove: (index: number) => ipcRenderer.invoke(IPC_CHANNELS.queue.remove, index),
    reorder: (from: number, to: number) => ipcRenderer.invoke(IPC_CHANNELS.queue.reorder, from, to),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.queue.clear),
    get: () => ipcRenderer.invoke(IPC_CHANNELS.queue.get),
    onUpdated: createListener(IPC_CHANNELS.queue.updated),
  },

  playlist: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.playlist.list),
    create: (name: string, desc?: string) => ipcRenderer.invoke(IPC_CHANNELS.playlist.create, name, desc),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.playlist.delete, id),
    rename: (id: number, name: string) => ipcRenderer.invoke(IPC_CHANNELS.playlist.rename, id, name),
    getTracks: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.playlist.getTracks, id),
    addTracks: (playlistId: number, trackIds: number[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.playlist.addTracks, playlistId, trackIds),
    removeTrack: (playlistId: number, trackId: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.playlist.removeTrack, playlistId, trackId),
    reorder: (playlistId: number, fromPos: number, toPos: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.playlist.reorder, playlistId, fromPos, toPos),
  },

  youtube: {
    search: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.youtube.search, query),
    download: (url: string, videoId: string, title?: string) => ipcRenderer.invoke(IPC_CHANNELS.youtube.download, url, videoId, title),
    cancelDownload: (videoId: string) => ipcRenderer.invoke(IPC_CHANNELS.youtube.cancelDownload, videoId),
    getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.youtube.getHistory),
    clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.youtube.clearHistory),
    onDownloadProgress: createListener(IPC_CHANNELS.youtube.downloadProgress),
    onDownloadDone: createListener(IPC_CHANNELS.youtube.downloadDone),
    onDownloadError: createListener(IPC_CHANNELS.youtube.downloadError),
    onDownloadStarted: createListener(IPC_CHANNELS.youtube.downloadStarted),
    onDownloadCancelled: createListener(IPC_CHANNELS.youtube.downloadCancelled),
    onHistoryCleared: createVoidListener(IPC_CHANNELS.youtube.historyCleared),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.settings.get, key),
    set: (key: string, value: string) => ipcRenderer.invoke(IPC_CHANNELS.settings.set, key, value),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.settings.getAll),
    getFolders: () => ipcRenderer.invoke(IPC_CHANNELS.settings.getFolders),
    addFolder: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.settings.addFolder, path),
    removeFolder: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.settings.removeFolder, path),
    openFolderDialog: () => ipcRenderer.invoke(IPC_CHANNELS.settings.openFolderDialog),
  },

  eq: {
    setBands: (bands: number[]) => ipcRenderer.invoke(IPC_CHANNELS.eq.setBands, bands),
    setPreset: (preset: string) => ipcRenderer.invoke(IPC_CHANNELS.eq.setPreset, preset),
    enable: (enabled: boolean) => ipcRenderer.invoke(IPC_CHANNELS.eq.enable, enabled),
    getEnabled: () => ipcRenderer.invoke(IPC_CHANNELS.eq.getEnabled),
    onBandsChanged: createListener(IPC_CHANNELS.eq.bandsChanged),
  },

  lastfm: {
    auth: (apiKey: string, secret?: string) => ipcRenderer.invoke(IPC_CHANNELS.lastfm.auth, apiKey, secret),
    isAuthd: () => ipcRenderer.invoke(IPC_CHANNELS.lastfm.isAuthd),
    disconnect: () => ipcRenderer.invoke(IPC_CHANNELS.lastfm.disconnect),
    nowPlaying: (artist: string, track: string, album?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.lastfm.nowPlaying, artist, track, album),
    scrobble: (artist: string, track: string, album?: string, timestamp?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.lastfm.scrobble, artist, track, album, timestamp),
  },

  system: {
    checkFfmpeg: () => ipcRenderer.invoke(IPC_CHANNELS.system.checkFfmpeg),
    checkYtDlp: () => ipcRenderer.invoke(IPC_CHANNELS.system.checkYtDlp),
    log: (...args: any[]) => ipcRenderer.send(IPC_CHANNELS.system.log, ...args),
  },
}

contextBridge.exposeInMainWorld('tplayerAPI', tplayerAPI)
