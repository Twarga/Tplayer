# Tplayer — Task List

Complete task checklist from zero to production. Detailed steps for each task are in `implementationplan.md`.

---

## Phase 0: Prerequisites

- [x] **T00** — Verify dev environment (Node 18+, npm, FFmpeg, yt-dlp installed)

---

## Phase 1: Project Foundation

- [x] **T01** — Initialize npm project (`package.json`, scripts, metadata)
- [x] **T02** — Install all dependencies (runtime, renderer, dev deps)
- [x] **T03** — Create TypeScript configs (`tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`)
- [x] **T04** — Create Electron-Vite config (`electron.vite.config.ts` — main/preload/renderer)
- [x] **T05** — Create Electron-Builder config (`electron-builder.yml`, AppImage/deb/rpm targets)
- [x] **T06** — Create Tailwind + PostCSS config (`tailwind.config.ts`, `postcss.config.js`, `globals.css` with design system)
- [x] **T07** — Create renderer entry point (`index.html`, `main.tsx`, `App.tsx` scaffold)
- [x] **T08** — Create shared types (`src/renderer/lib/types.ts` — Track, Playlist, Queue, PlaybackState, etc.)

---

## Phase 2: Backend — Electron Main Process

- [x] **T09** — Create Electron main entry (`src/main/index.ts` — window creation, app lifecycle)
- [x] **T10** — Create IPC registry (`src/main/ipc-registry.ts` — handler registration, push events)
- [x] **T11** — Create database layer (`src/main/database.ts` — better-sqlite3, 6 tables, indexes, default settings)
- [x] **T12** — Create library scanner (`src/main/library-scanner.ts` — folder scan, metadata extraction, cover art)
- [x] **T13** — Create file watcher (`src/main/file-watcher.ts` — chokidar, live add/remove/update)
- [x] **T14** — Create audio decoder (`src/main/audio-decoder.ts` — FFmpeg → PCM f32le, LRU cache)
- [x] **T15** — Create audio engine (`src/main/audio-engine.ts` — playback controller, queue, shuffle, repeat)
- [x] **T16** — Create yt-dlp integration (`src/main/yt-dlp.ts` — YouTube search, audio download, progress)
- [x] **T17** — Create Last.fm integration (`src/main/lastfm.ts` — auth, now playing, scrobble)
- [x] **T18** — Create MPRIS integration (`src/main/mpris.ts` — Linux media keys, DBus, playerctl)

---

## Phase 3: IPC Bridge

- [x] **T19** — Create preload script (`src/preload/index.ts` — contextBridge API, all namespaces)
- [x] **T20** — Create renderer IPC wrapper (`src/renderer/lib/ipc.ts` — typed API, hooks)

---

## Phase 4: UI Foundation

- [x] **T21** — Create utility functions (`src/renderer/lib/utils.ts` — cn(), formatDuration, formatTimeAgo)
- [x] **T22** — Create shadcn/ui components (Button, Input, Slider, Dialog, DropdownMenu, Tooltip, ContextMenu, Tabs, Switch, ScrollArea, Badge, Skeleton, Avatar, Popover, Select)
- [x] **T23** — Create theme provider (`src/renderer/components/ThemeProvider.tsx` — dark/light, accent colors, system sync)

---

## Phase 5: State Management (Zustand Stores)

- [x] **T24** — Create player store (`src/renderer/stores/playerStore.ts` — currentTrack, isPlaying, seek, volume, shuffle, repeat)
- [x] **T25** — Create library store (`src/renderer/stores/libraryStore.ts` — tracks, search, sort, view mode)
- [x] **T26** — Create playlist store (`src/renderer/stores/playlistStore.ts` — playlists, CRUD, reorder)
- [x] **T27** — Create queue store (`src/renderer/stores/queueStore.ts` — queue, history, add/remove/reorder)
- [x] **T28** — Create YouTube store (`src/renderer/stores/youtubeStore.ts` — search results, downloads, progress)
- [x] **T29** — Create EQ store (`src/renderer/stores/eqStore.ts` — 10-band EQ, presets, enable/disable)
- [x] **T30** — Create settings store (`src/renderer/stores/settingsStore.ts` — settings, music folders, persist)

