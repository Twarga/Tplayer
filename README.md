# Tplayer

A polished local-first desktop music player with YouTube import.

Tplayer is built for focused listening: fast local playback, clean queue control, imported tracks beside your albums, Last.fm scrobbling, Linux media-key support, and a warm dark interface that puts the music first.

Brand direction for screenshots, release copy, and the upcoming landing page lives in [docs/brand.md](docs/brand.md).

## Features

- **Beautiful Dark UI** — Warm amber accent (#E8A87C), three-column layout with sidebar, main content, and now-playing panel
- **Local Music Library** — Scan folders, extract metadata (artist, album, title, duration, etc.) using music-metadata
- **YouTube Download** — Search and download audio from YouTube via yt-dlp
- **Equalizer** — 10-band EQ with presets (Rock, Pop, Jazz, Classical, etc.)
- **Playlist Management** — Create, rename, delete, reorder playlists
- **Last.fm Scrobbling** — Track your listening history
- **MPRIS Integration** — Control playback from Linux media keys (playerctl)
- **Keyboard Shortcuts** — Space (play/pause), arrows (seek), Ctrl+K (search), Ctrl+\ (toggle panel)
- **Dark/Light Themes** — Warm amber, green, blue, purple, orange, pink accent colors
- **Real-time File Watching** — Auto-detect new music files using chokidar

## Tech Stack

- **Electron 33** + **electron-vite** for desktop shell and build
- **React 18** + **TypeScript** for the UI
- **Tailwind CSS** for styling
- **Zustand 5** for state management
- **better-sqlite3** for the music library database
- **fluent-ffmpeg** for audio decoding
- **chokidar** for file watching
- **yt-dlp** for YouTube search and download
- **shadcn/ui** (Radix primitives) for UI components

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- FFmpeg
- yt-dlp

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

Output in `out/` directory:
- `out/main/` — Electron main process
- `out/preload/` — Preload script
- `out/renderer/` — React app (HTML + JS + CSS)

### Type Check

```bash
npm run typecheck
```

## Architecture

```
src/
├── main/           # Electron main process
│   ├── index.ts         # App entry, window creation
│   ├── database.ts      # better-sqlite3 DB (6 tables)
│   ├── ipc-registry.ts  # All IPC handlers
│   ├── library-scanner.ts
│   ├── file-watcher.ts
│   ├── audio-decoder.ts  # FFmpeg → PCM f32le
│   ├── audio-engine.ts  # Playback controller
│   ├── yt-dlp.ts        # YouTube search/download
│   ├── lastfm.ts        # Last.fm scrobbling
│   └── mpris.ts        # Linux MPRIS integration
├── preload/        # contextBridge API
└── renderer/       # React app
    ├── components/
    │   ├── layout/      # Sidebar, TopBar, NowPlayingPanel, MiniPlayerBar
    │   ├── player/      # AudioVisualizer, QualityBadges, PlayerControls, SeekBar, VolumeControl
    │   ├── home/        # HomeView
    │   ├── library/     # LibraryView
    │   ├── playlist/    # PlaylistListView
    │   ├── youtube/     # YouTubeView
    │   ├── equalizer/   # EqualizerView
    │   ├── settings/    # SettingsView
    │   └── ui/          # Button, Input, Slider, Dialog, etc.
    ├── stores/          # Zustand stores (player, library, playlist, queue, youtube, eq, settings)
    └── lib/             # types, utils, ipc, animations
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space | Play/Pause |
| ← / → | Seek ±5s |
| Ctrl+← / Ctrl+→ | Previous/Next track |
| Ctrl+K | Focus search |
| Ctrl+\ | Toggle Now Playing panel |

## Database Schema

6 tables: `tracks`, `covers`, `playlists`, `playlist_tracks`, `downloads`, `settings`

## IPC Channels

40+ IPC channels across: library, player, queue, playlist, youtube, settings, eq, lastfm

## License

MIT
