# Production Readiness Notes

This document summarizes the public-release preparation from `B1` through `B10`.

## B1 - Branding Direction

Status: complete.

Output:

- `docs/brand.md` defines the Tplayer positioning, voice, palette, screenshot rules, release-copy pattern, and landing-page direction.
- Public copy now avoids "Spotify clone" framing and describes Tplayer as a local-first desktop music player.

Production impact:

- README, release notes, package metadata, and website copy have one shared source of truth.

## B2 - README Remake

Status: complete.

Output:

- README now presents the project publicly with logo, badges, product summary, workflow, features, tech stack, status, docs, development commands, and packaging commands.

Production impact:

- New users can understand the product and developers can run/build it without reading internal planning notes.

## B3 - Repo Hygiene

Status: complete.

Output:

- `.gitignore` excludes generated builds, release artifacts, logs, local notes, scratch media, and editor files.
- `.gitattributes` normalizes text and marks binary assets.
- `CONTRIBUTING.md` and `docs/repository-hygiene.md` document contribution and repository rules.

Production impact:

- Release binaries stay in GitHub Releases, not git history.
- Scratch audio and personal notes are not accidentally committed.

## B4 - App Metadata And Icons

Status: complete.

Output:

- `package.json` includes `productName`, `appId`, `homepage`, repository metadata, author metadata, and release build metadata.
- `build/icon.png` and `build/icon.ico` are available for Linux and Windows packaging.

Production impact:

- Packaged builds use the correct Tplayer name, app id, icon, and homepage.

## B5 - Packaging Setup

Status: complete.

Output:

- `electron-builder` is configured.
- `npm run package:linux` builds a Linux AppImage.
- `npm run package:win` builds the Windows executable on Windows runners.
- `npm run package:dir` creates an unpacked build for quick local packaging checks.

Verified locally:

- `npm run package:linux` produced `release/Tplayer-0.1.0.AppImage`.

Production impact:

- The project can produce installable artifacts instead of only Vite/Electron compiled output.

## B6 - Release Workflow

Status: complete.

Output:

- `.github/workflows/release.yml` builds Linux on `ubuntu-latest`.
- `.github/workflows/release.yml` builds Windows on `windows-latest`.
- Both jobs run `typecheck`, `build`, and packaging.
- A final publish job downloads artifacts and creates a GitHub Release.

Production impact:

- Pushing a `v*.*.*` tag creates release artifacts for users.

## B7 - Manual Release Checklist

Status: complete.

Output:

- `docs/release-checklist.md` covers versioning, changelog, local verification, packaging verification, website checks, tagging, and post-release checks.

Production impact:

- Releases have a repeatable human checklist instead of relying on memory.

## B8 - Landing Page Structure

Status: complete.

Output:

- `site/index.html` defines a public GitHub Pages landing page with hero, interface story, screenshots, workflow, and download CTA.

Production impact:

- Users have a product page before they reach the repository.

## B9 - Landing Page Polish

Status: complete.

Output:

- `site/styles.css` provides a static production stylesheet.
- The landing page uses the dark editorial Tplayer palette, large typography, real screenshots, and direct calls to action.
- Runtime Tailwind CDN was removed.

Production impact:

- The website is static, fast, brand-aligned, and not dependent on Tailwind's browser CDN.

## B10 - Pages Deployment

Status: complete.

Output:

- `.github/workflows/pages.yml` deploys `site/` to GitHub Pages.
- The workflow copies public assets into `site/assets`.
- The asset preparation step uses `rm -rf` so repeated deployments do not fail when the path already exists.

Production impact:

- Pushes touching `site/`, `assets/`, or Pages workflow files can publish the landing page.

## Remaining Pre-Launch Checks

- Confirm the GitHub repository has Pages enabled for GitHub Actions.
- Push a test tag such as `v0.1.0` only when ready to publish.
- Download release artifacts from GitHub after the workflow finishes and launch them manually.
- Replace screenshots if the UI changes before launch.

## Known Production Risks

- `npm audit --omit=dev` currently reports vulnerabilities in transitive production dependencies.
- `music-metadata` can be moved to a newer major version, but that should be handled as a focused compatibility task because the API changed after the current pinned version.
- `dbus-next` pulls vulnerable transitive packages and npm reports no direct fix. If this blocks a public release, replace or isolate the MPRIS integration behind an optional Linux-only module.
- Windows packaging must still be verified on the GitHub Actions `windows-latest` runner or a real Windows machine.