---

## Phase 6: Layout Components (Three-Column Design)

- [x] **T31** — Create sidebar (`src/renderer/components/layout/Sidebar.tsx` — 200px, logo, nav, playlists, settings)
- [x] **T32** — Create top bar (`src/renderer/components/layout/TopBar.tsx` — search, profile, notifications)
- [x] **T33** — Create now playing panel (`src/renderer/components/layout/NowPlayingPanel.tsx` — 320px, tabs, art, controls, queue)
- [x] **T34** — Create mini player bar (`src/renderer/components/layout/MiniPlayerBar.tsx` — 64px, track info, controls, volume)
- [x] **T35** — Create audio visualizer (`src/renderer/components/player/AudioVisualizer.tsx` — animated bars, 60fps)
- [x] **T36** — Create quality badges (`src/renderer/components/player/QualityBadges.tsx` — FLAC, 24-bit, 44.1kHz, Lossless)

---

## Phase 7: View Components

- [ ] **T37** — Create home view (`src/renderer/components/home/HomeView.tsx` — greeting, continue listening, recently added, YouTube imports)
- [ ] **T38** — Create library view (`src/renderer/components/library/LibraryView.tsx` — track list, grid, search, sort, context menu)
- [ ] **T39** — Create playlist views (`PlaylistListView`, `PlaylistDetailView`, `CreatePlaylistDialog` — CRUD, drag reorder)
- [ ] **T40** — Create YouTube view (`src/renderer/components/youtube/YouTubeView.tsx` — search, results, download progress, history)
- [ ] **T41** — Create equalizer view (`src/renderer/components/equalizer/EqualizerView.tsx` — 10 sliders, presets, toggle)
- [ ] **T42** — Create settings view (`src/renderer/components/settings/SettingsView.tsx` — folders, theme, Last.fm, audio, general)

---

## Phase 8: Player Components

- [ ] **T43** — Create player controls (`src/renderer/components/player/PlayerControls.tsx` — shuffle, prev, play/pause, next, repeat)
- [ ] **T44** — Create seek bar (`src/renderer/components/player/SeekBar.tsx` — progress, thumb, time labels)
- [ ] **T45** — Create volume control (`src/renderer/components/player/VolumeControl.tsx` — icon, slider, mute)

---

## Phase 9: Integration & Wiring

- [ ] **T46** — Wire app shell (`App.tsx` — three-column layout, stores init, event subscriptions)
- [ ] **T47** — Implement keyboard shortcuts (`useKeyboard.ts` — Space, arrows, Ctrl combos)
- [ ] **T48** — Add toast notifications (`toastStore.ts`, toast component — success/error/info)
- [ ] **T49** — Handle edge cases (no FFmpeg, no yt-dlp, empty library, corrupt files, DB errors)
- [ ] **T50** — Add loading & empty states (skeletons, illustrations, CTAs for all views)

---

## Phase 10: Polish

- [ ] **T51** — Add animations & transitions (view fade, card hover, button press, progress thumb, panel slide)
- [ ] **T52** — Add drag & drop (playlist reorder, queue reorder, visual feedback)

---

## Phase 11: Production

- [ ] **T53** — Add type checking & linting (ESLint, typecheck scripts, fix all errors)
- [ ] **T54** — Test production build (AppImage, all features, performance, memory)
- [ ] **T55** — Create README & docs (features, install, build, shortcuts, screenshot)

---

## Quick Stats

| | Count |
|---|---|
| **Total Tasks** | 56 (T00–T55) |
| **Phases** | 12 |
| **Backend Tasks** | 11 (T09–T18) |
| **Frontend Tasks** | 32 (T21–T45, T51–T52) |
| **Integration Tasks** | 8 (T19–T20, T46–T50, T53–T55) |
| **Setup Tasks** | 5 (T00–T08) |

**Estimated total time:** ~17 hours

**Start:** T00 → T01 → T02 ... → T55
