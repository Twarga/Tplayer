# Tplayer Remake Plan

## Goal

Remake Tplayer into a reliable desktop music player that can replace Spotify for daily personal use.

The remake should preserve the current design direction and overall identity, but push it much further in quality, polish, animation feel, and product cohesion.

This remake keeps these features inside MVP:

- Local library scan and playback
- Queue, seek, volume, repeat, shuffle
- YouTube search and audio download
- Download history
- Equalizer
- MPRIS
- Last.fm scrobbling
- Strong desktop UI

This remake does **not** try to ship every advanced surface in MVP:

- Fancy dashboard/home sections
- Deep recommendation-style discovery
- Large animation-heavy feature work
- Complex playlist intelligence
- Nonessential visual extras before core reliability

## Core Principles

1. One shared type system across main, preload, and renderer.
2. One IPC contract source of truth.
3. Playback reliability before feature expansion.
4. Every feature phase must end in a working state.
5. No placeholder wiring that pretends a feature exists.
6. The current visual direction is preserved, but refined heavily rather than replaced.
7. UX quality is a product requirement, not a final cosmetic pass.
8. Motion should feel deliberate and premium, never noisy or random.
9. UI polish happens on top of working behavior, not instead of it.

## Delivery Strategy

The remake is split into small tasks named `R1`, `R2`, `R3`, and so on.

Each task has:

- Scope
- Files or systems affected
- Dependencies
- Acceptance criteria

## Design Direction Rules

The remake should keep the spirit of the existing design:

- three-column desktop music-player layout
- warm dark palette and current visual mood
- album-art-first surfaces
- Spotify-like usability, but not a Spotify copy
- compact control density with a premium feel

The remake should improve these areas substantially:

- typography hierarchy and consistency
- spacing rhythm and visual balance
- stronger card, row, panel, and player surface design
- stronger library-first workflow
- better empty, loading, and error states
- better hover, press, transition, and reveal behavior
- more coherent icon sizing and control alignment
- stronger visual hierarchy in the player and library
- better perceived smoothness during navigation and playback interactions
- clearer distinction between compact playback controls and detailed now-playing surfaces
- less wasted UI space and fewer low-value decorative sections

The remake should avoid:

- changing the whole product identity for the sake of novelty
- generic template-looking layouts
- too many effects competing at once
- flashy animation that slows down daily use
- visual inconsistency between sidebar, library, queue, YouTube, and settings
- dashboard sections that look impressive but do not help the user listen faster
- controls or surfaces that suggest functionality without delivering meaningful value

## UX Quality Bar

Every feature task should be judged by both technical and UX quality.

A task is not done if it only works technically but still feels rough in daily use.

Minimum UX standards:

- primary actions are obvious
- playback interactions feel immediate
- state changes are legible
- loading never feels like a broken screen
- empty states feel intentional
- error states help recovery
- surfaces feel visually related
- the app feels calm, premium, and confident
- the user can understand the primary listening flow immediately
- the app rewards daily repeated use rather than occasional exploration

## Current UX Problems To Fix In The Remake

These are explicit problems the remake should solve:

- The current home/dashboard style takes space without being the strongest starting point for a local music player.
- Library, mini player, and now-playing surfaces overlap in responsibility and need clearer roles.
- Some controls and top-level surfaces look polished but do not provide enough real value.
- The app currently spends too much attention on decorative framing and not enough on listening workflow.
- The library surface is closer to the right product direction than the home surface and should become the primary experience.
- Motion and hover behavior should support clarity and tactility, not compensate for weak information hierarchy.

## Product UX Direction

The remake should follow this user-first direction:

- Library-first product, not dashboard-first product
- Fast start to playback
- Strong queue visibility and control
- Clear now-playing detail area
- Compact but premium control density
- Minimal wasted space
- Decorative elements only when they improve comprehension, feedback, or delight

## What To Preserve

- warm dark mood
- three-column desktop structure
- album-art emphasis
- premium desktop-player feel
- strong playback presence

## What To Reduce Or Remove

- weak dashboard sections that imitate streaming apps without offering equivalent value
- top-bar or shell elements that do not unlock real workflow value
- duplicate playback emphasis across too many surfaces
- UI flourishes that add motion but not clarity
- visual weight on areas that users rarely need

