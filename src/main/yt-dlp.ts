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

export function setYtDlpPath(p: string): void {
  _ytDlpPath = p
}

async function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(getYtDlpPath(), args, { shell: true })
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
  const raw = await runYtDlp([
    'ytsearch10:' + query,
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
        duration: obj.duration || '0:00',
        thumbnail: obj.thumbnail || '',
      }
    } catch {
      return { videoId: '', title: 'Unknown', channel: 'Unknown', duration: '0:00', thumbnail: '' }
    }
  })
}

export async function downloadAudio(url: string, videoId: string): Promise<void> {
  const downloadId = Date.now().toString()
  const downloadDir = path.join(app.getPath('userData'), 'downloads')
  const musicFoldersRaw = getSetting('music_folders')
  let musicDir = path.join(app.getPath('userData'), 'downloads')

  if (musicFoldersRaw) {
    try {
      const folders = JSON.parse(musicFoldersRaw)
      if (folders.length > 0) {
        musicDir = folders[0]
      }
    } catch {}
  }

  fs.mkdirSync(downloadDir, { recursive: true })
  fs.mkdirSync(musicDir, { recursive: true })

  const outputTemplate = path.join(downloadDir, '%(title)s.%(ext)s')

  getDb().prepare(`
    INSERT INTO downloads (url, video_id, title, status, progress)
    VALUES (?, ?, ?, 'downloading', 0)
  `).run(url, videoId, 'Downloading...')

  send('youtube:download-started', { id: downloadId, videoId })

  try {
    const ffprobeOutput = await runYtDlp([
      '-x', '--audio-format', 'mp3', '--audio-quality', '0',
      '--embed-thumbnail', '--add-metadata',
      '-o', outputTemplate,
      '--print', '%(title)s',
      '--progress', url,
    ])

    const titleMatch = ffprobeOutput.match(/\[download\] Destination: (.+)/)
    if (titleMatch) {
      const filePath = titleMatch[1]
      const finalPath = path.join(musicDir, path.basename(filePath))
      fs.renameSync(filePath, finalPath)

      getDb().prepare(`UPDATE downloads SET status = 'done', track_id = ? WHERE video_id = ?`).run(null, videoId)
      send('youtube:download-done', { id: downloadId, trackId: null, path: finalPath })
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Download failed'
    getDb().prepare(`UPDATE downloads SET status = 'failed' WHERE video_id = ?`).run(videoId)
    send('youtube:download-error', { id: downloadId, error: errorMsg })
  }
}

export function cancelDownload(videoId: string): void {
  // In a full implementation, track the PID and kill it
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