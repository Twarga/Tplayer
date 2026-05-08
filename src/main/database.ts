import BetterSqlite3 from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import type { Cover, Download, Playlist, Track } from '../shared/types/domain'
import type { GetTracksOptions } from '../shared/ipc/contracts'

let _db: BetterSqlite3.Database | null = null

export interface TrackUpsertInput {
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

export interface TrackSummary {
  id: number
  title: string
  artist: string
  album: string
  duration: number
}

export function getDb(): BetterSqlite3.Database {
  if (!_db) throw new Error('Database not initialized')
  return _db
}

export function initDatabase(): BetterSqlite3.Database {
  const dbPath = path.join(app.getPath('userData'), 'tplayer.db')
  const db = new BetterSqlite3(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path     TEXT NOT NULL UNIQUE,
      title         TEXT NOT NULL,
      artist        TEXT DEFAULT 'Unknown Artist',
      album         TEXT DEFAULT 'Unknown Album',
      album_artist  TEXT,
      track_number  INTEGER,
      disc_number   INTEGER,
      year          INTEGER,
      genre         TEXT,
      duration      REAL NOT NULL,
      bitrate       INTEGER,
      sample_rate   INTEGER,
      file_size     INTEGER,
      file_format   TEXT,
      has_cover     INTEGER DEFAULT 0,
      cover_path    TEXT,
      date_added    TEXT NOT NULL DEFAULT (datetime('now')),
      play_count    INTEGER DEFAULT 0,
      skip_count    INTEGER DEFAULT 0,
      last_played   TEXT,
      is_favorite   INTEGER DEFAULT 0,
      rating        INTEGER DEFAULT 0,
      bpm           REAL,
      color_palette TEXT
    );

    CREATE TABLE IF NOT EXISTS covers (
      album      TEXT NOT NULL,
      artist     TEXT NOT NULL,
      image_blob BLOB,
      mime_type  TEXT DEFAULT 'image/jpeg',
      PRIMARY KEY (album, artist)
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER NOT NULL,
      track_id    INTEGER NOT NULL,
      position    INTEGER NOT NULL,
      added_at    TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      url        TEXT NOT NULL,
      video_id   TEXT NOT NULL,
      title      TEXT NOT NULL,
      artist     TEXT,
      status     TEXT DEFAULT 'pending',
      progress   REAL DEFAULT 0,
      track_id   INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
    CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
    CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
    CREATE INDEX IF NOT EXISTS idx_tracks_is_favorite ON tracks(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
  `)

  try {
    const fkInfo = db.prepare(`PRAGMA foreign_key_list(downloads)`).all() as Array<{ on_delete: string }>
    const needsMigration = fkInfo.length > 0 && !fkInfo.some(fk => fk.on_delete === 'SET NULL')
    if (needsMigration) {
      db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE downloads_new (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          url        TEXT NOT NULL,
          video_id   TEXT NOT NULL,
          title      TEXT NOT NULL,
          artist     TEXT,
          status     TEXT DEFAULT 'pending',
          progress   REAL DEFAULT 0,
          track_id   INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE SET NULL
        );
        INSERT INTO downloads_new SELECT * FROM downloads;
        DROP TABLE downloads;
        ALTER TABLE downloads_new RENAME TO downloads;
        PRAGMA foreign_keys = ON;
      `)
      console.log('[database] Migrated downloads table foreign key')
    }
  } catch (err) {
    console.log('[database] Downloads migration skipped:', err)
  }

  const defaults: Record<string, string> = {
    music_folders: '[]',
    theme: 'dark',
    accent_color: 'amber',
    eq_enabled: 'false',
    eq_bands: '[0,0,0,0,0,0,0,0,0,0]',
    volume: '0.8',
    yt_dlp_path: '',
    lastfm_api_key: '',
    lastfm_secret: '',
    lastfm_session_key: '',
    scan_on_startup: 'true',
  }

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  )

  for (const [key, value] of Object.entries(defaults)) {
    insertSetting.run(key, value)
  }

  _db = db
  return db
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row ? row.value : null
}