## What To Strengthen

- library as the main working surface
- track row quality and readability
- playback clarity
- queue usability
- search utility
- settings usability
- micro-interactions during real music use

## Phase 0A: Preserve And Refine The Existing Design Language

### R1A. Define the polished visual target from the current design
Scope:
- Capture the existing design language that should stay.
- Document where the current UI already has the right direction and where it feels unfinished.
- Explicitly define what "same design, major polishing" means for Tplayer.
- Record which current surfaces feel high-value and which ones feel decorative or low-value from a user perspective.

Files or systems:
- `remake.md`
- current renderer layout and styling review

Dependencies:
- None

Acceptance criteria:
- The remake has a written visual target that preserves the current identity.
- We know what is being refined versus what is being replaced.
- We know which current UI choices should be simplified or removed.

R1A status:
- Completed as a written direction baseline for the remake.

R1A current UI assessment:

What already has the right direction:

- The three-column app shell is a good foundation for a desktop music player.
- The warm dark palette gives the app a stronger personality than a generic neutral dark theme.
- Album-art-first presentation is the right emotional direction for a personal music player.
- The library view is closer to the right product shape than the dashboard-style home screen.
- The mini player plus detail panel model can work if each surface gets a much clearer role.

What currently feels unfinished or weak:

- The app shell uses a lot of visual structure without enough workflow payoff.
- The home screen feels borrowed from streaming apps rather than tailored for a local-first player.
- The top bar includes low-value presence elements that look polished but do not improve the user's main tasks.
- Playback controls are visually spread across multiple areas without a strong hierarchy of importance.
- Some motion and hover styling feel added for surface appeal rather than interaction clarity.
- The library is usable, but it still needs stronger density, hierarchy, and active-state polish.

What should be preserved from the current design:

- three-column layout
- warm dark visual mood
- amber accent family as the primary personality
- large album art in the now-playing experience
- compact player controls with a premium desktop feel
- clean iconography and restrained chrome

What should be refined heavily:

- typography scale and consistency
- spacing rhythm between sections and controls
- card and panel hierarchy
- row density and readability in the library
- active, hover, selected, and playing states
- player control emphasis and control grouping
- empty, loading, and error states
- clarity of primary versus secondary surfaces

What should be simplified or removed:

- homepage sections that exist mostly to imitate Spotify-like browsing
- shell elements with weak utility, especially if they consume visual focus
- duplicate playback emphasis across the mini player and the now-playing panel
- decorative hover and reveal behavior that does not improve comprehension
- visual weight assigned to low-priority controls and sections

What "same design, major polishing" means for Tplayer:

- Keep the same overall mood, shell, and visual identity.
- Do not replace the app with a totally different aesthetic direction.
- Make the layout more purposeful and less decorative.
- Make the library feel like the natural center of the product.
- Make the player surfaces feel more expensive, coherent, and legible.
- Make motion more deliberate and premium, with less random flourish.
- Remove anything that looks good in a screenshot but does not help during daily listening.

Visual target after remake:

- A local music player that still feels like Tplayer at a glance.
- A calmer and more premium shell with stronger information hierarchy.
- A library-first experience with excellent playback presence.
- A UI that feels more mature, focused, and intentional than the current version.

### R1B. Define the motion and interaction language
Scope:
- Define how transitions, hover states, presses, queue updates, panel toggles, and player state changes should feel.
- Set motion principles for speed, easing, and restraint.

Files or systems:
- `remake.md`
- animation and interaction direction

Dependencies:
- `R1A`

Acceptance criteria:
- Motion has a clear product role.
- Future UI work can apply consistent animation rules instead of ad hoc effects.

### R1C. Define the component polish system
Scope:
- Define the target quality bar for buttons, inputs, sliders, player controls, rows, cards, side panels, dialogs, and badges.
- Establish what “premium but compact” means in this app.
- Define how compact control density can stay elegant and readable in heavy daily use.

Files or systems:
- `remake.md`
- component design review

Dependencies:
- `R1A`

Acceptance criteria:
- Core components have a consistent polish direction before implementation work expands.

## Phase 0B: Stabilize The Base

