# Contributing

Tplayer is currently moving from MVP remake to public release readiness. Keep contributions focused, small, and easy to verify.

## Development Setup

```bash
npm install
npm run dev
```

Before opening a pull request or committing a task, run:

```bash
npm run typecheck
npm run build
```

## Commit Scope

Use small task-focused commits. Prefer task names from `remake.md` when working through the roadmap, for example:

```text
B3 repo hygiene pass
```

Do not mix unrelated cleanup, formatting, UI changes, and feature work in the same commit.

## Repo Hygiene Rules

- Do not commit local music files, downloaded tracks, test imports, or scratch audio.
- Do not commit packaged builds such as AppImage, `.exe`, `.deb`, `.rpm`, or installer output.
- Do not commit local notes like `problems.md`; move durable project decisions into `docs/`.
- Keep screenshots and marketing assets in intentional asset folders once they are added.
- Keep README language aligned with `docs/brand.md`.

## UI Direction

The app should preserve the dark editorial music direction described in `docs/brand.md`.

Avoid generic nested-card layouts, random purple-first styling, and dashboard filler. UI changes should make playback, library use, importing, or settings clearer.

## Platform Notes

Linux is the primary development target right now. Windows packaging is planned in the release track.

MPRIS is Linux-specific. Any cross-platform release notes should make that clear.
