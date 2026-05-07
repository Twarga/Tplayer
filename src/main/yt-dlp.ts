import { spawn } from 'child_process'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getSetting, getDb } from './database'
import { send } from './ipc-registry'

export interface YtSearchResult {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
}

let _ytDlpPath: string | null = null

export function getYtDlpPath(): string {
  if (_ytDlpPath) return _ytDlpPath
  _ytDlpPath = getSetting('yt_dlp_path') || 'yt-dlp'
  return _ytDlpPath
}

async function runYtDlp(args: string[]): Promise<string> {
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
  try {
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
  } catch (err) {
    console.error('[yt-dlp] Search failed:', err)
    return []
  }
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export async function downloadAudio(url: string, videoId: string): Promise<void> {
  const downloadId = Date.now().toString()
  const downloadDir = path.join(app.getPath('userData'), 'downloads')
  const musicFoldersRaw = getSetting('music_folders')
  let musicDir = path.join(app.getPath('userData'), 'downloads')

  if (musicFoldersRaw) {
    try {
      const folders = JSON.parse(musicFoldersRaw)
      if (folders.length > 0) musicDir = folders[0]
    } catch {}
  }

  fs.mkdirSync(downloadDir, { recursive: true })
  fs.mkdirSync(musicDir, { recursive: true })

  const outputTemplate = path.join(musicDir, '%(title)s.%(ext)s')

  getDb().prepare(`
    INSERT INTO downloads (url, video_id, title, status, progress)
    VALUES (?, ?, ?, 'downloading', 0)
  `).run(url, videoId, 'Downloading...')

  send('youtube:download-started', { id: downloadId, videoId })

  try {
    await runYtDlp([
      '-x', '--audio-format', 'mp3', '--audio-quality', '0',
      '--embed-thumbnail', '--add-metadata',
      '-o', outputTemplate,
      '--newline',
      '--progress',
      url,
    ])

    getDb().prepare(`UPDATE downloads SET status = 'done' WHERE video_id = ?`).run(videoId)
    send('youtube:download-done', { id: downloadId, videoId })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Download failed'
    getDb().prepare(`UPDATE downloads SET status = 'failed' WHERE video_id = ?`).run(videoId)
    send('youtube:download-error', { id: downloadId, error: errorMsg })
  }
}

export function cancelDownload(videoId: string): void {
  getDb().prepare(`UPDATE downloads SET status = 'failed' WHERE video_id = ?`).run(videoId)
  send('youtube:download-cancelled', { videoId })
}

export async function getDownloadHistory() {
  return getDb().prepare('SELECT * FROM downloads ORDER BY created_at DESC LIMIT 20').all()
}

export function clearDownloadHistory(): void {
  getDb().prepare('DELETE FROM downloads').run()
  send('youtube:history-cleared', {})
}