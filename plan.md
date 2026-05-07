# Tplayer — Project Plan

A beautiful, Spotify-like local music player for Linux with YouTube download integration.

---

## Vision
A desktop music player as polished as Spotify, but for **your local music**. Browse, play, and manage your personal library with a gorgeous UI, plus download music from YouTube directly within the app via yt-dlp.

## Goals
- **Beautiful**: Dark & light themes, animations, album art everywhere, modern typography
- **Lightweight**: Under 200MB RAM idle, fast startup, responsive UI
- **Complete**: All standard music player features + YouTube download
- **Linux-first**: MPRIS integration, native feel, system tray

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Desktop Shell | Electron 33+ | Cross-platform desktop with web UI |
| Build Tool | electron-vite | Vite for main, preload, and renderer |
| Frontend | React 18 + TypeScript | Component model, ecosystem |
| Styling | Tailwind CSS 3 | Utility-first, fast iteration |
| UI Components | shadcn/ui (Radix primitives) | Beautiful, accessible, customizable |
| Icons | lucide-react | Clean, consistent icon set |
| State Management | Zustand 5 | Minimal, hook-based, no boilerplate |
| Database | better-sqlite3 | Fast, embedded, synchronous SQL |
| Audio Decoding | FFmpeg (fluent-ffmpeg) | Universal format support |
| File Watching | chokidar | Fast, reliable FS events |
| Metadata | music-metadata | Extract ID3/Vorbis/etc tags |
| YouTube | yt-dlp | Search + download audio |
| Packaging | electron-builder | AppImage, .deb, .rpm |

---

## Core Architecture

### Process Model
```
┌─────────────────────────────────────────────┐
│              MAIN PROCESS (Node.js)          │
│  Database │ File Watcher │ Audio Engine     │
│  yt-dlp   │ Last.fm      │ MPRIS            │
│                      ↕ IPC                    │
│              PRELOAD SCRIPT (bridge)         │
│                      ↕                        │
│            RENDERER PROCESS (React)           │
│  UI │ State (Zustand) │ Web Audio API         │
└─────────────────────────────────────────────┘
```

### Audio Pipeline
```
Audio File (any format)
    │
    ▼
FFmpeg (main process)
    └─ decode to PCM f32le (float32 planar)
    │
    ▼
SharedArrayBuffer (IPC transfer)
    │
    ▼
Web Audio API (renderer)
    ├─ AudioBufferSourceNode
    ├─ BiquadFilterNode × 10 (10-band EQ)
    ├─ GainNode (volume)
    └─ AudioContext.destination (speakers)
```

---

## Database Schema