### R1. Create canonical remake architecture map
Scope:
- Define the target module boundaries for shared types, main process services, preload API, renderer stores, and UI routes.
- Document which current files are kept, rewritten, or removed from active usage.

Files or systems:
- `remake.md`
- codebase structure review

Dependencies:
- `R1A`
- `R1B`
- `R1C`

Acceptance criteria:
- The remake plan is explicit about ownership of each major subsystem.
- We have a clear target structure before changing behavior.

### R2. Create a single shared types/contracts module
Scope:
- Introduce one shared module for `Track`, `QueueEntry`, `PlaybackState`, `Download`, `Settings`, IPC payloads, and event payloads.
- Remove duplicated or conflicting type definitions from renderer-only files where possible.

Files or systems:
- new shared types location
- preload typing
- renderer stores
- main process service typing

Dependencies:
- `R1`

Acceptance criteria:
- Main, preload, and renderer all import the same core shapes.
- Track and playback payloads are no longer redefined differently in multiple files.

### R3. Rebuild the preload API contract
Scope:
- Make the preload bridge match the shared contracts exactly.
- Remove missing, stale, or misnamed methods/events.

Files or systems:
- `src/preload/index.ts`
- preload type declarations

Dependencies:
- `R2`

Acceptance criteria:
- Every method exposed in preload exists in main.
- Every event name and payload shape is defined once and used consistently.

### R4. Rebuild IPC registration around real handlers only
Scope:
- Align all `ipcMain.handle` and event senders with the shared contract.
- Remove dead channels and broken registrations.

Files or systems:
- `src/main/ipc-registry.ts`
- main process feature modules

Dependencies:
- `R3`

Acceptance criteria:
- No handler references missing functions.
- No renderer call depends on a channel that is absent or mismatched.

### R5. Restore a clean compile baseline
Scope:
- Fix TypeScript errors caused by drift, dead fields, stale imports, and missing methods.
- Remove unused code that blocks typechecking when it is not part of the active remake path.

Files or systems:
- whole app compile surface

Dependencies:
- `R4`

Acceptance criteria:
- `npm run typecheck` passes.
- The app can evolve from a stable compile baseline.

## Phase 1: Local Playback Foundation

### R6. Normalize database access layer
Scope:
- Add explicit query helpers for tracks, playlists, downloads, and settings.
- Stop scattering SQL assumptions across unrelated files where practical.

Files or systems:
- `src/main/database.ts`

Dependencies:
- `R5`

Acceptance criteria:
- Main process uses consistent DB access helpers for core reads and writes.
- Library, settings, queue, and downloads have reliable query paths.

### R7. Rebuild library scanner around safe updates
Scope:
- Ensure scan preserves user data such as favorites, ratings, play count, and last played.
- Make folder scan, single-file scan, and removal flow consistent.

Files or systems:
- `src/main/library-scanner.ts`
- `src/main/file-watcher.ts`

Dependencies:
- `R6`

Acceptance criteria:
- Rescans do not wipe user state.
- Added, changed, and removed files update the DB and UI correctly.

### R8. Make settings and folder management real
Scope:
- Ensure music folders, theme, accent, tool paths, EQ state, Last.fm state, and volume persist correctly.
- Ensure folder add/remove/open dialog flows are real and typed.

Files or systems:
- settings IPC
- settings store
- database-backed settings helpers

Dependencies:
- `R6`

Acceptance criteria:
- Settings round-trip correctly through UI, preload, and DB.
- Music folder selection drives scanning and watcher behavior.

### R9. Rebuild the playback engine around file URL streaming
Scope:
- Keep playback file-based rather than shipping large PCM data through IPC.
- Main process owns playback state and metadata.
- Renderer owns actual media playback and Web Audio graph.

Files or systems:
- `src/main/audio-engine.ts`
- `src/main/index.ts`
- custom protocols
- playback IPC events

Dependencies:
- `R5`

Acceptance criteria:
- Playing a local track works reliably.
- Main and renderer stay in sync on play, pause, seek, and track changes.

### R10. Rebuild renderer audio hook and store synchronization
Scope:
- Make the audio hook the single playback runtime in renderer.
- Align player store updates with actual audio events.
- Remove duplicate or contradictory playback listeners.

