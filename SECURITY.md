# Security Policy

## Supported versions

Only the latest release on `main` is actively supported with security fixes. Older versions may not receive patches.

| Version | Supported |
|---|---|
| `0.3.x` (latest) | ✅ |
| `< 0.3.0` | ❌ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately so users can be protected while a fix is prepared.

1. Open a [private security advisory](https://github.com/Twarga/Tplayer/security/advisories/new) on GitHub. This is the preferred channel.
2. If you cannot use the GitHub advisory flow, contact [@Twarga](https://github.com/Twarga) directly through a private channel.

When reporting, please include:

- A clear description of the issue and its impact
- Steps or a minimal proof-of-concept to reproduce it
- The version of Tplayer and the host OS
- Any suggested mitigation, if you have one

## What to expect

- Acknowledgement within **7 days** of the initial report.
- A triage decision and rough timeline within **14 days**.
- Credit in the release notes of the fix, unless you would prefer to remain anonymous.

## Scope

Tplayer is a local-first desktop application. Security-relevant areas include:

- Electron IPC boundaries between the renderer, preload, and main process
- Handling of user-supplied audio files and folder paths
- YouTube import pipeline (`yt-dlp`, FFmpeg subprocess handling)
- Last.fm API key storage and scrobble requests
- Update/install flows (AppImage, NSIS installer)

Bugs in upstream dependencies (Electron, Chromium, yt-dlp, FFmpeg) should be reported to those projects. If a specific version of Tplayer is affected, we will track and ship a fix once the upstream patch lands.

Thank you for helping keep Tplayer and its users safe.
