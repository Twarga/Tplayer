# Tplayer — Implementation Plan

## Task Breakdown

Each task is a self-contained unit of work. Tasks are ordered by dependency — earlier tasks must complete before later ones can begin.

---

### Phase 1: Project Foundation

#### T1 — Initialize npm project and install all dependencies
**Files created:** `package.json`
**Steps:**
1. Create `package.json` with name `tplayer`, version `0.1.0`
2. Set `"main": "./out/main/index.js"` for Electron entry
3. Install runtime deps: `better-sqlite3`, `chokidar`, `fluent-ffmpeg`, `music-metadata`, `yt-dlp-wrap`
4. Install renderer deps: `react`, `react-dom`, `zustand`, `lucide-react`, all `@radix-ui/*` packages
5. Install devDeps: `electron`, `electron-vite`, `electron-builder`, `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `tailwindcss-animate`, `@types/react`, `@types/react-dom`, `@types/better-sqlite3`, `clsx`, `tailwind-merge`, `class-variance-authority`
6. Add npm scripts: `dev`, `build`, `preview`, `lint`, `typecheck`
**Verification:** `npm install` completes without errors

---

#### T2 — Create TypeScript configs
**Files created:** `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`
**Steps:**
1. Root `tsconfig.json` with `compilerOptions`: `target: ESNext`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `jsx: react-jsx`, `paths` aliases (`@/*` → `src/renderer/*`)
2. `tsconfig.node.json` extending root, for main + preload: `lib: ["ESNext"]`, `types: ["node"]`, includes `src/main/**`, `src/preload/**`
3. `tsconfig.web.json` extending root, for renderer: `lib: ["ESNext", "DOM"]`, includes `src/renderer/**`
**Verification:** `npx tsc --noEmit` shows no errors (once files exist)

---

#### T3 — Create electron-vite config
**Files created:** `electron.vite.config.ts`
**Steps:**
1. Define `electron-vite` config with 3 sections: `main`, `preload`, `renderer`
2. Main: entry `src/main/index.ts`, output `out/main`, externalize all node_modules
3. Preload: entry `src/preload/index.ts`, output `out/preload`, externalize all node_modules
4. Renderer: entry `src/renderer/index.html`, output `out/renderer`, React plugin, resolve alias `@` → `src/renderer`
5. Configure `build.rollupOptions.external` for `better-sqlite3` (native module, cannot bundle)
6. Set renderer `server.port` to 5173 (dev), `build.outDir` to `out/renderer`
**Verification:** `npx electron-vite dev` starts without crash (empty renderer is fine)

---

#### T4 — Create Tailwind + PostCSS config (Design System)
**Files created:** `tailwind.config.ts`, `postcss.config.js`, `src/renderer/globals.css`
**Steps:**
1. `tailwind.config.ts`: content paths for `src/renderer/**/*.{ts,tsx}`, darkMode `class`, extend theme with custom colors from designplan.md:
   - Warm dark palette: background (#0D0D0D), surface-1 (#121212), surface-2 (#1A1A1A), surface-3 (#242424), surface-4 (#2A2A2A), surface-5 (#333333)
   - Text colors: primary (#FFFFFF), secondary (#B3B3B3), tertiary (#6A6A6A), muted (#4A4A4A)
   - Accent: warm amber/copper (#E8A87C), accent-hover (#F0C4A0), accent-muted (#E8A87C33)
   - Border colors: subtle (rgba 255,255,255,0.06), default (0.1), strong (0.15)
   - Sidebar bg: #0F0F0F, player bar bg: #0D0D0D
   - Progress: bg (#4A4A4A), fill (#E8A87C), hover (#F0C4A0)
   - Scrollbar thumb: #4A4A4A, hover: #6A6A6A
   - Success green (#1DB954), error red (#E22134), warning amber (#F59E0B)
   - Spacing: 4px base unit (space-1=4px through space-12=48px)
   - Border radius: sm=4px, md=6px, lg=8px, xl=12px, 2xl=16px, full=9999px
2. `postcss.config.js`: tailwindcss + autoprefixer plugins
3. `globals.css`: `@tailwind base/components/utilities`, all CSS custom properties from designplan.md in `:root` and `.dark`, scrollbar styling, selection colors, smooth scroll, Inter font import
4. Define animation timing: ease-default (cubic-bezier 0.4,0,0.2,1), ease-spring (0.34,1.56,0.64,1), ease-bounce (0.68,-0.55,0.265,1.55)
5. Define duration tokens: instant=75ms, fast=150ms, normal=200ms, slow=300ms, slower=500ms
**Verification:** Running dev shows styled HTML with correct dark theme colors

---

#### T5 — Create electron-builder config
**Files created:** `electron-builder.yml`
**Steps:**
1. Set `appId: com.tplayer.app`, `productName: Tplayer`
2. Linux targets: `AppImage`, `deb`, `rpm`
3. `files`: include `out/**/*`, `node_modules/**/*`, exclude source maps in prod
4. `extraResources`: none (or icon)
5. `linux.category`: Audio/AudioVideo
6. `linux.icon`: `resources/icon.png`
7. `asar: true`, compression `maximum`
**Verification:** `npx electron-builder --dir` creates unpacked build

---

#### T6 — Create renderer HTML entry and React mount
**Files created:** `src/renderer/index.html`, `src/renderer/main.tsx`, `src/renderer/App.tsx`
**Steps:**
1. `index.html`: standard HTML5, meta viewport, title "Tplayer", `<div id="root">`, script pointing to `./main.tsx`
2. `main.tsx`: `ReactDOM.createRoot`, render `<App />` in StrictMode, import `globals.css`
3. `App.tsx`: functional component, renders a `<div className="h-screen w-screen bg-background text-foreground">Tplayer</div>` to verify Tailwind works
**Verification:** `npm run dev` opens Electron window showing "Tplayer" with dark background

---

#### T7 — Create shared types
**Files created:** `src/renderer/lib/types.ts`
**Steps:**
1. Define `Track` interface: id, file_path, title, artist, album, album_artist, track_number, disc_number, year, genre, duration, bitrate, sample_rate, file_size, file_format, has_cover, cover_path, date_added, play_count, skip_count, last_played, is_favorite, rating, bpm, color_palette
2. Define `Playlist` interface: id, name, description, created_at, updated_at, track_count?
3. Define `PlaylistTrack` interface: playlist_id, track_id, position, added_at
4. Define `QueueEntry` type: same as Track + queue_index
5. Define `PlaybackState` type: 'idle' | 'loading' | 'playing' | 'paused' | 'error'
6. Define `YtSearchResult` interface: videoId, title, channel, duration, thumbnail url
7. Define `DownloadStatus` type: 'pending' | 'downloading' | 'done' | 'failed'
8. Define `EqualizerBand` interface: frequency, gain
9. Define `Theme` type: 'dark' | 'light'
10. Define `SortField` type: 'title' | 'artist' | 'album' | 'date_added' | 'play_count' | 'duration'
11. Define `SortDirection` type: 'asc' | 'desc'
**Verification:** TypeScript compilation passes

---

### Phase 2: Electron Main Process

#### T8 — Create Electron main process entry
**Files created:** `src/main/index.ts`
**Steps:**
1. Import `app`, `BrowserWindow`, `ipcMain`, `nativeTheme` from electron
2. Import all IPC handlers, database init, file watcher init, audio engine init
3. Declare `mainWindow: BrowserWindow | null`
4. `createWindow()`: create BrowserWindow (1400×900, minWidth 900, minHeight 600, frame true, titleBarStyle default, backgroundColor #0a0a0a, webPreferences: preload script path, contextIsolation true, nodeIntegration false, sandbox false for native modules)
5. Load renderer URL: in dev → `http://localhost:5173`, in prod → `file://...out/renderer/index.html`
6. `app.whenReady()` → init database → init IPC handlers → register file watcher → init audio engine → createWindow()
7. `app.on('window-all-closed')` → quit (except macOS, but we're Linux-first)
8. `app.on('activate')` → recreate window if none
9. Handle `nativeTheme.updated` → send theme change to renderer
**Verification:** `npm run dev` opens an Electron window loading the React app

---

#### T9 — Create IPC registry (all handler registration)
**Files created:** `src/main/ipc-registry.ts`
**Steps:**
1. Export function `registerAllHandlers()` accepting `mainWindow` reference
2. Inside, call individual handler registration functions from each module (library, player, playlist, youtube, queue, settings, eq, lastfm)
3. Use `ipcMain.handle(channel, handler)` pattern for request/response
4. Use `mainWindow.webContents.send(channel, data)` for push events
5. Store `mainWindow` in module-level variable so all handlers can push events
6. Helper function `send(channel, data)` that checks `mainWindow` is not destroyed
**Verification:** No-op handlers registered, no IPC errors in console

---

#### T10 — Create database layer
**Files created:** `src/main/database.ts`
**Steps:**
1. Import `better-sqlite3`, import `app` from electron for path
2. Database file path: `app.getPath('userData')/tplayer.db`
3. Export `db` instance (BetterSqlite3.Database)
4. `initDatabase()`: enable WAL mode, create all 6 tables (tracks, covers, playlists, playlist_tracks, downloads, settings) using `CREATE TABLE IF NOT EXISTS`
5. Create indexes: `idx_tracks_artist`, `idx_tracks_album`, `idx_tracks_title`, `idx_tracks_file_path` (unique already), `idx_tracks_is_favorite`, `idx_playlist_tracks_playlist`, `idx_downloads_status`
6. Insert default settings if not exist: `music_folders` = `[]`, `theme` = `dark`, `accent_color` = `green`, `eq_enabled` = `false`, `eq_bands` = `[0,0,0,0,0,0,0,0,0,0]`, `volume` = `0.8`, `lastfm_api_key` = ``, `lastfm_session_key` = ``, `scan_on_startup` = `true`
7. Export helper functions: `getSetting(key)`, `setSetting(key, value)`, `getAllSettings()`
**Verification:** Run app, check userData folder has tplayer.db with all tables

---

#### T11 — Create library scanner
**Files created:** `src/main/library-scanner.ts`
**Steps:**
1. Import `fs/promises`, `path`, `music-metadata`, `db` from database
2. Export `async scanFolders(folders: string[])`: iterate each folder, scan recursively for audio files
3. Supported extensions: `.mp3`, `.flac`, `.ogg`, `.opus`, `.wav`, `.aac`, `.m4a`, `.wma`, `.aiff`
4. For each file: check if already in DB (by file_path), skip if exists and mtime unchanged
5. `extractMetadata(filePath)`: use `music-metadata.parseFile()`, extract title/artist/album/track/disc/year/genre/duration/bitrate/sampleRate/codec
6. If metadata missing: fallback to filename (e.g., `Artist - Title.mp3`)
7. Extract cover art: check `common.picture[]`, save first image to DB `covers` table (keyed by album+artist), save thumbnail to disk cache at `app.getPath('userData')/covers/{hash}.jpg`
8. `INSERT OR REPLACE INTO tracks` (match on file_path)
9. Return count of new/updated tracks
10. Progress reporting: emit `library:scan-progress` IPC events with `{ current, total, file }` every 10 files
**Verification:** Add a music folder, run scan, check DB has tracks

---

#### T12 — Create file watcher
**Files created:** `src/main/file-watcher.ts`
**Steps:**
1. Import `chokidar`, `path`, `db`, `scanFolders`
2. Export `startWatcher()`: read `music_folders` from settings, create chokidar watcher on each folder
3. Watch options: `ignored: /(^|[\/\\])\../` (ignore dotfiles), `persistent: true`, `ignoreInitial: true`, `awaitWriteFinish: { stabilityThreshold: 2000 }` (wait for file to finish writing)
4. Events:
   - `add` / `change` → scan single file, add/update in DB, emit `library:file-added` to renderer
   - `unlink` → remove from DB (match file_path), emit `library:file-removed`
   - `addDir` → scan new subdirectory
5. Export `stopWatcher()`, `addFolder(path)`, `removeFolder(path)`
6. Debounce: batch rapid changes (e.g., copy 100 files) — collect for 500ms then emit all at once
**Verification:** Copy an mp3 into watched folder, track auto-appears in UI

---

#### T13 — Create audio decoder (FFmpeg → PCM)
**Files created:** `src/main/audio-decoder.ts`
**Steps:**
1. Import `fluent-ffmpeg`, `fs`, `path`, `stream`
2. Export `decodeAudioFile(filePath: string): Promise<AudioBuffer>` where AudioBuffer = `{ pcmData: Float32Array, sampleRate: number, channels: number, duration: number }`
3. Use `fluent-ffmpeg(filePath)` with output options:
   - `format: 'f32le'` (32-bit float little-endian raw PCM)
   - `audioCodec: 'pcm_f32le'`
   - `audioChannels: 2` (stereo)
   - `audioFrequency: 44100` (standardize sample rate)
4. Pipe output to buffer, collect all chunks, convert to Float32Array
5. Handle errors: if FFmpeg not installed, emit error event so UI can show "Install FFmpeg" message
6. Cache decoded audio in memory (Map<filePath, AudioBuffer>) with LRU eviction (max 5 songs)
7. Export `clearDecodeCache()` for memory management
**Verification:** Call decodeAudioFile on a known mp3, verify correct duration

---

#### T14 — Create audio engine (playback controller)
**Files created:** `src/main/audio-engine.ts`
**Steps:**
1. Maintain state: `currentTrack`, `queue[]`, `isPlaying`, `currentTime`, `duration`, `volume`
2. The main process manages state but actual PCM playback happens in renderer via Web Audio API
3. IPC handlers for player commands:
   - `player:play(trackId)` → load track from DB, decode audio via decoder, send `player:load` to renderer with SharedArrayBuffer of PCM data + metadata
   - `player:pause/resume` → toggle `isPlaying`, send `player:playback-state` to renderer
   - `player:seek(time)` → send seek position to renderer, renderer handles AudioBufferSourceNode seeking
   - `player:set-volume(vol)` → send to renderer, update GainNode
4. Track queue logic:
   - `player:next` → pop from queue, play next track
   - `player:prev` → go to previous track (keep history stack of last 50)
   - Auto-advance: when renderer reports `ended`, automatically play next in queue
5. Shuffle mode: shuffle queue indices, send reordered queue to renderer
6. Repeat modes: off / repeat-one / repeat-all
7. On play: increment `play_count`, update `last_played` in DB
8. Emit `player:playback-state` changes to renderer
9. Export `getState()` for other modules (e.g., MPRIS needs current playing info)
**Verification:** Play a track, verify state transitions and IPC events

---

#### T15 — Create yt-dlp integration
**Files created:** `src/main/yt-dlp.ts`
**Steps:**
1. Check if `yt-dlp` is installed on system: `which yt-dlp` or `yt-dlp --version`. If not, give error to renderer with install instructions
2. Export `searchYoutube(query: string): Promise<YtSearchResult[]>`:
   - Run `yt-dlp ytsearch10:"${query}" --dump-json --flat-playlist --no-playlist`
   - Parse JSON output: extract `id`, `title`, `channel`, `duration`, `thumbnail`
   - Return array of up to 10 results
3. Export `downloadAudio(url: string, downloadId: number): Promise<void>`:
   - Create temp dir: `app.getPath('userData')/downloads/`
   - Run `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${downloadDir}/%(title)s.%(ext)s" --embed-thumbnail --add-metadata "${url}"`
   - Monitor progress: parse stdout for `[download]` percentage lines
   - Emit `youtube:download-progress` events with `{ id, progress: 0.0-100.0 }`
   - On complete: move to first music folder from settings (or `~/Music`), scan the file into library
   - Update `downloads` table status to `done`, set `track_id`
   - Emit `youtube:download-done`
   - On error: update `downloads` table status to `failed`, emit `youtube:download-error`
4. Store yt-dlp path in settings so user can configure custom path
5. Export `getDownloadHistory(): Promise<Download[]>` and `clearDownloadHistory()`
**Verification:** Search "lofi hip hop", verify results. Download a short video, verify mp3 appears.

---

#### T16 — Create Last.fm integration
**Files created:** `src/main/lastfm.ts`
**Steps:**
1. Read API key/session from settings
2. Export `scrobble(artist, track, album)`: POST to `https://ws.audioscrobbler.com/2.0/` with method `track.scrobble`, timestamp, signature (MD5 of params + secret)
3. Export `updateNowPlaying(artist, track, album)`: POST method `track.updateNowPlaying`
4. Only scrobble if played > 50% of duration or > 4 minutes
5. Queue scrobbles on failure, retry up to 3 times
6. Auth flow: open browser for user to authorize, receive session key, store in settings
7. Export `isAuthd(): boolean`
**Verification:** With valid API key, play a track, verify Last.fm shows "Now Playing"

---

#### T17 — Create MPRIS integration (Linux media keys)
**Files created:** `src/main/mpris.ts`
**Steps:**
1. Use DBus to register MPRIS interface: `org.mpris.MediaPlayer2.Tplayer`
2. Properties: `Identity` = "Tplayer", `CanRaise` = true, `CanQuit` = true
3. `org.mpris.MediaPlayer2.Player` interface:
   - `PlaybackStatus`: Playing/Paused/Stopped
   - `Metadata`: artist, title, album, artUrl, length
   - `Volume`, `Position`
   - Methods: `Play`, `Pause`, `PlayPause`, `Stop`, `Next`, `Previous`, `Seek`
4. Connect to audio engine state, update MPRIS properties on change
5. Listen for MPRIS method calls → invoke audio engine commands
6. Handle `Raise` method → focus main window
7. Use `dbus-next` library for DBus communication
**Verification:** `playerctl -p Tplayer play-pause`, verify media keys work

---

### Phase 3: Preload & IPC Bridge

#### T18 — Create preload script
**Files created:** `src/preload/index.ts`
**Steps:**
1. Import `contextBridge`, `ipcRenderer` from electron
2. Define the API object to expose to renderer via `contextBridge.exposeInMainWorld('tplayerAPI', api)`
3. The api object has namespaced methods matching each IPC channel:
   ```ts
   {
     library: {
       scan: (folders: string[]) => ipcRenderer.invoke('library:scan', folders),
       getTracks: (opts) => ipcRenderer.invoke('library:get-tracks', opts),
       getTrack: (id) => ipcRenderer.invoke('library:get-track', id),
       toggleFavorite: (id) => ipcRenderer.invoke('library:toggle-favorite', id),
       onFileAdded: (cb) => { ipcRenderer.on('library:file-added', (_, data) => cb(data)); return () => ipcRenderer.removeAllListeners('library:file-added') },
       onFileRemoved: (cb) => { ipcRenderer.on('library:file-removed', (_, data) => cb(data)); return () => ipcRenderer.removeAllListeners(...) },
     },
     player: { ... similar for all player IPC },
     playlist: { ... },
     youtube: { ... },
     queue: { ... },
     settings: { ... },
     eq: { ... },
     lastfm: { ... },
   }
   ```
4. Type-safe: export the API type for use in renderer
5. All methods return Promises (via `invoke`) or unsubscribe functions (via `on`)
6. Never expose `ipcRenderer` directly — only specific methods
**Verification:** In renderer console, `window.tplayerAPI` exists with all namespaced methods

---

#### T19 — Create renderer IPC wrapper + types
**Files created:** `src/renderer/lib/ipc.ts`
**Steps:**
1. Create wrapper functions around `window.tplayerAPI` for clean usage in React
2. Each function calls the corresponding preload API method
3. Add JSDoc comments documenting each function
4. Export a single `api` object with all methods organized by namespace
5. Export `useIPC()` hook: returns the api object (for functional components)
**Verification:** Call `api.player.play(1)` from useEffect, verify IPC works

---

### Phase 4: UI Foundation (shadcn/ui + Theme)

#### T20 — Set up shadcn/ui component library
**Files created:** `src/renderer/lib/utils.ts`, `src/renderer/components/ui/button.tsx`, + ~15 more ui components
**Steps:**
1. `lib/utils.ts`: export `cn()` function using `clsx` + `tailwind-merge`
2. Create each shadcn component manually (since shadcn CLI may not work in this setup):
   - `Button` (variants: default, ghost, outline, secondary, link; sizes: sm, default, lg, icon)
   - `Input`
   - `Slider` (using @radix-ui/react-slider)
   - `Dialog` (using @radix-ui/react-dialog)
   - `DropdownMenu` (using @radix-ui/react-dropdown-menu)
   - `Tooltip` (using @radix-ui/react-tooltip)
   - `ContextMenu` (using @radix-ui/react-context-menu)
   - `Tabs` (using @radix-ui/react-tabs)
   - `Switch` (using @radix-ui/react-switch)
   - `ScrollArea` (using @radix-ui/react-scroll-area)
   - `Separator` (simple div)
   - `Badge`
   - `Skeleton` (loading placeholder)
   - `Avatar`
   - `Popover` (using @radix-ui/react-popover)
   - `Select` (using @radix-ui/react-select)
3. Each component: forwardRef, className passthrough, dark mode support via CSS variables
4. Re-export all from a barrel file `components/ui/index.ts`
**Verification:** Import and render each component, verify styling and interactions

---

#### T21 — Create theme system
**Files created:** `src/renderer/components/ThemeProvider.tsx`
**Steps:**
1. Create React context `ThemeContext` with `{ theme: 'dark'|'light', accent: string, setTheme, setAccent }`
2. `ThemeProvider` component: reads initial theme from settings DB via IPC on mount
3. On theme change: add/remove `dark` class on `document.documentElement`, persist to settings DB
4. On accent change: set CSS variable `--accent` to the hex color of selected accent
5. Expose accent colors from designplan.md: warm amber (#E8A87C, default), green (#1DB954), blue (#1E90FF), purple (#8B5CF6), orange (#F97316), pink (#EC4899), red (#EF4444)
6. Listen for system theme changes via `matchMedia('(prefers-color-scheme: dark)')`
7. Export `useTheme()` hook for consuming components
**Verification:** Toggle theme, verify `dark` class toggles on `<html>`, warm amber accent visible

---

### Phase 5: Layout Components

#### T22 — Create sidebar component (Design: 200px, sections)
**Files created:** `src/renderer/components/layout/Sidebar.tsx`
**States:** normal (default)
**Steps:**
1. Fixed left sidebar, 200px wide, flex column, height: calc(100vh - 64px), background: var(--sidebar-bg) #0F0F0F, border-right: 1px solid var(--border-subtle)
2. Top section: App logo — "T" in 32px circle with accent bg + "Tplayer" text (18px, weight 700) + chevron down icon (16px, muted), padding: 0 16px 20px, flex row, gap: 8px
3. **Navigation links** (Home, Library): height 36px, padding 0 12px, border-radius 6px, flex row gap 12px, font 14px weight 500, color text-secondary, icon 20px. Active: bg surface-3, color text-primary. Hover: bg surface-2
4. **Section label "YOUR MUSIC"**: 11px uppercase, weight 600, letter-spacing 0.05em, color text-tertiary, padding: 16px 16px 8px
5. **Music section links** (Songs, Albums, Artists, Playlists, Folders): same link style, with appropriate lucide icons (Music, Disc, Users, ListMusic, Folder)
6. **Section label "IMPORT & DISCOVER"**: same style
7. **Import links** (YouTube Import with red YouTube-style icon, Discover with Compass icon)
8. **Section label "PLAYLISTS"**: with "+" button on right (24px, rounded, hover:bg-surface-2) → opens CreatePlaylistDialog
9. **Playlist list**: scrollable, each item same link style with small music note icon. Playlists: Lofi Beats, Gym Motivation, Night Drive, Favs (heart icon, red), Classical Collection. Active playlist highlighted. Right-click: context menu (Rename, Delete)
10. **Bottom actions**: sticky bottom, Settings (gear icon) + Accessibility (eye icon), same link style
11. All items: smooth hover transitions 200ms ease-default
**Verification:** Sidebar renders with all sections from image, clicking navigates, playlists work

---

#### T23 — Create main content area (scrollable, with TopBar)
**Files created:** `src/renderer/components/layout/MainContent.tsx`
**States:** loading (skeleton), empty (illustration), content, error
**Steps:**
1. Flex-grow container, flex column, height: calc(100vh - 64px), overflow: hidden
2. Contains `TopBar` (D1) at top, scrollable content area below
3. Content area: padding 24px, overflow-y auto, custom scrollbar styling
4. Switch on active view from global store:
   - `home` → `HomeView` (D2) — default view with greeting, continue listening, recently added, youtube imports
   - `library` → `LibraryView` (T26)
   - `playlist` → `PlaylistDetailView` (T32)
   - `youtube` → `YouTubeView` (T34)
   - `equalizer` → `EqualizerView` (T35)
   - `settings` → `SettingsView` (T36)
5. Page-level animations: fade-in (opacity 0→1, transform translateY(8px)→0, 200ms ease-out) on view switch
6. Error boundary wrapper: catch render errors, show "Something went wrong" with retry button
**Verification:** Home view is default, selecting different sidebar items renders correct views with animations

---

#### T24 — Create app shell (three-column layout)
**Files created:** `src/renderer/App.tsx` (updated)
**States:** normal, now-playing-collapsed, mini-player-open
**Steps:**
1. App root: `ThemeProvider` wrapping `div.h-screen.w-screen.bg-background.text-foreground.overflow-hidden.flex.flex-col`
2. Main layout row: `div.flex.flex-1.overflow-hidden` containing:
   - `Sidebar` (T22) — fixed 200px left
   - `MainContent` (T23) — flex:1, scrollable
   - `NowPlayingPanel` (D3) — 320px right, toggleable
3. `MiniPlayerBar` (D4) — full width bottom, 64px, always visible when track loaded
4. Now Playing Panel toggle: button in TopBar (D1) to collapse/expand right panel. When collapsed: width 0, content hidden. Transition: width 300ms ease-out
5. Responsive behavior: on window width < 1024px, auto-collapse NowPlayingPanel to overlay mode (absolute, right:0, z-50, backdrop blur behind)
6. Keyboard shortcut: `Ctrl + \` toggles Now Playing Panel
7. All stores initialized on app mount via useEffect
8. Global keyboard shortcuts: Space (play/pause), ←/→ (seek ±5s), Ctrl+←/→ (prev/next), Ctrl+F (focus search), Ctrl+L (library view), Ctrl+K (search)
**Verification:** App layout matches image three-column design, responsive behavior works

---

### Phase 5b: Design-Specific Components (from image)

#### D1 — Create top bar component (search + profile + actions)
**Files created:** `src/renderer/components/layout/TopBar.tsx`
**States:** normal, searching (focused)
**Steps:**
1. Height: 64px, padding: 0 24px, flex row, align-center, justify-between, transparent background
2. **Search input**: width 400px (max 500px, flex:1), height 40px, bg var(--input-bg) #1A1A1A, border 1px solid var(--input-border), border-radius 8px, padding: 0 16px 0 40px (space for 18px Search icon on left, color text-tertiary)
3. Search placeholder: "Search songs, artists, albums...", color text-tertiary
4. Focus state: border-color accent, box-shadow 0 0 0 3px rgba(232,168,124,0.15)
5. Right side of search: "Ctrl K" hint — 11px, color muted, bg surface-2, padding 2px 6px, radius 4px
6. **Right actions**: flex row, gap 12px, align-center
   - Activity/charts icon (BarChart3, 20px, text-tertiary)
   - Notifications bell (Bell, 20px, text-tertiary, red dot indicator if unread)
   - Profile: Avatar (32px circle, gray placeholder) + "Younes" text + ChevronDown (16px). Padding 4px 8px, radius 6px, hover:bg-surface-2. Click opens dropdown (D7)
**Verification:** Top bar renders correctly, search input styles match image

---

#### D2 — Create Home view (greeting + continue listening + recently added + youtube imports)
**Files created:** `src/renderer/components/home/HomeView.tsx`, `ContinueListeningCard.tsx`, `RecentlyAddedItem.tsx`, `YouTubeImportRow.tsx`
**States:** loading (skeleton), empty (no data), loaded
**Steps:**
1. **Greeting section**: margin-bottom 32px
   - Title: "Good evening, [username]" — Display style (32px, weight 700, color text-primary)
   - Subtitle: "Enjoy your music" — Body (14px, weight 400, color text-secondary), margin-top 4px
2. **Continue listening**: section header "Continue listening" (H2, 20px, weight 600) + right arrow/chevron
   - Grid: `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))`, gap 20px
   - `ContinueListeningCard`:
     - bg surface-1, radius-lg (8px), padding 12px, transition 200ms
     - Album art container: aspect-ratio 1/1, radius-md (6px), overflow hidden, position relative
     - Image: object-fit cover, 100%
     - Hover overlay: gradient from transparent 50% to rgba(0,0,0,0.6) 100%, opacity 0→1
     - Play button (appears on hover): 48px circle, bg accent, color dark, radius-full, centered, box-shadow 0 4px 12px rgba(0,0,0,0.4). Transform translateY(8px)→0, opacity 0→1, transition 300ms ease-spring (bounce)
     - Track info below: title 14px weight 600, artist 13px weight 400 color text-secondary, 1 line ellipsis each
     - Progress bar (if currently playing): height 3px, bg progress-bg, fill accent, radius-full, margin-top 8px
3. **Recently added**: section header "Recently added" + right arrow
   - Flex row, gap 16px, overflow-x auto, padding-bottom 8px, scroll-snap x
   - `RecentlyAddedItem`: width 140px, flex-shrink 0, scroll-snap-align start
     - Thumbnail: aspect-ratio 1/1, radius-md
     - Artist name: 13px weight 500, margin-top 8px, 1 line
     - Album name: 12px weight 400, color text-secondary, 1 line
     - Hover: image scale 1.03, transition 300ms
4. **YouTube imports**: section header "YouTube imports"
   - `YouTubeImportRow`: height 56px, flex row, align-center, gap 12px, padding 0 12px, radius-md
     - Hover: bg surface-2
     - Thumbnail: 40×40, radius-sm
     - Title: flex 1, 14px weight 500, 1 line ellipsis
     - Duration: 12px, color text-tertiary, width 48px right-align
     - Format badge (MP3): padding 2px 8px, bg surface-3, radius-sm, 11px weight 600 uppercase, color text-secondary
     - Quality badge (320kbps): same style
     - Time ago (2 days ago): 12px, color text-tertiary, width 80px
     - 3-dot menu: 32×32, radius-full, color text-tertiary, hover:bg-surface-3
**Verification:** Home view matches image layout exactly

---

#### D3 — Create Now Playing Panel (persistent right sidebar, 320px)
**Files created:** `src/renderer/components/layout/NowPlayingPanel.tsx`
**States:** collapsed (0px width), expanded (320px), no-track (empty state)
**Steps:**
1. Width: 320px, height: calc(100vh - 64px), bg surface-1 with radial gradient overlay (center 50% 30%, accent at 5% opacity fading to transparent), border-left: 1px solid border-subtle, padding 24px, flex column
2. **Tab bar**: flex row, gap 24px, border-bottom 1px solid border-subtle, padding-bottom 12px, margin-bottom 20px
   - Tabs: "Now Playing", "Lyrics"
   - Inactive: 14px weight 500, color text-tertiary
   - Active: color text-primary, bottom border 2px accent, radius 2px 2px 0 0
   - Hover inactive: color text-secondary
3. **Album art**: width 100%, aspect-ratio 1/1, radius-lg, overflow hidden, box-shadow 0 8px 32px rgba(0,0,0,0.5), margin-bottom 20px
4. **Track info**: flex row, justify-between, align-flex-start, margin-bottom 16px
   - Left: title 16px weight 600, artist 14px weight 400 color text-secondary
   - Right: Heart icon button (32px, text-tertiary, hover:accent, active/favorited: accent fill)
5. **Progress bar**: width 100%, height 4px, bg progress-bg, radius-full, cursor pointer, margin-bottom 8px
   - Fill: height 100%, bg accent, radius-full, transition width 100ms
   - Hover: height 6px, thumb appears (12px circle, bg accent, shadow)
   - Time labels below: flex row justify-between, 11px, color text-tertiary
6. **Player controls**: flex row, justify-center, align-center, gap 16px, margin 16px 0
   - Shuffle: 20px, text-tertiary, active:accent
   - Prev: 24px, text-primary, hover:scale 1.1
   - Play/Pause: 56px circle, bg accent, color dark (background), radius-full, shadow 0 4px 16px rgba(232,168,124,0.3), hover:scale 1.05, active:scale 0.95
   - Next: same as prev
   - Repeat: same as shuffle
7. **Quality badges**: flex row, gap 8px, flex-wrap, margin-bottom 24px
   - Badge style: padding 4px 10px, bg surface-2, border 1px solid border-default, radius-sm, 11px weight 600, color text-secondary
   - Badges: FLAC, 24-bit, 44.1 kHz, Lossless
8. **Queue section**: border-top 1px solid border-subtle, padding-top 16px, flex 1, overflow-y auto
   - Header: "Queue" 14px weight 600 + "Clear" 12px weight 500 text-tertiary (hover:text-primary)
   - Queue item: height 48px, flex row, align-center, gap 10px, padding 0 8px, radius-md
     - Hover: bg surface-2
     - Thumbnail: 36×36, radius-sm
     - Info: flex 1. Title 13px weight 500, Artist 12px weight 400 text-secondary
     - Duration: 12px text-tertiary
     - Playing indicator: animated bars, accent color
   - Drag handle: grip icon, opacity 0→1 on hover
9. Collapse/expand toggle button in top bar
**Verification:** Now Playing Panel matches image exactly, queue works, controls functional

---

#### D4 — Create Mini Player Bar (compact bottom bar, 64px)
**Files created:** `src/renderer/components/layout/MiniPlayerBar.tsx`
**States:** hidden (no track), visible
**Steps:**
1. Height: 64px, full width, bg player-bar-bg (#0D0D0D), border-top 1px solid border-subtle, padding 0 16px, flex row, align-center, justify-between
2. **Left section** (25%): flex row, align-center, gap 12px
   - Album art: 48×48, radius-sm
   - Info: title 13px weight 500, artist 12px weight 400 text-secondary
   - Badges: FLAC | 24-bit | 44.1 kHz (inline, small, muted)
   - Heart icon: 18px, text-tertiary, hover:accent
3. **Center section** (50%): flex column, align-center, gap 4px
   - Controls row: flex row, align-center, gap 20px
     - Shuffle 18px, Prev 20px, Play/Pause 40px circle bg accent color dark, Next 20px, Repeat 18px
   - **Audio visualizer**: width 120px, height 20px, flex row, align-center, justify-center, gap 2px (D5)
4. **Right section** (25%): flex row, align-end, justify-flex-end, gap 12px
   - Volume: speaker icon (18px, text-tertiary) + slider (100px wide, 4px height)
   - Mini player toggle icon (18px)
   - Queue toggle icon (18px)
5. Transition: slide up from bottom on track start (transform translateY, 300ms)
**Verification:** Bottom bar matches image, visualizer animates

---

#### D5 — Create audio visualizer component
**Files created:** `src/renderer/components/player/AudioVisualizer.tsx`
**States:** idle (flat bars), playing (animated bars)
**Steps:**
1. Canvas-based or CSS-based animated bars
2. 20-30 vertical bars, each 2px wide, gap 2px
3. Bar colors: accent color at varying opacity (0.3-1.0) based on simulated height
4. Height animation: random oscillation between 4px and 20px, smooth sine-wave-like movement
5. When music is playing: bars animate continuously with randomized heights
6. When paused: bars settle to flat/low state
7. Use requestAnimationFrame for smooth 60fps animation
8. Optional (v2): connect to real Web Audio API AnalyserNode for actual frequency data
**Verification:** Visualizer animates smoothly when playing, pauses when stopped

---

#### D6 — Create quality badges component
**Files created:** `src/renderer/components/player/QualityBadges.tsx`
**States:** normal
**Steps:**
1. Reusable component accepting array of badge strings
2. Flex row, gap 8px, flex-wrap
3. Each badge: padding 4px 10px, bg surface-2, border 1px solid border-default, radius-sm, font 11px weight 600, color text-secondary, uppercase
4. Badges shown based on track metadata: FLAC (format), 24-bit (bit depth), 44.1 kHz (sample rate), Lossless (if lossless format), 320kbps (if MP3), etc.
5. Extract bit depth from audio metadata (music-metadata provides this)
**Verification:** Badges render correctly for different audio formats

---

#### D7 — Create profile dropdown menu
**Files created:** `src/renderer/components/layout/ProfileDropdown.tsx`
**States:** closed, open
**Steps:**
1. Trigger: Avatar (32px circle) + username + ChevronDown. Click toggles dropdown
2. Dropdown: absolute positioned below trigger, bg surface-1, border 1px solid border-default, radius-lg, shadow 0 8px 24px rgba(0,0,0,0.5), min-width 200px, padding 8px 0
3. Menu items: Account settings, Keyboard shortcuts, About, Separator, Log out
4. Each item: height 36px, padding 0 16px, flex row, gap 12px, align-center, font 14px weight 400, color text-primary
5. Hover: bg surface-2
6. Close on click outside or Escape key
7. Use DropdownMenu component from shadcn/ui
**Verification:** Dropdown opens/closes correctly, items clickable

---

### Phase 6: Core Feature — Library

#### T25 — Create Zustand stores (all stores scaffold)
**Files created:** `src/renderer/stores/playerStore.ts`, `libraryStore.ts`, `playlistStore.ts`, `queueStore.ts`, `youtubeStore.ts`, `eqStore.ts`, `settingsStore.ts`
**Steps:**
1. `playerStore`: currentTrack, isPlaying, currentTime, duration, volume, isShuffled, repeatMode, playbackState. Actions: play, pause, toggle, next, prev, seek, setVolume, toggleShuffle, setRepeat
2. `libraryStore`: tracks[], isLoading, searchQuery, sortField, sortDirection, viewMode. Actions: loadTracks, search, sort, toggleFavorite
3. `playlistStore`: playlists[], activePlaylistId, playlistTracks[]. Actions: load, create, delete, rename, addTrack, removeTrack, reorder
4. `queueStore`: queue[], history[]. Actions: add, addNext, remove, reorder, clear, getNext, getPrev
5. `youtubeStore`: searchResults[], isSearching, downloads[]. Actions: search, download, removeFromHistory
6. `eqStore`: bands[10], isEnabled, presetName. Actions: setBand, setBands, enable, disable, loadPreset
7. Each store wraps IPC calls internally. On mount, subscribe to push events from main process
**Verification:** Each store is usable from components, data flows correctly

---

#### T26 — Create library view with track list
**Files created:** `src/renderer/components/library/LibraryView.tsx`, `TrackRow.tsx`
**States:** loading (skeleton rows), empty (no music found illustration + "Add a folder" CTA), loaded (track list), error (retry button)
**Steps:**
1. `LibraryView`: useEffect → call `api.library.getTracks()`, populate libraryStore
2. Header: "Library" title, search input (with debounce 300ms), sort dropdown (Title/Artist/Album/Date Added/Plays), view toggle (list/grid), scan button (refresh icon)
3. `TrackRow` component for each track:
   - Column layout: # (index) | Album art (40×40) | Title + Artist stacked | Album | Duration (mm:ss) | Favorite icon
   - Hover: row background highlights, favorite icon appears if not favorited, play button overlay on album art
   - Double-click: play track
   - Right-click: context menu (Play, Play Next, Add to Queue, Add to Playlist > submenu, Go to Artist, Go to Album, Show in File Manager, Delete, Properties)
   - Click on artist/album: triggers search filter for that artist/album
   - Currently playing track: green text + speaker icon/waveform animation on album art
4. Virtual scrolling for large libraries: only render visible rows + 10 buffer (use a virtual list approach or pagination with infinite scroll)
5. Keyboard nav: arrow keys to move selection, Enter to play, Space to pause
**Verification:** Library shows tracks, search filters correctly, clicking plays

---

#### T27 — Create album art view (grid mode)
**Files created:** `src/renderer/components/library/AlbumArtView.tsx`
**States:** loading, loaded, empty
**Steps:**
1. Grid of album cards (4-5 columns responsive)
2. Each card: album art (≈160×160), album name, artist name
3. Click: filters library to show only tracks from that album
4. Play button overlay on hover
5. Use cached cover images from DB `covers` table
6. Fallback: gradient placeholder with album initial letter if no art
**Verification:** Grid view shows albums, clicking filters correctly

---

### Phase 7: Player Controls

#### T28 — Create player controls component
**Files created:** `src/renderer/components/player/PlayerControls.tsx`
**States:** idle, loading, playing, paused
**Steps:**
1. Row of control buttons centered: Shuffle | Previous | Play/Pause (larger, circle) | Next | Repeat
2. Shuffle button: green when active, current shuffle state
3. Repeat button: cycles off → repeat-all (green) → repeat-one (green with "1" badge)
4. Play/Pause: circle button with scale animation on state change. Shows PlayIcon when paused, PauseIcon when playing
5. Previous: skip to start if > 3s in, otherwise previous track
6. Next: skip to next track in queue
7. Tooltips on hover for each button
8. Button states: disabled (idle/loading), active (playing/paused), hover scale: 1.05
**Verification:** All controls work, state changes correctly

---

#### T29 — Create seek bar component
**Files created:** `src/renderer/components/player/SeekBar.tsx`
**States:** disabled (no track), active (playing/paused)
**Steps:**
1. Horizontal slider from @radix-ui/react-slider, customized styling
2. Track: thin line (3px), primary color filled portion, gray unfilled
3. Thumb: invisible until hover, then 12px circle
4. Current time label (left): `m:ss` format
5. Duration label (right): `m:ss` format, or `-m:ss` remaining on click toggle
6. Hover: show tooltip with time at hover position
7. Seek on click/drag: call `api.player.seek(timeInSeconds)`
8. Smooth animation: fill progresses smoothly even during buffering
9. Respond to `player:time-update` events from main process (frequent updates for smooth bar)
**Verification:** Seek bar fills during playback, clicking seeks correctly

---

#### T30 — Create volume control
**Files created:** `src/renderer/components/player/VolumeControl.tsx`
**States:** normal, muted
**Steps:**
1. Volume icon button: shows speaker icon varying based on level (0%, 1-33%, 34-66%, 67-100%) via lucide Volume, Volume1, Volume2 icons
2. Click icon: toggle mute (set volume to 0, remember previous volume)
3. Hover icon: expand slider horizontally to the left (120px wide), smooth transition
4. Slider: vertical/horizontal, 0-100 range, primary color fill
5. Call `api.player.setVolume(value / 100)` on change
6. Persist volume in settings DB
**Verification:** Slider adjusts volume, mute toggles correctly

---

### Phase 8: Playlists & Queue

#### T31 — Create playlist list view (sidebar section)
**Files created:** `src/renderer/components/playlist/PlaylistListView.tsx`, `CreatePlaylistDialog.tsx`
**States:** empty (no playlists + CTA), loaded
**Steps:**
1. Renders inside Sidebar's playlist section
2. List of playlist names, click selects playlist → switches main view to PlaylistDetailView
3. Active playlist highlighted
4. "+" button opens `CreatePlaylistDialog`: modal with name input + optional description, "Create" button
5. Right-click context menu on playlist: Rename (inline edit), Delete (confirm dialog)
6. Rename: click to edit inline, Enter to save, Esc to cancel
**Verification:** Create, rename, delete playlists work correctly

---

#### T32 — Create playlist detail view
**Files created:** `src/renderer/components/playlist/PlaylistDetailView.tsx`
**States:** loading, empty (no tracks in playlist + "Add tracks" CTA), loaded
**Steps:**
1. Header: playlist name (large), description, track count, "Play All" button, "..." menu (Rename, Delete, Add Tracks)
2. Reuses `TrackRow` component from library
3. Drag-and-drop reordering: use HTML5 drag and drop or a library like `@dnd-kit/core`
4. Drag handle on left of each row (grip icon)
5. Right-click context menu on tracks: "Remove from playlist"
6. "Add Tracks" button: opens a dialog/modal showing full library with checkboxes, filter/search, "Add Selected" button
**Verification:** Reorder tracks via drag, add/remove tracks, play from playlist

---

#### T33 — Create queue view
**Files created:** `src/renderer/components/queue/QueueView.tsx`
**States:** empty (nothing playing + no queue), now-playing-only, full queue
**Steps:**
1. Top section: "Now Playing" hero — large album art (200×200), track title, artist, album info, seek bar, controls, color gradient background extracted from art
2. Below: "Upcoming" section — list of queued tracks
3. Each upcoming track: album art (32×32), title, artist, duration, drag handle
4. Drag to reorder upcoming tracks
5. Swipe/button to remove from queue
6. "Clear Queue" button at bottom
7. Empty state: "Queue is empty. Find something to play!"
**Verification:** Tracks queue correctly, reorder works, clear works

---

### Phase 9: YouTube Download

#### T34 — Create YouTube search and download view
**Files created:** `src/renderer/components/youtube/YouTubeView.tsx`, `SearchResults.tsx`, `DownloadCard.tsx`
**States:** initial (search prompt), searching (spinner), results, no-results (sad face), error
**Steps:**
1. `YouTubeView`: top section with search input (placeholder "Search YouTube...") + URL paste input (placeholder "Paste YouTube URL...")
2. URL input: paste a URL → validate it's a YouTube URL → call download directly
3. Search: debounce 500ms → call `api.youtube.search(query)` → populate store
4. `SearchResults`: grid of result cards (3 columns)
5. Each card: thumbnail (16:9), title (2 lines max), channel name, duration badge, download button
6. Download button: click → call `api.youtube.download(url, videoId)` → show progress
7. `DownloadCard`: shows active/finished/failed downloads
   - Active: progress bar, percentage, cancel button
   - Done: "Added to library" with link to track
   - Failed: error message, retry button
8. Bottom section: download history list (last 20)
**Verification:** Search works, download starts and completes, track appears in library

---

### Phase 10: Equalizer

#### T35 — Create equalizer view
**Files created:** `src/renderer/components/equalizer/EqualizerView.tsx`
**States:** disabled, enabled
**Steps:**
1. Enable/disable toggle at top (Switch component) — calls `api.eq.enable(bool)`
2. 10 vertical sliders for frequency bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz
3. Each slider: frequency label below, dB value above (±12dB range)
4. Slider styling: thin track, primary color fill, 8px thumb
5. Double-click slider to reset to 0dB
6. Preset selector dropdown: Flat, Rock, Pop, Jazz, Classical, Hip-Hop, Electronic, Vocal Boost, Bass Boost, Custom
7. Preset applies set of values to all sliders
8. Changes send to main process in real-time → main process sends to renderer Web Audio API EQ nodes
9. Real-time visualizer (optional): small waveform/canvas showing frequency response of current EQ
**Verification:** Sliders change EQ sound, presets work, toggle enables/disables

---

### Phase 11: Settings

#### T36 — Create settings view
**Files created:** `src/renderer/components/settings/SettingsView.tsx`
**States:** loading, loaded, saving
**Steps:**
1. Sections with headers separated by dividers
2. **Music Folders**: list of current folders, "Add Folder" button (opens native folder dialog via IPC), "Remove" button per folder, "Rescan All" button
3. **Appearance**: theme toggle (dark/light switch), accent color picker (6 color dots)
4. **Last.fm**: API key input, session status indicator ("Connected"/"Not Connected"), Connect/Disconnect button, scrobbling toggle
5. **Audio**: default volume slider, crossfade toggle + duration (0-12s), replay gain toggle
6. **General**: "Scan on startup" toggle, "Close to tray" toggle, "Show mini player" toggle
7. Each change auto-saves to settings DB via IPC
8. About section: version, GitHub link, credits
**Verification:** All settings persist across app restart

---

### Phase 12: Extra Features

#### T37 — Create mini player
**Files created:** `src/renderer/components/layout/MiniPlayer.tsx`
**States:** hidden, visible
**Steps:**
1. Second BrowserWindow, small (400×200), frameless with custom titlebar, always-on-top optional
2. Content: album art (left, 64×64), track info, play/pause + prev/next buttons, seek bar (thin), volume icon
3. Close button minimizes back to main window
4. Toggle button in main NowPlayingBar opens/closes mini player
5. Open/close handled by main process via IPC `window:open-mini-player` / `window:close-mini-player`
6. Sync state with main player store (same Zustand store across windows? — actually need IPC sync)
**Verification:** Mini player opens, shows current track, controls work

---

#### T38 — System tray integration
**Files created:** integration in `src/main/index.ts`
**Steps:**
1. Create `Tray` with icon, tooltip "Tplayer"
2. Context menu: Show/Hide, Play/Pause, Next, Previous, Quit
3. Close to tray: when main window closes, hide instead of quit (if setting enabled)
4. Tray icon click: toggle window visibility
5. Use `nativeImage.createFromPath()` for tray icon
**Verification:** Tray icon appears, menu works, minimize to tray works

---

### Phase 13: Integration & Polish

#### T39 — Wire up all views in App.tsx
**Files created:** update `src/renderer/App.tsx`
**Steps:**
1. App structure: `ThemeProvider` > `div.h-screen.flex.flex-col` > `div.flex.flex-1.overflow-hidden` > `Sidebar` + `MainContent` + `NowPlayingBar`
2. All stores initialized on mount (fetch data from DB)
3. Subscribe to real-time events: library file changes, download progress, player state updates
4. Keyboard shortcut handler: Space (play/pause), Left/Right arrows (seek ±5s), Ctrl+Left/Right (prev/next), Ctrl+F (focus search), Ctrl+L (library view)
5. Handle `beforeunload`: save current state (queue, volume, position)
6. Handle window resize: responsive sidebar collapse on small width
**Verification:** App launches, all views accessible, keyboard shortcuts work

---

#### T40 — Loading states, empty states, error states, edge cases
**Files created:** updates across all view components
**Steps:**
1. Every data-fetching component: show `Skeleton` UI while loading (pulsing gray blocks)
2. Every list view: empty state with illustration + CTA button
3. Error states: red banner with error message + retry button
4. Edge cases to handle explicitly:
   - No FFmpeg installed → error banner in player: "FFmpeg not found. Install with: sudo apt install ffmpeg"
   - No yt-dlp installed → error banner in YouTube view with install instructions
   - File deleted while playing → skip to next track, show toast: "File not found"
   - Empty library → big "No music yet" with "Add Music Folder" and "Download from YouTube" CTAs
   - Database corruption → auto-recreate DB, rescan folders
   - Memory pressure → clear decode cache, warn if > 1000 tracks loaded
5. Toast notification system for transient messages (downloaded, added to playlist, etc.)
**Verification:** Test each edge case, verify graceful handling

---

#### T41 — Animations, transitions, micro-interactions
**Files created:** updates across all components
**Steps:**
1. View transitions: fade in (opacity 0→1, 200ms ease-out) on route change
2. Track row hover: background color transition + play button scale
3. NowPlayingBar: slide up on track load, slide down on stop
4. Queue addition: slide in from right
5. Download progress: smooth progress bar animation
6. Button press: scale 0.95 briefly, then spring back
7. Album art: subtle scale on hover (1.02), shadow increase
8. Slider thumbs: smooth drag with visual feedback
9. Sidebar collapse/expand: smooth width transition
10. All transitions use `transition-all duration-200` or similar Tailwind classes
**Verification:** All animations smooth, no jank, 60fps

---

#### T42 — Final testing, linting, build verification
**Steps:**
1. Run `npm run typecheck` — fix all TypeScript errors
2. Run `npm run lint` — fix all ESLint warnings/errors
3. Run `npm run build` — ensure electron-builder produces working AppImage
4. Install built AppImage on a clean system, verify:
   - App launches
   - Can add music folder
   - Tracks appear in library
   - Playback works (MP3, FLAC, OGG)
   - Playlists work
   - YouTube download works
   - Settings persist
5. Performance: > 1000 tracks library should load < 2 seconds, scroll smoothly
6. Memory: idle < 100MB, playing < 200MB
7. Dark/light theme switching, all views
**Verification:** Production build works end-to-end

---

## Task Dependency Graph

```
Phase 1 (Foundation)
  T1 ─┬─► T2 ─► T3
      └─► T4 T5 T6 T7