Files or systems:
- `src/renderer/hooks/useAudioPlayer.ts`
- `src/renderer/stores/playerStore.ts`

Dependencies:
- `R9`

Acceptance criteria:
- Seeking does not skip tracks.
- Ended events do not double-fire.
- Current time and duration stay accurate in the UI.

### R11. Rebuild queue logic as a first-class subsystem
Scope:
- Make queue set/add/add-next/remove/reorder/clear deterministic.
- Preserve queue order exactly across main and renderer.
- Ensure previous/next/repeat/shuffle are correct.

Files or systems:
- `src/main/audio-engine.ts`
- queue IPC
- `src/renderer/stores/queueStore.ts`

Dependencies:
- `R9`
- `R10`

Acceptance criteria:
- Queue order shown in UI matches playback order.
- Repeat and shuffle behave consistently.
- Previous track behavior is predictable.

### R12. Deliver the real player MVP shell
Scope:
- Make library list, now playing area, mini player, and queue view work against real data.
- Trim or disable surfaces that still depend on unimplemented behavior.
- Apply the preserved design direction at a clean MVP quality level instead of leaving the shell visually temporary.
- Shift the product center of gravity toward the library and real listening flow.

Files or systems:
- `src/renderer/App.tsx`
- layout components
- library components
- queue components
- player components

Dependencies:
- `R7`
- `R10`
- `R11`

Acceptance criteria:
- User can scan music, browse tracks, play them, control them, and inspect queue without broken views.
- The MVP shell already feels intentional and aligned with the target identity.
- The app no longer depends on weak dashboard framing to feel complete.

## Phase 1A: Design System And Motion Foundation

### R12A. Rebuild the core design token system for polish
Scope:
- Refine colors, spacing, typography, radius, shadows, overlays, and panel treatments while preserving the current visual identity.
- Remove visual rough edges and inconsistent token usage.

Files or systems:
- `src/renderer/globals.css`
- `tailwind.config.ts`
- shared UI styling patterns

Dependencies:
- `R1A`
- `R1C`
- `R5`

Acceptance criteria:
- Design tokens support a polished implementation of the current look.
- Core surfaces no longer rely on inconsistent one-off styling decisions.

### R12B. Build the motion foundation
Scope:
- Create shared motion patterns for route transitions, panel reveals, hover lift, active-state feedback, progress behavior, and list entrance timing.
- Keep motion subtle and premium.

Files or systems:
- animation utilities
- layout transitions
- player and queue transitions

Dependencies:
- `R1B`
- `R5`

Acceptance criteria:
- Motion feels consistent across the app.
- Animations add quality without hurting responsiveness.

### R12C. Polish the desktop shell before feature sprawl returns
Scope:
- Refine sidebar, top bar, main content framing, now-playing panel, and mini player using the preserved design direction.
- Improve alignment, density, spacing, and surface hierarchy.
- Remove or simplify shell elements that do not help playback, browsing, queue control, or settings access.

Files or systems:
- layout components
- shared UI primitives

Dependencies:
- `R12`
- `R12A`
- `R12B`

Acceptance criteria:
- The shell already feels premium enough to represent the product.
- The app no longer feels like a prototype frame around working features.
- High-value surfaces are visually dominant; low-value surfaces are reduced.

## Phase 2: Equalizer In MVP

### R13. Rebuild the Web Audio graph for EQ safety
Scope:
- Keep one stable audio graph connected during playback.
- Implement gain and EQ band chain without disconnect-induced silence.

Files or systems:
- `src/renderer/hooks/useAudioPlayer.ts`
- audio graph utilities

Dependencies:
- `R10`

Acceptance criteria:
- Turning EQ on or off never kills playback.
- Volume and EQ both work together.

### R14. Implement EQ state, presets, and persistence
Scope:
- Add 10-band EQ controls, presets, enabled state, and DB-backed settings persistence.
- Present EQ as a polished interaction surface, not just sliders on a page.

Files or systems:
- EQ store
- EQ view
- settings persistence

Dependencies:
- `R13`
- `R8`

Acceptance criteria:
- EQ values apply live.
- Presets work.
- EQ state restores after restart.
- EQ controls feel visually integrated with the rest of the player.