export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export function getMusicFolders(): string[] {
  const raw = getSetting('music_folders')
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function addMusicFolder(folderPath: string): void {
  const folders = getMusicFolders()
  if (!folders.includes(folderPath)) {
    folders.push(folderPath)
    setSetting('music_folders', JSON.stringify(folders))
  }
}

export function removeMusicFolder(folderPath: string): void {
  const folders = getMusicFolders().filter((folder) => folder !== folderPath)
  setSetting('music_folders', JSON.stringify(folders))
}

export function getTracks(opts?: GetTracksOptions): Track[] {
  const db = getDb()
  let sql = 'SELECT * FROM tracks'
  const params: (string | number)[] = []

  if (opts?.query) {
    sql += ' WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?'
    const query = `%${opts.query}%`
    params.push(query, query, query)
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

  return db.prepare(sql).all(...params) as Track[]
}

export function getTrackById(id: number): Track | null {
  return (getDb().prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined) ?? null
}

export function getTrackByFilePath(filePath: string): Track | null {
  return (getDb().prepare('SELECT * FROM tracks WHERE file_path = ?').get(filePath) as Track | undefined) ?? null
}

export function getTrackSummaryByFilePath(filePath: string): TrackSummary | null {
  return (
    getDb()
      .prepare('SELECT id, title, artist, album, duration FROM tracks WHERE file_path = ?')
      .get(filePath) as TrackSummary | undefined
  ) ?? null
}

export function upsertTrack(track: TrackUpsertInput): void {
  getDb().prepare(`
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

export function saveCoverRecord(album: string, artist: string, imageBuffer: Buffer, mimeType: string): void {
  getDb().prepare(`
    INSERT OR REPLACE INTO covers (album, artist, image_blob, mime_type)
    VALUES (?, ?, ?, ?)
  `).run(album, artist, imageBuffer, mimeType)
}

export function deleteTrackByFilePath(filePath: string): { id: number } | null {
  const existing = getDb().prepare('SELECT id FROM tracks WHERE file_path = ?').get(filePath) as { id: number } | undefined
  if (!existing) return null
  getDb().prepare('DELETE FROM tracks WHERE id = ?').run(existing.id)
  return existing
}

export function getQueueTracksByIds(ids: number[]): Array<Pick<Track, 'id' | 'title' | 'artist' | 'album' | 'duration'>> {
  if (ids.length === 0) return []
  const db = getDb()
  const placeholders = ids.map(() => '?').join(',')
  const rows = db.prepare(`SELECT id, title, artist, album, duration FROM tracks WHERE id IN (${placeholders})`).all(...ids) as Track[]
  return ids.map((id) => rows.find((row) => row.id === id)).filter(Boolean) as Array<Pick<Track, 'id' | 'title' | 'artist' | 'album' | 'duration'>>
}

export function toggleFavoriteTrack(id: number): void {
  getDb().prepare('UPDATE tracks SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id)
}

export function recordTrackPlay(id: number): void {
  getDb().prepare("UPDATE tracks SET play_count = play_count + 1, last_played = datetime('now') WHERE id = ?").run(id)
}

export function getCoversByAlbums(albums: string[]): Cover[] {
  if (albums.length === 0) return []
  const placeholders = albums.map(() => '?').join(',')
  return getDb().prepare(`SELECT * FROM covers WHERE album IN (${placeholders})`).all(...albums) as Cover[]
}

export function getDownloads(): Download[] {
  return getDb().prepare('SELECT * FROM downloads ORDER BY created_at DESC').all() as Download[]
}

export function getRecentDownloads(limit = 20): Download[] {
  return getDb().prepare('SELECT * FROM downloads ORDER BY created_at DESC LIMIT ?').all(limit) as Download[]
}

export function createPlaylist(name: string, description = ''): Playlist {
  const db = getDb()
  const result = db.prepare('INSERT INTO playlists (name, description) VALUES (?, ?)').run(name, description)
  return db.prepare('SELECT * FROM playlists WHERE id = ?').get(result.lastInsertRowid) as Playlist
}

export function getPlaylists(): Playlist[] {
  return getDb().prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all() as Playlist[]
}

export function deletePlaylist(id: number): void {
  getDb().prepare('DELETE FROM playlists WHERE id = ?').run(id)
}

export function renamePlaylist(id: number, name: string): void {
  getDb().prepare("UPDATE playlists SET name = ?, updated_at = datetime('now') WHERE id = ?").run(name, id)
}

export function getPlaylistTracks(playlistId: number): Track[] {
  return getDb().prepare(`
    SELECT t.*, pt.position
    FROM tracks t
    JOIN playlist_tracks pt ON t.id = pt.track_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position
  `).all(playlistId) as Track[]
}

export function addTracksToPlaylist(playlistId: number, trackIds: number[]): void {
  const db = getDb()
  const maxPos = db.prepare('SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?').get(playlistId) as { maxPos: number | null }
  let pos = (maxPos?.maxPos ?? 0) + 1
  const insert = db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)')
  for (const trackId of trackIds) {
    insert.run(playlistId, trackId, pos++)
  }
  db.prepare("UPDATE playlists SET updated_at = datetime('now') WHERE id = ?").run(playlistId)
}

export function removeTrackFromPlaylist(playlistId: number, trackId: number): void {
  getDb().prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, trackId)
}

export function reorderPlaylistTracks(playlistId: number, fromPos: number, toPos: number): void {
  const db = getDb()
  db.prepare('UPDATE playlist_tracks SET position = -1 WHERE playlist_id = ? AND position = ?').run(playlistId, fromPos)
  if (fromPos < toPos) {
    db.prepare('UPDATE playlist_tracks SET position = position - 1 WHERE playlist_id = ? AND position > ? AND position <= ?').run(playlistId, fromPos, toPos)
  } else {
    db.prepare('UPDATE playlist_tracks SET position = position + 1 WHERE playlist_id = ? AND position >= ? AND position < ?').run(playlistId, toPos, fromPos)
  }
  db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND position = -1').run(toPos, playlistId)
}

export function closeDatabase(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}