```sql
-- Core music library
CREATE TABLE tracks (
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

-- Album art cache
CREATE TABLE covers (
  album      TEXT NOT NULL,
  artist     TEXT NOT NULL,
  image_blob BLOB,
  mime_type  TEXT DEFAULT 'image/jpeg',
  PRIMARY KEY (album, artist)
);

-- Playlists
CREATE TABLE playlists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE playlist_tracks (
  playlist_id INTEGER NOT NULL,
  track_id    INTEGER NOT NULL,
  position    INTEGER NOT NULL,
  added_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (playlist_id, track_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- YouTube download history
CREATE TABLE downloads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  url        TEXT NOT NULL,
  video_id   TEXT NOT NULL,
  title      TEXT NOT NULL,
  artist     TEXT,
  status     TEXT DEFAULT 'pending',  -- pending, downloading, done, failed
  progress   REAL DEFAULT 0,
  track_id   INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (track_id) REFERENCES tracks(id)
);

-- Key/value settings
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## IPC API Surface

### Library
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `library:scan` | inv/handle | `{ folders: string[] }` | `{ added: number }` |
| `library:get-tracks` | inv/handle | `{ query?, sort?, limit?, offset? }` | `Track[]` |
| `library:get-track` | inv/handle | `{ id: number }` | `Track` |
| `library:toggle-favorite` | inv/handle | `{ id: number }` | `void` |
| `library:get-covers` | inv/handle | `{ albums: string[] }` | `Cover[]` |
| `library:file-added` | main→renderer | `Track` | — |
| `library:file-removed` | main→renderer | `{ id: number }` | — |

### Player
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `player:play` | inv/handle | `{ trackId: number }` | `void` |
| `player:pause` | inv/handle | — | `void` |
| `player:resume` | inv/handle | — | `void` |
| `player:toggle-play` | inv/handle | — | `void` |
| `player:next` | inv/handle | — | `void` |
| `player:prev` | inv/handle | — | `void` |
| `player:seek` | inv/handle | `{ time: number }` | `void` |
| `player:set-volume` | inv/handle | `{ volume: number }` | `void` |
| `player:playback-state` | main→renderer | `PlaybackState` | — |
| `player:time-update` | main→renderer | `{ current, duration }` | — |

### Queue
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `queue:add` | inv/handle | `{ trackId }` | `void` |
| `queue:add-next` | inv/handle | `{ trackId }` | `void` |
| `queue:remove` | inv/handle | `{ index }` | `void` |
| `queue:reorder` | inv/handle | `{ from, to }` | `void` |
| `queue:clear` | inv/handle | — | `void` |
| `queue:get` | inv/handle | — | `QueueEntry[]` |
| `queue:updated` | main→renderer | `QueueEntry[]` | — |

### Playlists
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `playlist:list` | inv/handle | — | `Playlist[]` |
| `playlist:create` | inv/handle | `{ name, desc? }` | `Playlist` |
| `playlist:delete` | inv/handle | `{ id }` | `void` |
| `playlist:rename` | inv/handle | `{ id, name }` | `void` |
| `playlist:get-tracks` | inv/handle | `{ id }` | `Track[]` |
| `playlist:add-tracks` | inv/handle | `{ id, trackIds[] }` | `void` |
| `playlist:remove-track` | inv/handle | `{ id, trackId }` | `void` |
| `playlist:reorder` | inv/handle | `{ id, fromPos, toPos }` | `void` |

### YouTube
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `youtube:search` | inv/handle | `{ query }` | `YtResult[]` |
| `youtube:download` | inv/handle | `{ url, videoId }` | `void` |
| `youtube:download-progress` | main→renderer | `{ id, progress }` | — |
| `youtube:download-done` | main→renderer | `{ id, trackId }` | — |
| `youtube:download-error` | main→renderer | `{ id, error }` | — |

### Settings
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `settings:get` | inv/handle | `{ key }` | `string` |
| `settings:set` | inv/handle | `{ key, value }` | `void` |
| `settings:get-all` | inv/handle | — | `Record<string,string>` |
| `settings:get-folders` | inv/handle | — | `string[]` |
| `settings:add-folder` | inv/handle | `{ path }` | `void` |
| `settings:remove-folder` | inv/handle | `{ path }` | `void` |

### Last.fm
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `lastfm:auth` | inv/handle | `{ apiKey, secret? }` | `void` |
| `lastfm:now-playing` | inv/handle | `{ artist, track, album? }` | `void` |
| `lastfm:scrobble` | inv/handle | `{ artist, track, album?, timestamp }` | `void` |

### Equalizer
| Channel | Direction | Payload | Returns |
|---------|-----------|---------|---------|
| `eq:set-bands` | inv/handle | `{ bands: number[] }` | `void` |
| `eq:set-preset` | inv/handle | `{ preset: string }` | `number[]` |
| `eq:enable` | inv/handle | `{ enabled: boolean }` | `void` |

---

## UI Component Tree

```
App
├── ThemeProvider
│   ├── Sidebar
│   │   ├── NavigationButtons (Library, YouTube, Queue)
│   │   ├── PlaylistList
│   │   │   └── PlaylistItem × N
│   │   └── SettingsButton
│   ├── MainContent (view router)
│   │   ├── LibraryView
│   │   │   ├── LibraryHeader (search bar, sort dropdown)
│   │   │   ├── TrackList
│   │   │   │   └── TrackRow × N
│   │   │   └── AlbumArtGrid (alt view)
│   │   ├── PlaylistDetailView
│   │   │   ├── PlaylistHeader (name, desc, play all)
│   │   │   └── TrackList (draggable)
│   │   ├── YouTubeView
│   │   │   ├── SearchBar + URL Paste input
│   │   │   ├── SearchResults (grid)
│   │   │   └── DownloadProgress
│   │   ├── QueueView
│   │   │   ├── NowPlayingHero
│   │   │   └── UpcomingList
│   │   ├── EqualizerView
│   │   │   ├── PresetSelector
│   │   │   ├── BandSliders × 10
│   │   │   └── EnableToggle
│   │   └── SettingsView
│   │       ├── MusicFolders
│   │       ├── LastFmAuth
│   │       └── ThemeToggle
│   └── NowPlayingBar
│       ├── TrackInfo (album art, title, artist)
│       ├── PlayerControls (prev, play/pause, next, shuffle, repeat)
│       ├── SeekBar
│       └── VolumeControl
└── MiniPlayer (separate small window)
```

---

## States

| View | States |
|------|--------|
| Library | empty (no tracks), loading (scanning), loaded, error |
| Playlist | empty, loaded |
| YouTube | initial (search prompt), searching, results, no results, downloading, done, error |
| Queue | empty, populated |
| Player | idle, loading (buffering), playing, paused, error |
| NowPlayingBar | hidden, visible |
| MiniPlayer | hidden, visible |
| Equalizer | disabled, enabled |
| Settings | loaded, saving |

---

## Theme System
- CSS custom properties for both themes
- Tailwind dark mode via `class` strategy
- `ThemeProvider` wraps app, reads from settings DB
- Dark: deep neutral grays, accent green (Spotify-like), subtle gradients
- Light: clean whites, soft grays, accent green, shadows for depth

### Accent Colors (user configurable)
Green (default), Blue, Purple, Orange, Pink, Red

---

## Design Principles
1. **Content-first**: Album art and track info are the heroes
2. **Minimal chrome**: Controls recede until needed
3. **Smooth animations**: 200ms transitions on all interactive elements
4. **Spatial navigation**: Sidebar ↔ Content ↔ NowPlayingBar (vertical layout)
5. **Drag and drop**: Playlist reordering, file drop for import
6. **Keyboard shortcuts**: Space (play/pause), arrows (seek), Ctrl+F (search), Ctrl+L (library)

---

## Dependencies

### Runtime
```json
{
  "better-sqlite3": "^11.0.0",
  "chokidar": "^4.0.0",
  "fluent-ffmpeg": "^2.1.0",
  "music-metadata": "^10.0.0",
  "yt-dlp-wrap": "^2.0.0",
  "electron-store": "^10.0.0"
}
```

### Renderer
```json
{
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "zustand": "^5.0.0",
  "lucide-react": "^0.460.0",
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.1.0",
  "@radix-ui/react-slider": "^1.2.0",
  "@radix-ui/react-tooltip": "^1.1.0",
  "@radix-ui/react-context-menu": "^2.2.0",
  "@radix-ui/react-tabs": "^1.1.0",
  "@radix-ui/react-switch": "^1.1.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.6.0",
  "class-variance-authority": "^0.7.0"
}
```

### Dev
```json
{
  "typescript": "^5.6.0",
  "electron": "^33.0.0",
  "electron-vite": "^2.3.0",
  "electron-builder": "^25.0.0",
  "vite": "^5.4.0",
  "@vitejs/plugin-react": "^4.3.0",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0",
  "tailwindcss-animate": "^1.0.7",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@types/better-sqlite3": "^7.6.0"
}
```

---

## File Structure (Final)

```
Tplayer/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── electron-builder.yml
├── electron.vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── library-scanner.ts
│   │   ├── file-watcher.ts
│   │   ├── audio-engine.ts
│   │   ├── audio-decoder.ts
│   │   ├── yt-dlp.ts
│   │   ├── lastfm.ts
│   │   ├── mpris.ts
│   │   └── ipc-registry.ts
│   ├── preload/
│   │   └── index.ts
│   └── renderer/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── globals.css
│       ├── components/
│       │   ├── ui/           (shadcn: button, dialog, slider, input, etc.)
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── MainContent.tsx
│       │   │   ├── NowPlayingBar.tsx
│       │   │   └── MiniPlayer.tsx
│       │   ├── library/
│       │   │   ├── LibraryView.tsx
│       │   │   ├── TrackRow.tsx
│       │   │   └── AlbumArtView.tsx
│       │   ├── player/
│       │   │   ├── PlayerControls.tsx
│       │   │   ├── SeekBar.tsx
│       │   │   └── VolumeControl.tsx
│       │   ├── playlist/
│       │   │   ├── PlaylistListView.tsx
│       │   │   ├── PlaylistDetailView.tsx
│       │   │   └── CreatePlaylistDialog.tsx
│       │   ├── youtube/
│       │   │   ├── YouTubeView.tsx
│       │   │   ├── SearchResults.tsx
│       │   │   └── DownloadCard.tsx
│       │   ├── queue/
│       │   │   └── QueueView.tsx
│       │   ├── equalizer/
│       │   │   └── EqualizerView.tsx
│       │   └── settings/
│       │       └── SettingsView.tsx
│       ├── stores/
│       │   ├── playerStore.ts
│       │   ├── libraryStore.ts
│       │   ├── playlistStore.ts
│       │   ├── queueStore.ts
│       │   ├── youtubeStore.ts
│       │   ├── eqStore.ts
│       │   └── settingsStore.ts
│       ├── hooks/
│       │   ├── useIPC.ts
│       │   ├── useKeyboard.ts
│       │   └── useDebounce.ts
│       ├── lib/
│       │   ├── ipc.ts
│       │   ├── utils.ts
│       │   └── types.ts
│       └── assets/
│           └── logo.svg
└── resources/
    └── icon.png
```