## Phase 3: YouTube And Download History In MVP

### R15. Rebuild yt-dlp service contract
Scope:
- Standardize search, download, cancel, progress, completion, and error payloads.
- Validate tool availability and configured path behavior.

Files or systems:
- `src/main/yt-dlp.ts`
- YouTube IPC
- settings for yt-dlp path

Dependencies:
- `R3`
- `R8`

Acceptance criteria:
- Search and download methods have one stable typed contract.
- Missing `yt-dlp` is handled cleanly.

### R16. Implement YouTube search UI against the real backend
Scope:
- Build search query flow, loading state, error state, and result rendering against actual yt-dlp output.
- Keep the YouTube surface aligned with the core app design rather than looking like a utility screen.

Files or systems:
- YouTube store
- YouTube view

Dependencies:
- `R15`

Acceptance criteria:
- Searching returns usable results with correct metadata.
- UI does not assume fake or incompatible shapes.
- The screen feels cohesive with the rest of the app.

### R17. Implement download runtime and progress handling
Scope:
- Start downloads, receive progress, allow cancel, and finalize download completion into the library.

Files or systems:
- `src/main/yt-dlp.ts`
- YouTube store
- library refresh integration

Dependencies:
- `R15`
- `R16`
- `R7`

Acceptance criteria:
- Download progress updates in real time.
- Cancel works.
- Finished downloads appear in the music library.

### R18. Rebuild download history as a real persisted feature
Scope:
- Store lifecycle states in DB and render the history view from DB-backed data.
- Make download status, progress, and completion states visually clear and satisfying to scan.

Files or systems:
- downloads table usage
- download history view
- related store logic

Dependencies:
- `R17`

Acceptance criteria:
- History survives app restart.
- Pending, done, failed, and cancelled states are represented correctly.
- Progress and status presentation feel polished, not merely functional.

## Phase 4: MPRIS In MVP

### R19. Normalize player state export for MPRIS
Scope:
- Expose current metadata, playback state, position, and controls from one reliable source.

Files or systems:
- `src/main/audio-engine.ts`
- `src/main/mpris.ts`

Dependencies:
- `R11`

Acceptance criteria:
- MPRIS reads state from a stable playback model rather than ad hoc values.

### R20. Implement full MPRIS control loop
Scope:
- Wire play, pause, next, previous, metadata, and position updates to Linux media controls.

Files or systems:
- `src/main/mpris.ts`

Dependencies:
- `R19`

Acceptance criteria:
- `playerctl` works correctly for core playback actions.
- Track metadata changes update in the desktop environment.

## Phase 5: Last.fm In MVP

### R21. Rebuild Last.fm auth and session storage
Scope:
- Implement proper auth/session flow instead of partial key storage.
- Persist session state safely in settings.

Files or systems:
- `src/main/lastfm.ts`
- settings UI for Last.fm

Dependencies:
- `R8`

Acceptance criteria:
- User can authenticate and reconnect intentionally.
- Session state is usable after restart.

### R22. Implement now-playing and scrobble lifecycle
Scope:
- Send now-playing updates on track start.
- Scrobble only when threshold rules are met.
- Prevent duplicate scrobbles.

Files or systems:
- `src/main/lastfm.ts`
- playback integration

Dependencies:
- `R21`
- `R10`

Acceptance criteria:
- Now-playing and scrobble behavior match expected Last.fm semantics.

### R23. Implement retry queue and failure recovery
Scope:
- Queue failed submissions and retry them on recoverable errors.

Files or systems:
- `src/main/lastfm.ts`

Dependencies:
- `R22`

Acceptance criteria:
- Temporary failures do not silently lose scrobbles.
- Retry behavior is bounded and observable.

## Phase 6: UI Remake For Daily Use

### R24. Simplify app routing and active views
Scope:
- Reduce the shell to views that actually work in MVP.
- Remove or defer dead paths and misleading navigation.
- Reframe the app around the listening workflow instead of a generic homepage workflow.

Files or systems:
- `src/renderer/App.tsx`
- sidebar/top-level navigation

Dependencies:
- `R12`
- `R18`

