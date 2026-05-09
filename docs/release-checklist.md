# Release Checklist

Use this checklist for every public Tplayer release. Do not tag a release until the local verification and packaged artifacts are complete.

## 1. Version And Notes

- [ ] Pick the release version using semantic versioning.
- [ ] Update `version` in `package.json`.
- [ ] Add a dated entry to `CHANGELOG.md`.
- [ ] Confirm README status, download links, screenshots, and feature claims are accurate.
- [ ] Confirm `docs/brand.md` language is still aligned with public copy.

## 2. Local Verification

Run the required checks:

```bash
npm ci
npm run typecheck
npm run build
npm run package:linux
npm audit --omit=dev
```

Manual app smoke test:

- [ ] App opens from `npm run dev`.
- [ ] App opens from the generated Linux AppImage.
- [ ] Local library scan completes.
- [ ] Track playback starts, pauses, resumes, and stops correctly.
- [ ] Seek bar can jump forward and backward without snapping to zero.
- [ ] Queue next/previous controls work.
- [ ] Volume control works.
- [ ] Shuffle and repeat state persist.
- [ ] YouTube search returns results when `yt-dlp` is installed.
- [ ] YouTube import writes a file and adds it to the library.
- [ ] Downloads history persists after restart.
- [ ] EQ preset changes affect playback and persist.
- [ ] Last.fm auth, now-playing, and scrobbling work if configured.
- [ ] MPRIS controls respond through the desktop/media keys on Linux.

## 3. Packaging Verification

Linux:

- [ ] `release/Tplayer-<version>.AppImage` exists.
- [ ] AppImage is executable.
- [ ] AppImage launches on a clean Linux user profile.
- [ ] App name and icon display correctly.
- [ ] Generated `latest-linux.yml` exists.
- [ ] Production audit results are reviewed and documented.

Windows:

- [ ] Windows packaging passes in GitHub Actions on `windows-latest`.
- [ ] `.exe` artifact is uploaded to the workflow.
- [ ] Installer or portable executable opens on Windows.
- [ ] App name and icon display correctly.

## 4. Website And Release Assets

- [ ] Landing page deploys successfully through GitHub Pages.
- [ ] Landing page download CTA points to the latest GitHub Release.
- [ ] README links to the website and release page.
- [ ] Screenshots show current UI.
- [ ] Screenshots do not use copyrighted artwork unless permission is clear.

## 5. Tag And Publish

Create and push a signed or normal version tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions should:

- [ ] Build Linux on `ubuntu-latest`.
- [ ] Build Windows on `windows-latest`.
- [ ] Upload AppImage and Windows `.exe`.
- [ ] Create a GitHub Release.

## 6. Post-Release

- [ ] Download the artifacts from the public GitHub Release.
- [ ] Launch the downloaded AppImage.
- [ ] Check the live landing page.
- [ ] Announce known limitations clearly.
- [ ] If the release is broken, delete or mark the release as pre-release and publish a fixed patch version.
