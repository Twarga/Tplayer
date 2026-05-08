import { watch, FSWatcher } from 'chokidar'
import path from 'path'
import { deleteTrackByFilePath, getMusicFolders } from './database'
import { scanFile } from './library-scanner'
import { send } from './ipc-registry'
import { IPC_CHANNELS } from '../shared/ipc/channels'

let _watcher: FSWatcher | null = null
let _debounceTimer: ReturnType<typeof setTimeout> | null = null
const _pendingPaths = new Set<string>()

const SUPPORTED_EXTENSIONS = new Set([
  '.mp3', '.flac', '.ogg', '.opus', '.wav', '.aac', '.m4a', '.wma', '.aiff',
])

function isAudioFile(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

function startDebounce(): void {
  if (_debounceTimer) clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(async () => {
    if (_pendingPaths.size === 0) return

    const files = Array.from(_pendingPaths)
    _pendingPaths.clear()

    const addedTracks = []
    for (const filePath of files) {
      const track = await scanFile(filePath)
      if (track) {
        addedTracks.push(track)
        send(IPC_CHANNELS.library.fileAdded, track)
      }
    }

    if (addedTracks.length > 0) {
      send(IPC_CHANNELS.library.batchAdded, { count: addedTracks.length, tracks: addedTracks })
    }
  }, 500)
}

export function startWatcher(): void {
  const folders = getMusicFolders()
  if (folders.length === 0) return

  _watcher = watch(folders, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 2000 },
  })

  _watcher.on('add', (filePath) => {
    if (!isAudioFile(filePath)) return
    _pendingPaths.add(filePath)
    startDebounce()
  })

  _watcher.on('change', (filePath) => {
    if (!isAudioFile(filePath)) return
    _pendingPaths.add(filePath)
    startDebounce()
  })

  _watcher.on('unlink', (filePath) => {
    if (!isAudioFile(filePath)) return
    const track = deleteTrackByFilePath(filePath)
    if (track) {
      send(IPC_CHANNELS.library.fileRemoved, { id: track.id, filePath })
    }
  })

  _watcher.on('error', (err) => {
    console.error('[file-watcher]', err)
  })
}

export function stopWatcher(): void {
  if (_watcher) {
    _watcher.close()
    _watcher = null
  }
  if (_debounceTimer) {
    clearTimeout(_debounceTimer)
    _debounceTimer = null
  }
}

export function addFolder(folderPath: string): void {
  if (_watcher) {
    _watcher.add(folderPath)
  }
}

export function removeFolder(folderPath: string): void {
  if (_watcher) {
    _watcher.unwatch(folderPath)
  }
}

export function updateWatchedFolders(): void {
  stopWatcher()
  startWatcher()
}