Phase 2 (Main Process)
  T8 ─► T9 ─► T10 ─► T11 ─► T12
                           └─► T13 ─► T14
                                       ├─► T15
                                       ├─► T16
                                       └─► T17

Phase 3 (Preload)
  T18 ─► T19

Phase 4 (UI Foundation)
  T20 ─► T21

Phase 5 (Layout)
  T21 ─► T22 ─► T23
         │       │
         │       └─► D1 (TopBar)
         │
         └─► D2 (HomeView)
         │
         └─► D3 (NowPlayingPanel)
         │     ├─► D5 (Visualizer)
         │     └─► D6 (QualityBadges)
         │
         └─► D4 (MiniPlayerBar)
               └─► D5 (Visualizer)
         │
         └─► D7 (ProfileDropdown)

Phase 6 (Library)
  T25 (independent, but after T19 for IPC)
  T19 ─► T25 ─► T26 ─► T27

Phase 7 (Player Controls)
  T25 ─► T28 ─► T29 ─► T30

Phase 8 (Playlists & Queue)
  T25 ─► T31 ─► T32
         └─► T33 (Queue in panel)

Phase 9 (YouTube)
  T15 T19 T25 ─► T34

Phase 10 (Equalizer)
  T14 T25 ─► T35

Phase 11 (Settings)
  T10 T21 ─► T36

Phase 12 (Extra)
  T23 T25 ─► T37
  T8 ─► T38

Phase 13 (Integration)
  All prior ─► T39 ─► T40 ─► T41 ─► T42
```

**Parallelizable groups:** 
- T1+T4+T5+T6+T7
- T13+T15+T16+T17
- T20+T25
- T26+T28
- D1+D2+D3+D4+D5+D6+D7 (all design components can be built in parallel once T21/T22 done)
- T31+T32+T33+T34+T35+T36

---

## Updated Totals

| Metric | Count |
|--------|-------|
| **Tasks** | 49 (42 original + 7 design-specific) |
| **Files** | ~65 |
| **Lines of Code** | ~10,000-15,000 |
| **Components** | ~35 |
| **Stores** | 7 |
| **IPC Channels** | 40+ |
