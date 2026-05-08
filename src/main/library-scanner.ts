import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { app } from 'electron'
import { parseFile } from 'music-metadata'
import { getDb } from './database'
import { send } from './ipc-registry'

const { stat: fsStat, readdir: fsReaddir } = fs.promises

const SUPPORTED_EXTENSIONS = new Set([
  '.mp3', '.flac', '.ogg', '.opus', '.wav', '.aac', '.m4a', '.wma', '.aiff',
])

interface TrackMeta {
  file_path: string
  title: string
  artist: string
  album: string
  album_artist: string | null
  track_number: number | null
  disc_number: number | null
  year: number | null
  genre: string | null
  duration: number
  bitrate: number | null
  sample_rate: number | null
  file_size: number
  file_format: string
  has_cover: number
  cover_path: string | null
  play_count: number
  skip_count: number
  is_favorite: number
  rating: number
  bpm: number | null
  color_palette: string | null
}

let _scanCount = 0

async function extractMetadata(filePath: string): Promise<TrackMeta> {
  try {
    const mm = await parseFile(filePath)
    const { common, format } = mm
    const stats = await fsStat(filePath)

    const title =
      common.title ||
      path.basename(filePath, path.extname(filePath))

    const trackMeta: TrackMeta = {
      file_path: filePath,
      title,
      artist: common.artist || 'Unknown Artist',
      album: common.album || 'Unknown Album',
      album_artist: common.albumartist || null,
      track_number: common.track?.no ?? null,
      disc_number: common.disk?.no ?? null,
      year: common.year ?? null,
      genre: common.genre?.[0] ?? null,
      duration: mm.format.duration ?? 0,
      bitrate: format.bitrate ?? null,
      sample_rate: format.sampleRate ?? null,
      file_size: stats.size,
      file_format: format.codec ?? path.extname(filePath).slice(1).toUpperCase(),
      has_cover: 0,
      cover_path: null,
      play_count: 0,
      skip_count: 0,
      is_favorite: 0,
      rating: 0,
      bpm: common.bpm ?? null,
      color_palette: null,
    }

    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0]
      const savedPath = saveCover(trackMeta.album, trackMeta.artist, pic.data, pic.format)
      if (savedPath) {
        trackMeta.has_cover = 1
        trackMeta.cover_path = savedPath
      }
    }

    return trackMeta
  } catch {
    let stats: fs.Stats | null = null
    try { stats = fs.statSync(filePath) } catch { /* ignore */ }
    return {
      file_path: filePath,
      title: path.basename(filePath, path.extname(filePath)),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      album_artist: null,
      track_number: null,
      disc_number: null,
      year: null,
      genre: null,
      duration: 0,
      bitrate: null,
      sample_rate: null,
      file_size: stats?.size ?? 0,
      file_format: path.extname(filePath).slice(1).toUpperCase(),
      has_cover: 0,
      cover_path: null,
      play_count: 0,
      skip_count: 0,
      is_favorite: 0,
      rating: 0,
      bpm: null,
      color_palette: null,
    }
  }
}

function insertOrReplaceTrack(track: TrackMeta): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO tracks (
      file_path, title, artist, album, album_artist, track_number, disc_number,
      year, genre, duration, bitrate, sample_rate, file_size, file_format,
      has_cover, cover_path, play_count, skip_count, is_favorite, rating, bpm, color_palette
    ) VALUES (
      @file_path, @title, @artist, @album, @album_artist, @track_number, @disc_number,
      @year, @genre, @duration, @bitrate, @sample_rate, @file_size, @file_format,
      @has_cover, @cover_path, @play_count, @skip_count, @is_favorite, @rating, @bpm, @color_palette
    )
    ON CONFLICT(file_path) DO UPDATE SET
      title = @title,
      artist = @artist,
      album = @album,
      album_artist = @album_artist,
      track_number = @track_number,
      disc_number = @disc_number,
      year = @year,
      genre = @genre,
      duration = @duration,
      bitrate = @bitrate,
      sample_rate = @sample_rate,
      file_size = @file_size,
      file_format = @file_format,
      has_cover = @has_cover,
      cover_path = @cover_path,
      bpm = @bpm,
      color_palette = @color_palette
  `).run(track)
}

async function scanDir(dirPath: string): Promise<string[]> {
  const audioFiles: string[] = []
  let entries: string[]

  try {
    entries = await fsReaddir(dirPath)
  } catch {
    return []
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue
    const full = path.join(dirPath, entry)

    try {
      const s = await fsStat(full)
      if (s.isDirectory()) {
        const sub = await scanDir(full)
        audioFiles.push(...sub)
      } else if (SUPPORTED_EXTENSIONS.has(path.extname(full).toLowerCase())) {
        audioFiles.push(full)
      }
    } catch {
      // skip inaccessible
    }
  }

  return audioFiles
}

export async function scanFolders(folders: string[]): Promise<{ added: number; updated: number; total: number }> {
  _scanCount = 0
  let added = 0
  let updated = 0

  for (const folder of folders) {
    const files = await scanDir(folder)
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i]
      const current = i + 1

      if (_scanCount > 0 && _scanCount % 10 === 0) {
        send('library:scan-progress', {
          current,
          processed: current,
          total,
          file: path.basename(filePath),
          path: filePath,
        })
      }

      const existing = getDb()
        .prepare('SELECT id, file_path FROM tracks WHERE file_path = ?')
        .get(filePath) as { id: number; file_path: string } | undefined

      const track = await extractMetadata(filePath)
      insertOrReplaceTrack(track)

      if (existing) {
        updated++
      } else {
        added++
      }

      _scanCount++
    }
  }

  return { added, updated, total: _scanCount }
}

export function saveCover(album: string, artist: string, imageBuffer: Buffer, mimeType = 'image/jpeg'): string | null {
  const hash = crypto.createHash('md5').update(`${album}|${artist}`).digest('hex')
  const ext = mimeType === 'image/png' ? 'png' : 'jpg'
  const coversDir = path.join(app.getPath('userData'), 'covers')
  const coverPath = path.join(coversDir, `${hash}.${ext}`)

  try {
    fs.mkdirSync(coversDir, { recursive: true })
    fs.writeFileSync(coverPath, imageBuffer)

    getDb().prepare(`
      INSERT OR REPLACE INTO covers (album, artist, image_blob, mime_type)
      VALUES (?, ?, ?, ?)
    `).run(album, artist, imageBuffer, mimeType)

    return coverPath
  } catch {
    return null
  }
}

export async function scanFile(filePath: string): Promise<{ id: number; title: string; artist: string; album: string; duration: number } | null> {
  if (!SUPPORTED_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return null
  try {
    const track = await extractMetadata(filePath)
    insertOrReplaceTrack(track)
    const row = getDb().prepare('SELECT id, title, artist, album, duration FROM tracks WHERE file_path = ?').get(filePath) as
      { id: number; title: string; artist: string; album: string; duration: number } | undefined
    return row || null
  } catch (err) {
    console.error('[scanner] scanFile failed:', err)
    return null
  }
}

export function removeTrack(filePath: string): void {
  getDb().prepare('DELETE FROM tracks WHERE file_path = ?').run(filePath)
}
