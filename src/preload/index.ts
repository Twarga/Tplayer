import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { TplayerAPI } from '../shared/ipc/contracts'

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
    scan: (folders: string[]) => ipcRenderer.invoke('library:scan', folders),
    getTracks: (opts?: { query?: string; sort?: string; dir?: string; limit?: number; offset?: number }) =>
      ipcRenderer.invoke('library:get-tracks', opts),
    getTrack: (id: number) => ipcRenderer.invoke('library:get-track', id),
    toggleFavorite: (id: number) => ipcRenderer.invoke('library:toggle-favorite', id),
    getCovers: (albums: string[]) => ipcRenderer.invoke('library:get-covers', albums),
    getDownloads: () => ipcRenderer.invoke('library:get-downloads'),
    onFileAdded: createListener('library:file-added'),
    onFileRemoved: createListener('library:file-removed'),
    onScanProgress: createListener('library:scan-progress'),
    onBatchAdded: createListener('library:batch-added'),
  },

  player: {
    play: (trackId: number) => ipcRenderer.invoke('player:play', trackId),
    pause: () => ipcRenderer.invoke('player:pause'),
    resume: () => ipcRenderer.invoke('player:resume'),
    togglePlay: () => ipcRenderer.invoke('player:toggle-play'),
    next: () => ipcRenderer.invoke('player:next'),
    prev: () => ipcRenderer.invoke('player:prev'),
    trackEnded: () => ipcRenderer.invoke('player:track-ended'),
    recordPlay: (trackId: number) => ipcRenderer.invoke('player:record-play', trackId),
    seek: (time: number) => ipcRenderer.invoke('player:seek', time),
    setVolume: (volume: number) => ipcRenderer.invoke('player:set-volume', volume),
    toggleShuffle: () => ipcRenderer.invoke('player:toggle-shuffle'),
    toggleRepeat: () => ipcRenderer.invoke('player:toggle-repeat'),
    onPlaybackState: createListener('player:playback-state'),
    onTimeUpdate: createListener('player:time-update'),
    onLoad: createListener('player:load'),
    onEnded: createVoidListener('player:ended'),
    onSeekTo: createListener('player:seek-to'),
  },

  queue: {
    add: (trackId: number) => ipcRenderer.invoke('queue:add', trackId),
    addNext: (trackId: number) => ipcRenderer.invoke('queue:add-next', trackId),
    set: (trackIds: number[]) => ipcRenderer.invoke('queue:set', trackIds),
    remove: (index: number) => ipcRenderer.invoke('queue:remove', index),
    reorder: (from: number, to: number) => ipcRenderer.invoke('queue:reorder', from, to),
    clear: () => ipcRenderer.invoke('queue:clear'),
    get: () => ipcRenderer.invoke('queue:get'),
    onUpdated: createListener('queue:updated'),
  },

  playlist: {
    list: () => ipcRenderer.invoke('playlist:list'),
    create: (name: string, desc?: string) => ipcRenderer.invoke('playlist:create', name, desc),
    delete: (id: number) => ipcRenderer.invoke('playlist:delete', id),
    rename: (id: number, name: string) => ipcRenderer.invoke('playlist:rename', id, name),
    getTracks: (id: number) => ipcRenderer.invoke('playlist:get-tracks', id),
    addTracks: (playlistId: number, trackIds: number[]) =>
      ipcRenderer.invoke('playlist:add-tracks', playlistId, trackIds),
    removeTrack: (playlistId: number, trackId: number) =>
      ipcRenderer.invoke('playlist:remove-track', playlistId, trackId),
    reorder: (playlistId: number, fromPos: number, toPos: number) =>
      ipcRenderer.invoke('playlist:reorder', playlistId, fromPos, toPos),
  },

  youtube: {
    search: (query: string) => ipcRenderer.invoke('youtube:search', query),
    download: (url: string, videoId: string) => ipcRenderer.invoke('youtube:download', url, videoId),
    cancelDownload: (videoId: string) => ipcRenderer.invoke('youtube:cancel-download', videoId),
    getHistory: () => ipcRenderer.invoke('youtube:get-history'),
    clearHistory: () => ipcRenderer.invoke('youtube:clear-history'),
    onDownloadProgress: createListener('youtube:download-progress'),
    onDownloadDone: createListener('youtube:download-done'),
    onDownloadError: createListener('youtube:download-error'),
    onDownloadStarted: createListener('youtube:download-started'),
    onDownloadCancelled: createListener('youtube:download-cancelled'),
    onHistoryCleared: createVoidListener('youtube:history-cleared'),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    getFolders: () => ipcRenderer.invoke('settings:get-folders'),
    addFolder: (path: string) => ipcRenderer.invoke('settings:add-folder', path),
    removeFolder: (path: string) => ipcRenderer.invoke('settings:remove-folder', path),
    openFolderDialog: () => ipcRenderer.invoke('settings:open-folder-dialog'),
  },

  eq: {
    setBands: (bands: number[]) => ipcRenderer.invoke('eq:set-bands', bands),
    setPreset: (preset: string) => ipcRenderer.invoke('eq:set-preset', preset),
    enable: (enabled: boolean) => ipcRenderer.invoke('eq:enable', enabled),
    getEnabled: () => ipcRenderer.invoke('eq:get-enabled'),
    onBandsChanged: createListener('eq:bands-changed'),
  },

  lastfm: {
    auth: (apiKey: string, secret?: string) => ipcRenderer.invoke('lastfm:auth', apiKey, secret),
    isAuthd: () => ipcRenderer.invoke('lastfm:is-authd'),
    disconnect: () => ipcRenderer.invoke('lastfm:disconnect'),
    nowPlaying: (artist: string, track: string, album?: string) =>
      ipcRenderer.invoke('lastfm:now-playing', artist, track, album),
    scrobble: (artist: string, track: string, album?: string, timestamp?: number) =>
      ipcRenderer.invoke('lastfm:scrobble', artist, track, album, timestamp),
  },

  system: {
    checkFfmpeg: () => ipcRenderer.invoke('system:check-ffmpeg'),
    checkYtDlp: () => ipcRenderer.invoke('system:check-yt-dlp'),
    log: (...args: any[]) => ipcRenderer.send('system:log', ...args),
  },
}

contextBridge.exposeInMainWorld('tplayerAPI', tplayerAPI)
