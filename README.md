# Tplayer

A polished local-first desktop music player with YouTube import.

Tplayer turns a local music folder into a refined daily player: fast playback, clean queue control, imported tracks beside your albums, Last.fm scrobbling, Linux media-key support, and a warm dark interface built around the music instead of filler dashboards.

[Brand guide](docs/brand.md) · [Releases](https://github.com/Twarga/Tplayer/releases) · [Roadmap](remake.md)

## Status

Tplayer is in active MVP hardening. The app can be developed locally now; packaged public builds are the next release-track milestone.

Planned release targets:

- Linux AppImage
- Windows installer or portable executable
- GitHub Releases with versioned artifacts
- GitHub Pages landing page

## Features

- Local-first library scanning for music folders.
- Playback with queue, seek, shuffle, repeat, and volume control.
- YouTube search and audio import for building a personal library.
- Persistent download history.
- Playlists, albums, artists, folders, and library browsing.
- Last.fm now-playing and scrobbling support.
- MPRIS integration for Linux media controls.
- Equalizer support with presets and persistence.
- Keyboard shortcuts for fast control.
- Dark editorial interface with warm amber/gold accents.

## Screenshots

Public screenshots are being prepared for the release and landing page pass. They should follow the visual rules in [docs/brand.md](docs/brand.md): real app screens, strong album-art focus, warm dark palette, and no generic nested-card marketing mockups.

Recommended screenshot set:

- Home with active playback.
- Library with real local tracks.
- YouTube Import with search and import states.
- Downloads with completed and active imports.

## Downloads

Packaged downloads will be published on the [GitHub Releases page](https://github.com/Twarga/Tplayer/releases).

Until the first packaged release is available, run Tplayer from source using the development steps below.

## Requirements

- Node.js 18 or newer.
- npm.
- FFmpeg available on your system path.
- `yt-dlp` available on your system path for YouTube import.
- Linux is the primary supported desktop during development.

Windows packaging is planned, but daily development and MPRIS support are Linux-first.

## Development

Install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run dev
```

Typecheck:

```bash
npm run typecheck
```

Compile the Electron/Vite app:

```bash
npm run build
```

`npm run build` outputs compiled files to `out/`. Installable desktop packages will be added in the packaging phase.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Space` | Play or pause |
| `Left` / `Right` | Seek backward or forward |
| `Ctrl+Left` / `Ctrl+Right` | Previous or next track |
| `Ctrl+K` | Focus search |
| `Ctrl+\` | Toggle the now-playing panel |

## Tech Stack

- Electron 33 with electron-vite.
- React 19 and TypeScript.
- Tailwind CSS.
- Zustand for client state.
- better-sqlite3 for the local library database.
- music-metadata for audio metadata.
- fluent-ffmpeg for audio decoding support.
- chokidar for library file watching.
- dbus-next for MPRIS integration.

## Project Structure

```text
src/
├── main/       Electron main process, database, playback, integrations
├── preload/    Safe renderer bridge
├── renderer/   React interface, stores, views, player UI
└── shared/     Shared types and utilities
```

Key docs:

- [Brand guide](docs/brand.md): public identity, voice, colors, screenshot direction.
- [Remake plan](remake.md): completed MVP work and post-MVP release plan.
- [Contributing](CONTRIBUTING.md): local setup, commit scope, and contribution rules.
- [Repository hygiene](docs/repository-hygiene.md): what should and should not be committed.

## Release Plan

The release track is split into small tasks:

- `B1`: brand direction.
- `B2`: README remake.
- `B3`: repo hygiene.
- `B4`: metadata and icons.
- `B5`: Linux and Windows packaging.
- `B6`: GitHub release workflow.
- `B7`: manual release checklist.
- `B8` to `B10`: GitHub Pages landing page.
- `B11`: public launch pass.

## License

MIT
