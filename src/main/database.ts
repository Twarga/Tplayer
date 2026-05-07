import BetterSqlite3 from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

let _db: BetterSqlite3.Database | null = null

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
      FOREIGN KEY (track_id) REFERENCES tracks(id)
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

  const defaults: Record<string, string> = {
    music_folders: '[]',
    theme: 'dark',
    accent_color: 'amber',
    eq_enabled: 'false',
    eq_bands: '[0,0,0,0,0,0,0,0,0,0]',
    volume: '0.8',
    lastfm_api_key: '',
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

export function closeDatabase(): void {
  if (_db) {
    _db.close()
    _db = null
  }
}