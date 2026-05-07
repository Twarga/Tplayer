import { watch, FSWatcher } from 'chokidar'
import path from 'path'
import { getSetting } from './database'
import { scanFolders } from './library-scanner'
import { send } from './ipc-registry'
import { getDb } from './database'

let _watcher: FSWatcher | null = null
let _debounceTimer: ReturnType<typeof setTimeout> | null = null
const _pendingPaths = new Set<string>()

const SUPPORTED_EXTENSIONS = new Set([
  '.mp3', '.flac', '.ogg', '.opus', '.wav', '.aac', '.m4a', '.wma', '.aiff',
])

function isAudioFile(filePath: string): boolean {
  return SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase())
}

function getMusicFolders(): string[] {
  const raw = getSetting('music_folders')
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function startDebounce(): void {
  if (_debounceTimer) clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(async () => {
    if (_pendingPaths.size === 0) return

    const files = Array.from(_pendingPaths)
    _pendingPaths.clear()

    const folders = getMusicFolders()
    if (folders.length === 0) return

    send('library:batch-added', { count: files.length })
    await scanFolders(folders)
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
    const db = getDb()
    db.prepare('DELETE FROM tracks WHERE file_path = ?').run(filePath)
    send('library:file-removed', { filePath })
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