# Repository Hygiene

This document defines what belongs in the public Tplayer repository.

## Keep

- Source code under `src/`.
- Public docs under `docs/`.
- Root project files required to build, typecheck, package, or explain the app.
- Intentional brand, icon, screenshot, and landing-page assets once they are added.
- Release automation and packaging configuration.

## Do Not Commit

- Local music files or downloaded audio.
- Temporary imports used while testing YouTube download.
- Packaged binaries and installer output.
- Personal notes, debugging notes, and one-off task dumps.
- Machine-specific editor configuration.
- Logs, cache directories, and generated build output.

## Local Notes

Use `problems.md` or `*.local.md` for private notes. These files are ignored. If a note becomes a real project decision, move it into `docs/` and commit it intentionally.

## Media Files

Audio files are ignored by default because Tplayer development creates local test tracks easily. If the project later needs committed audio fixtures, place them in a dedicated fixture folder and update `.gitignore` with a narrow exception.

## Release Artifacts

Release binaries belong in GitHub Releases, not in the repository. This includes:

- AppImage files.
- Windows installers or portable executables.
- Linux packages such as `.deb`, `.rpm`, or `.snap`.
- Auto-update metadata.

## Screenshots

Public screenshots should be committed only when they are prepared for README, releases, or the landing page. They should follow `docs/brand.md` and avoid copyrighted artwork unless permission is clear.
