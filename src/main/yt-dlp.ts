import { spawn } from 'child_process'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getSetting, getDb } from './database'
import { send } from './ipc-registry'
import { scanFile } from './library-scanner'
import type {
  DownloadCancelledPayload,
  DownloadDonePayload,
  DownloadErrorPayload,
  DownloadProgressPayload,
  DownloadStartedPayload,
  ToolAvailabilityPayload,
} from '../shared/ipc/contracts'

export interface YtSearchResult {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
}

let _ytDlpPath: string | null = null
let _ytDlpPathSource: ToolAvailabilityPayload['source'] = 'fallback'
const _activeDownloads = new Map<string, ReturnType<typeof spawn>>()

export function getYtDlpPath(): string {
  if (_ytDlpPath) return _ytDlpPath
  
  const fromSettings = getSetting('yt_dlp_path')
  if (fromSettings) {
    _ytDlpPath = fromSettings
    _ytDlpPathSource = 'settings'
    return _ytDlpPath
  }
  
  // Check common locations
  const home = require('os').homedir()
  const candidates = [
    'yt-dlp',
    path.join(home, '.local', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    path.join(home, 'bin', 'yt-dlp'),
  ]
  
  for (const candidate of candidates) {
    try {
      if (require('fs').existsSync(candidate)) {
        _ytDlpPath = candidate
        _ytDlpPathSource = candidate === 'yt-dlp' ? 'system' : 'bundled'
        return _ytDlpPath
      }
    } catch {}
  }
  
  _ytDlpPath = 'yt-dlp'
  _ytDlpPathSource = 'fallback'
  return _ytDlpPath
}

export async function checkYtDlpAvailability(): Promise<ToolAvailabilityPayload> {
  const { spawnSync } = await import('child_process')
  const ytDlpPath = getYtDlpPath()

  try {
    const result = spawnSync(ytDlpPath, ['--version'], { timeout: 5000 })
    const stderr = result.stderr?.toString().trim()

    if (result.status === 0) {
      return {
        available: true,
        path: ytDlpPath,
        source: _ytDlpPathSource,
      }
    }

    return {
      available: false,
      path: ytDlpPath,
      source: _ytDlpPathSource,
      error: stderr || `yt-dlp exited with code ${result.status ?? 'unknown'}`,
    }
  } catch (error) {
    return {
      available: false,
      path: ytDlpPath,
      source: _ytDlpPathSource,
      error: error instanceof Error ? error.message : 'yt-dlp unavailable',
    }
  }
}

async function runYtDlp(args: string[]): Promise<string> {
  const availability = await checkYtDlpAvailability()
  if (!availability.available) {
    throw new Error(availability.error || `yt-dlp is not available at ${availability.path}`)
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(getYtDlpPath(), args)
    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => { stdout += d })
    proc.stderr.on('data', (d) => { stderr += d })
    proc.on('error', (e) => reject(e))
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout)
      else reject(new Error(stderr || `yt-dlp exited with code ${code}`))
    })
  })
}

