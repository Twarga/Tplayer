# Release Checklist

Before tagging a new release, verify the following:

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with release notes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] AppImage packages cleanly via `npm run package:linux`
- [ ] Windows executable packages cleanly via `npm run package:win`
- [ ] Core playback works locally (play, pause, next, volume)
- [ ] No regression in EQ or Last.fm functionality
- [ ] Screenshots updated in `assets/` and `README.md` if UI changed
- [ ] Rollback notes prepared in case of critical bugs (how to downgrade or what data might be affected)
