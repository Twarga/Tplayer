# Changelog

All notable changes to Tplayer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-09

### Added
- Global search overlay (Ctrl+K) with keyboard navigation and grouped results.
- Track context menu (right-click) with play, queue, playlist, and favorite actions.
- Cover art mosaics for playlist cards and detail headers.
- Real cover art in album and artist grid cards (with lazy loading).
- Favorites section on Home view.
- Time-aware greeting (morning/afternoon/evening) on Home view.
- Re-open button for Now Playing panel in TopBar.
- Batch queue IPC (`queue:setAll`) replacing sequential IPC calls.
- Album art crossfade animation in Now Playing panel.
- Entrance stagger animations for album and artist grids.
- Radix slider for MiniPlayerBar volume control.
- Unified Radix Dialog for Create Playlist (accessible, focus-trapped).

### Changed
- Grid virtualization via @tanstack/react-virtual for Albums, Artists, and Playlists views.
- Shimmer skeleton loading states replaced all `animate-pulse` usage.
- YouTube imports section on Home now only shows YouTube-sourced tracks.
- PlaylistListView and Sidebar use shared CreatePlaylistDialog component.
- QueueView highlights currently-playing row with accent styling.
- NowPlayingPanel collapse now animates width via framer-motion (no jitter).
- Lyrics tab shows placeholder content instead of dead blank UI.

### Fixed
- Removed non-functional Bell notification button from TopBar.
- SettingsView now shows dynamic version from package.json (not hardcoded 0.1.0).
- Eliminated double `loadTracks()` IPC call on startup (AppShell + views).
- MiniPlayerBar cover art now has consistent `rounded-md` border-radius.
- Dead UI removed throughout — no clickable ghosts.

## [0.2.0] - 2026-05-09

### Added
- YouTube playlist URL import with video preview and selection.
- Batch download support with per-item and overall progress tracking.
- Advanced download settings: audio format (mp3/m4a/flac/wav/opus), quality, thumbnail embedding, metadata.
- Tabbed YouTube view (Search, Single URL, Playlist).
- Auto-playlist creation after batch download.
- Settings persistence for download preferences.

### Changed
- Refactored `yt-dlp` backend with `DownloadOptions` and `downloadBatch`.
- YouTube store extended with playlist info, selection set, and download settings state.
- Redesigned YouTube import UI with collapsible advanced settings panel.

### Fixed
- Playlist track association flow tied to creation.
- Mass track selection and removal from playlists.
- Single and batch track deletion from library with disk cleanup.

## [0.1.1] - 2026-05-09

### Added
- Artistic landing-page quote section with Friedrich Nietzsche portrait and music quote.
- Editable display name setting, defaulting to Twarga.
- YouTube playlist URL import support.

### Fixed
- Prevented Home cover art from stretching into oversized single-track panels.
- Improved Settings spacing and removed the narrow two-column feeling.
- Replaced hardcoded top-bar user name.
- Improved pasted YouTube URL detection for videos, shorts, embeds, and playlists.

## [0.1.0] - 2026-05-08

### Added
- Local-first library scanning and playback
- YouTube audio import via `yt-dlp`
- Equalizer with presets
- MPRIS integration for Linux
- Last.fm scrobbling support
- Dark editorial interface