Acceptance criteria:
- Every visible route is functional.
- Navigation matches the actual feature set.
- The default flow feels obvious for a local music player user.

### R25. Redesign the main desktop shell
Scope:
- Rework sidebar, content area, now-playing panel, and mini player into a stronger visual system while preserving the current identity.
- Major polish only, not a disconnected redesign.
- Improve animation feel, perceived depth, and interaction quality.
- Clarify the role of each playback surface so mini player, library, queue, and now-playing do not compete.

Files or systems:
- layout components
- core player surfaces
- CSS variables and spacing system

Dependencies:
- `R24`

Acceptance criteria:
- The UI looks intentional and cohesive.
- Core actions are obvious and fast.
- The app feels like a polished product, not a styled prototype.
- Users can tell immediately where to browse, where to control playback, and where to inspect details.

### R26. Polish library browsing UX
Scope:
- Improve track list density, album art handling, search/sort behavior, empty states, and loading states.
- Refine row hover states, selection states, context actions, and transitions for daily heavy use.
- Make the library feel like the main working surface of the app.

Files or systems:
- library views
- shared UI components

Dependencies:
- `R25`

Acceptance criteria:
- Large local libraries are usable and visually clean.
- Empty and loading states do not feel broken.
- Browsing the library feels smooth and premium.
- The library is strong enough to function as the practical home of the product.

### R27. Polish YouTube, settings, and downloads UX
Scope:
- Make tool availability, errors, progress, settings forms, and history screens feel complete.
- Make these secondary screens match the same quality bar as playback and library surfaces.

Files or systems:
- YouTube view
- settings view
- downloads view

Dependencies:
- `R18`
- `R21`
- `R25`

Acceptance criteria:
- These non-library surfaces feel first-class rather than bolted on.

### R27A. Polish playback micro-interactions
Scope:
- Refine seek behavior, control feedback, progress dragging, volume interaction, queue transitions, and now-playing metadata changes.
- Focus on the small moments that make the player feel expensive to use.
- Reduce awkward duplication between playback surfaces by making each interaction zone feel intentionally scoped.

Files or systems:
- player controls
- seek bar
- volume control
- queue interactions
- now-playing panel

Dependencies:
- `R25`
- `R26`

Acceptance criteria:
- Core playback interactions feel smooth, immediate, and satisfying.
- The player has a strong tactile quality without becoming flashy.

### R27B. Final visual consistency pass
Scope:
- Audit spacing, colors, font sizes, radii, shadows, hover states, panel borders, and icon alignment across all MVP screens.

Files or systems:
- full renderer UI surface

Dependencies:
- `R27`
- `R27A`

Acceptance criteria:
- The product feels visually unified.
- No screen looks obviously less polished than the others.

### R28. Final integration pass
Scope:
- Test the app as one system and fix cross-feature regressions between playback, EQ, YouTube, MPRIS, Last.fm, settings, and UI.

Files or systems:
- full app

Dependencies:
- `R14`
- `R18`
- `R20`
- `R23`
- `R27B`

Acceptance criteria:
- All MVP features work together in one install.
- No major subsystem is still relying on fake plumbing.
- The final result meets both functional and polish expectations.

## Execution Order Summary

Recommended order:

1. `R1A` to `R1C`
2. `R1` to `R5`
3. `R6` to `R12`
4. `R12A` to `R12C`
5. `R13` to `R14`
6. `R15` to `R18`
7. `R19` to `R20`
8. `R21` to `R23`
9. `R24` to `R28`

## Definition Of MVP Done

The remake MVP is done when all of the following are true:

- The project typechecks cleanly.
- A user can add music folders and build a local library.
- A user can play local music with queue, seek, shuffle, repeat, and volume.
- EQ works live and persists.
- YouTube search and download work and downloaded songs join the library.
- Download history persists and reflects real states.
- MPRIS works with Linux media controls.
- Last.fm auth, now playing, and scrobbling work reliably.
- The UI feels coherent and polished enough for daily use.
- The visual identity clearly feels like the original Tplayer direction, just much more refined.
- Motion and interaction quality contribute to a strong “wow” feeling without hurting usability.

## Non-Negotiable Rule During Remake

No task is considered complete if it only adds files or UI without producing working behavior.