export async function searchYoutube(query: string): Promise<YtSearchResult[]> {
  if (!query.trim()) return []

  const raw = await runYtDlp([
    `ytsearch10:${query}`,
    '--dump-json',
    '--flat-playlist',
    '--no-playlist',
    '--no-warnings',
  ])

  const lines = raw.trim().split('\n').filter(Boolean)
  return lines.map((line) => {
    try {
      const obj = JSON.parse(line)
      return {
        videoId: obj.id || '',
        title: obj.title || 'Unknown',
        channel: obj.uploader || obj.channel || 'Unknown',
        duration: formatDuration(obj.duration),
        thumbnail: obj.thumbnail || `https://i.ytimg.com/vi/${obj.id}/mqdefault.jpg`,
      }
    } catch {
      return { videoId: '', title: 'Unknown', channel: 'Unknown', duration: '0:00', thumbnail: '' }
    }
  }).filter(r => r.videoId)
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseProgress(line: string): { percent: number; speed: string; eta: string; size: string } | null {
  const match = line.match(/\[download\]\s+([\d.]+)%\s+of\s+([~\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/)
  if (match) {
    return {
      percent: parseFloat(match[1]),
      size: match[2],
      speed: match[3],
      eta: match[4],
    }
  }
  return null
}

export async function downloadAudio(url: string, videoId: string, requestedTitle?: string): Promise<DownloadStartedPayload> {
  const availability = await checkYtDlpAvailability()
  if (!availability.available) {
    throw new Error(availability.error || `yt-dlp is not available at ${availability.path}`)
  }

  const downloadId = Date.now().toString()
  const musicFoldersRaw = getSetting('music_folders')
  let musicDir = path.join(app.getPath('userData'), 'downloads')

  if (musicFoldersRaw) {
    try {
      const folders = JSON.parse(musicFoldersRaw)
      if (folders.length > 0) musicDir = folders[0]
    } catch {}
  }

  fs.mkdirSync(musicDir, { recursive: true })

  const outputTemplate = path.join(musicDir, '%(title)s [%(id)s].%(ext)s')
  const startedPayload: DownloadStartedPayload = {
    id: downloadId,
    videoId,
    title: requestedTitle || 'Downloading...',
    folder: musicDir,
    status: 'downloading',
  }

  getDb().prepare(`
    INSERT INTO downloads (url, video_id, title, status, progress)
    VALUES (?, ?, ?, 'downloading', 0)
  `).run(url, videoId, requestedTitle || 'Downloading...')

  send('youtube:download-started', startedPayload)

  const args = [
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--add-metadata',
    '--embed-thumbnail',
    '-o', outputTemplate,
    '--newline',
    '--progress',
    '--no-warnings',
    url,
  ]
  console.log('[yt-dlp] spawn:', getYtDlpPath(), args.join(' '))

  const proc = spawn(getYtDlpPath(), args)
  _activeDownloads.set(videoId, proc)

  let title = requestedTitle || 'Unknown'
  let downloadedFile = ''
  let stderrBuffer = ''

  proc.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      console.log('[yt-dlp stdout]', line)
      if (line.includes('[download]') && line.includes('%')) {
        const prog = parseProgress(line)
        if (prog) {
          const progressPayload: DownloadProgressPayload = {
            id: downloadId,
            videoId,
            progress: prog.percent,
            speed: prog.speed,
            eta: prog.eta,
            size: prog.size,
          }
          getDb().prepare(`UPDATE downloads SET progress = ? WHERE video_id = ?`).run(prog.percent, videoId)
          send('youtube:download-progress', progressPayload)
        }
      }
      if (line.includes('[download]') && line.includes('Destination:')) {
        const titleMatch = line.match(/Destination:\s+(.+)/)
        if (titleMatch) {
          title = path.basename(titleMatch[1].trim())
        }
      }
      if (line.includes('[ExtractAudio]')) {
        const m = line.match(/Destination:\s+(.+)/)
        if (m) downloadedFile = m[1].trim()
      }
    }
  })

  proc.stderr.on('data', (data: Buffer) => {
    const chunk = data.toString()
    stderrBuffer += chunk
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (!line.trim()) continue
      console.error('[yt-dlp stderr]', line)
      if (line.includes('[download]') && line.includes('%')) {
        const prog = parseProgress(line)
        if (prog) {
          const progressPayload: DownloadProgressPayload = {
            id: downloadId,
            videoId,
            progress: prog.percent,
            speed: prog.speed,
            eta: prog.eta,
            size: prog.size,
          }
          getDb().prepare(`UPDATE downloads SET progress = ? WHERE video_id = ?`).run(prog.percent, videoId)
          send('youtube:download-progress', progressPayload)
        }
      }
    }
  })

  proc.on('error', (err) => {
    _activeDownloads.delete(videoId)
    const msg = err.message || 'Download failed'
    console.error('[yt-dlp] spawn error:', msg)
    const errorPayload: DownloadErrorPayload = { id: downloadId, videoId, error: msg }
    getDb().prepare(`UPDATE downloads SET status = 'failed', title = ? WHERE video_id = ?`).run(title, videoId)
    send('youtube:download-error', errorPayload)
  })

  proc.on('close', async (code) => {
    _activeDownloads.delete(videoId)

    if (code !== 0) {
      const errorDetail = stderrBuffer || `yt-dlp exited with code ${code}`
      console.error('[yt-dlp] process failed:', errorDetail)
      const errorPayload: DownloadErrorPayload = { id: downloadId, videoId, error: errorDetail }
      getDb().prepare(`UPDATE downloads SET status = 'failed', title = ? WHERE video_id = ?`).run(errorDetail.substring(0, 200), videoId)
      send('youtube:download-error', errorPayload)
      return
    }

    try {
      if (!downloadedFile) {
        const files = fs.readdirSync(musicDir)
        const match = files.find(f => f.includes(videoId) && f.endsWith('.mp3'))
        if (match) downloadedFile = path.join(musicDir, match)
      }

      let donePayload: DownloadDonePayload
      if (downloadedFile && fs.existsSync(downloadedFile)) {
        const track = await scanFile(downloadedFile)
        if (track) {
          getDb().prepare(`UPDATE downloads SET status = 'done', title = ?, track_id = ? WHERE video_id = ?`)
            .run(track.title, track.id, videoId)
          donePayload = { id: downloadId, videoId, trackId: track.id, path: downloadedFile, title: track.title }
        } else {
          const fallbackTitle = path.basename(downloadedFile)
          getDb().prepare(`UPDATE downloads SET status = 'done', title = ? WHERE video_id = ?`).run(fallbackTitle, videoId)
          donePayload = { id: downloadId, videoId, trackId: null, path: downloadedFile, title: fallbackTitle }
        }
      }
      else {
        getDb().prepare(`UPDATE downloads SET status = 'done' WHERE video_id = ?`).run(videoId)
        donePayload = { id: downloadId, videoId, trackId: null }
      }

      send('youtube:download-done', donePayload)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Post-download failed'
      console.error('[yt-dlp] post-download error:', msg)
      const errorPayload: DownloadErrorPayload = { id: downloadId, videoId, error: msg }
      getDb().prepare(`UPDATE downloads SET status = 'failed' WHERE video_id = ?`).run(videoId)
      send('youtube:download-error', errorPayload)
    }
  })

  return startedPayload
}

export function cancelDownload(videoId: string): DownloadCancelledPayload {
  const proc = _activeDownloads.get(videoId)
  const idRow = getDb().prepare('SELECT id FROM downloads WHERE video_id = ? ORDER BY created_at DESC LIMIT 1').get(videoId) as { id?: number } | undefined
  const payload: DownloadCancelledPayload = {
    id: idRow?.id ? String(idRow.id) : null,
    videoId,
    error: 'Cancelled',
  }
  if (proc) {
    proc.kill('SIGTERM')
    _activeDownloads.delete(videoId)
  }
  getDb().prepare(`UPDATE downloads SET status = 'failed' WHERE video_id = ?`).run(videoId)
  send('youtube:download-cancelled', payload)
  return payload
}

export async function getDownloadHistory() {
  return getDb().prepare('SELECT * FROM downloads ORDER BY created_at DESC LIMIT 20').all()
}

export function clearDownloadHistory(): void {
  getDb().prepare('DELETE FROM downloads').run()
  send('youtube:history-cleared', {})
}
