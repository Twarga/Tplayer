# Tplayer UI Audit — Critical Issues Found

## Summary
The app launches but shows a broken/minimal UI because **CSS design system is completely missing** and **IPC handlers don't query the database**. The result is a blank-ish screen with unstyled elements.

---

## 🔴 Critical Issues (Break UI / Functionality)

### 1. CSS Design System Completely Missing
**File:** `src/renderer/globals.css` (3 lines), `tailwind.config.ts` (minimal)

**Problem:** All components use Tailwind classes like `bg-surface-1`, `text-primary`, `text-secondary`, `text-tertiary`, `bg-accent`, `border-border-subtle`, `bg-sidebar-bg`, `bg-player-bar-bg`, `bg-progress-bg`, etc. 

**But NONE of these are defined anywhere.**

- `globals.css` only has `@tailwind` directives — no CSS custom properties
- `tailwind.config.ts` only defines `background` and `foreground` as HSL values — no surface colors, no accent, no text colors
- Components reference 20+ undefined utility classes

**Result:** Most styling falls back to browser defaults or transparent/invisible. The screen looks blank or broken.

**Fix:** Add full CSS custom properties to `globals.css` and extend `tailwind.config.ts` with all design tokens from `designplan.md`.

---

### 2. IPC Handlers Are No-Ops
**File:** `src/main/ipc-registry.ts`

**Problem:** All 40+ IPC handlers return hardcoded empty data:
- `library:get-tracks` → returns `[]` (never queries DB)
- `playlist:list` → returns `[]` (never queries DB)
- `settings:get-all` → returns `{}` (never queries DB)
- `library:scan` → returns `{ added: 0, updated: 0, total: 0 }` (never calls scanner)
- etc.

**Result:** UI always shows "No music found", "No playlists", empty settings. The app appears to do nothing.

**Fix:** Wire each handler to real functions from `database.ts`, `library-scanner.ts`, `audio-engine.ts`, etc.

---

### 3. Database Has No Query Functions
**File:** `src/main/database.ts`

**Problem:** The database file creates tables and has `getSetting`/`setSetting` helpers, but has NO functions to:
- Get all tracks
- Get playlists
- Get queue
- Search tracks
- Get download history

These queries must exist for the IPC handlers to call them.

**Fix:** Add query functions: `getAllTracks()`, `getPlaylists()`, `getPlaylistTracks()`, `searchTracks()`, etc.

---

### 4. Library Store Missing `viewMode` Initial State
**File:** `src/renderer/stores/libraryStore.ts`

**Problem:** The `LibraryStore` interface requires `viewMode: 'list' | 'grid'` but the store's initial state doesn't include it. TypeScript allows it but it's a logic bug.

**Fix:** Add `viewMode: 'list'` to initial state.

---

### 5. ThemeProvider Fails Silently on Missing Settings
**File:** `src/renderer/components/ThemeProvider.tsx`

**Problem:** On first launch, `api.settings.get('theme')` returns `null` (because settings table has defaults but the handler returns `null` for unknown keys). The component does `document.documentElement.classList.toggle('dark', val === 'dark')` but `val` is `null`, so `dark` class is never added.

**Result:** Dark mode classes (`dark:bg-surface-1`, etc.) don't apply because `<html>` has no `dark` class.

**Fix:** Default to `'dark'` if setting is null. Also add `dark` class to `index.html` by default.

---

### 6. `index.html` Missing Dark Class
**File:** `src/renderer/index.html`

**Problem:** `<html>` tag has no `dark` class. Tailwind's `darkMode: 'class'` strategy requires the `dark` class on a parent element for dark mode utilities to work.

**Fix:** Add `class="dark"` to `<html>` tag.

---

### 7. Preload API Not Type-Safe for Invoke Args
**File:** `src/preload/index.ts`

**Problem:** The preload script passes args positionally (`ipcRenderer.invoke('library:get-tracks', opts)`), but the main process handlers accept positional args. However, some handlers in `ipc-registry.ts` were stripped of their params and now accept nothing. This means the preload sends arguments that the main handler ignores.

**Fix:** Restore handler parameters or change preload to not send unnecessary args.

---

## 🟡 Medium Issues (Degraded UX)

### 8. No Error Handling in Stores
**Files:** All store files

**Problem:** Store methods like `loadTracks()` call IPC without try/catch. If the main process throws, the error is uncaught and the UI stays in `isLoading: true` forever.

**Fix:** Wrap IPC calls in try/catch and set error states.

---

### 9. Audio Engine Doesn't Send Real PCM
**File:** `src/main/audio-engine.ts`

**Problem:** `playTrack()` decodes audio and sends `player:load` with PCM data, but the renderer has no Web Audio API playback code yet. The `player:load` event is listened to but doesn't do anything with the data.

**Fix:** Add Web Audio API playback in renderer (AudioContext, AudioBufferSourceNode, etc.).

---

### 10. MiniPlayerBar References Unused Vars
**File:** `src/renderer/components/layout/MiniPlayerBar.tsx`

**Problem:** Destructures `currentTime` and `duration` from store but never uses them. Destructures `formatDuration` import but never uses it.

**Fix:** Remove unused destructuring.

---

## 🟢 Minor Issues (Polish)

### 11. Missing Lucide `Youtube` Icon
Already fixed — using inline SVG instead.

### 12. `useDrag.tsx` in `lib/` Instead of `hooks/`
File organization inconsistency.

---

## Fix Priority Order

1. **Add CSS custom properties** to `globals.css` — this alone will make the UI look like the design
2. **Add dark class to `index.html`** — enables Tailwind dark mode
3. **Add DB query functions** to `database.ts` — enables data retrieval
4. **Wire IPC handlers** to real DB/scanner functions — makes the app functional
5. **Fix ThemeProvider** default dark mode — ensures correct theme on first launch
6. **Add error handling** to stores — prevents infinite loading states
7. **Fix store interfaces** — add missing `viewMode` etc.
8. **Add Web Audio playback** — actually hear music

---

## Root Cause

The fundamental issue is that the project was built task-by-task following the implementation plan, but the plan focused on creating files with correct structure rather than making them work together. The result is:
- **Skeleton files exist** but don't do anything
- **Design tokens are documented** in `designplan.md` but never implemented in CSS
- **Database schema exists** but no queries are written
- **IPC channels are defined** but handlers are empty stubs

To make the app functional, the glue code between layers needs to be written.
