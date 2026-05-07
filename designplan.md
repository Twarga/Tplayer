# Tplayer — Design Plan

## Overview

This design plan captures the visual language, layout, colors, typography, spacing, and component-level details from the reference image. Every element is documented for pixel-perfect implementation.

---

## Layout Architecture

The app uses a **three-column persistent layout**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Sidebar │      Main Content Area            │ Now Playing Panel           │
│ 200px   │      flex: 1 (fills remaining)    │ 320px                       │
│         │                                   │                             │
│         │  ┌─ Top Bar (search + actions) ─┐ │  ┌─ Now Playing / Lyrics ─┐ │
│         │  │                               │ │  │                        │ │
│         │  ├─ Greeting ───────────────────┤ │  │  Album Art (large)     │ │
│         │  │                               │ │  │  Track Info            │ │
│         │  ├─ Continue Listening ──────────┤ │  │  Progress Bar          │ │
│         │  │  [Card] [Card] [Card] [Card]  │ │  │  Controls              │ │
│         │  │                               │ │  │  Quality Badges        │ │
│         │  ├─ Recently Added ──────────────┤ │  │  Queue List            │ │
│         │  │  [Thumb] [Thumb] [Thumb] ...  │ │  │                        │ │
│         │  │                               │ │  └────────────────────────┘ │
│         │  ├─ YouTube Imports ─────────────┤ │                             │
│         │  │  Track row with thumb ...     │ │                             │
│         │  │                               │ │                             │
│         │  └───────────────────────────────┘ │                             │
│         │                                   │                             │
├─────────┴───────────────────────────────────┴─────────────────────────────┤
│ Mini Player Bar (compact, full width, ~64px)                               │
│ Track info | Controls | Visualizer | Volume | Extras                        │
└────────────────────────────────────────────────────────────────────────────┘
```

### Column Specifications

| Column | Width | Min-Width | Max-Width | Behavior |
|--------|-------|-----------|-----------|----------|
| Sidebar | 200px | 200px | 220px | Fixed, non-resizable |
| Main Content | flex: 1 | 400px | none | Fills remaining space, scrollable |
| Now Playing Panel | 320px | 280px | 380px | Fixed, toggleable (can be collapsed to 0) |

### Z-Index Hierarchy
1. `z-0`: Background layers
2. `z-10`: Content, scrollable areas
3. `z-20`: Sidebar, top bar
4. `z-30`: Tooltips, dropdowns, context menus
5. `z-40`: Modals, dialogs
6. `z-50`: Toast notifications

---

## Color System

### Dark Theme (Primary)

The image uses a **warm, charcoal dark palette** — not pure black. It has subtle brown/gray undertones.

```
--background:       #0D0D0D       (Main background, very dark warm charcoal)
--surface-1:        #121212       (Cards, elevated surfaces, sidebar bg)
--surface-2:        #1A1A1A       (Hover states, input backgrounds)
--surface-3:        #242424       (Active states, selected items)
--surface-4:        #2A2A2A       (Borders, dividers subtle)
--surface-5:        #333333       (Stronger borders)

--text-primary:     #FFFFFF       (Headings, primary text)
--text-secondary:   #B3B3B3       (Body text, descriptions)
--text-tertiary:    #6A6A6A       (Timestamps, meta text, placeholders)
--text-muted:       #4A4A4A       (Disabled, very subtle text)

--accent:           #E8A87C       (Warm amber/copper — primary accent, not green!)
--accent-hover:     #F0C4A0       (Lighter accent for hover)
--accent-muted:     #E8A87C33     (Accent at 20% opacity for backgrounds)

--border-subtle:    rgba(255,255,255,0.06)
--border-default:   rgba(255,255,255,0.1)
--border-strong:    rgba(255,255,255,0.15)

--sidebar-bg:       #0F0F0F       (Slightly darker than main bg)
--player-bar-bg:    #0D0D0D       (Same as background, with top border)
--input-bg:         #1A1A1A
--input-border:     #333333
--input-focus:      #E8A87C

--success:          #1DB954       (Green for success states, Spotify green)
--error:            #E22134       (Red for errors)
--warning:          #F59E0B       (Amber for warnings)
--info:             #3B82F6       (Blue for info)

--progress-bg:      #4A4A4A
--progress-fill:    #E8A87C
--progress-hover:   #F0C4A0

--scrollbar-track:  transparent
--scrollbar-thumb:  #4A4A4A
--scrollbar-thumb-hover: #6A6A6A
```

### Light Theme (Secondary)

```
--background:       #F5F5F5
--surface-1:        #FFFFFF
--surface-2:        #F0F0F0
--surface-3:        #E8E8E8
--text-primary:     #121212
--text-secondary:   #666666
--text-tertiary:    #999999
--accent:           #E8A87C
--border-subtle:    rgba(0,0,0,0.06)
--border-default:   rgba(0,0,0,0.1)
--sidebar-bg:       #FAFAFA
--player-bar-bg:    #FFFFFF
```

### Gradients
- **Card hover**: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)` overlay on album art
- **Now Playing panel bg**: subtle radial gradient from center: `radial-gradient(circle at 50% 30%, rgba(232,168,124,0.05) 0%, transparent 60%)`
- **Player bar**: `linear-gradient(180deg, transparent 0%, rgba(13,13,13,0.95) 100%)` for fade-in effect

---

## Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 32px | 700 | 1.1 | -0.02em | Greeting ("Good evening, Younes") |
| H1 | 24px | 700 | 1.2 | -0.01em | Section titles |
| H2 | 20px | 600 | 1.3 | 0 | Card titles |
| H3 | 16px | 600 | 1.4 | 0 | Subsection titles |
| Body | 14px | 400 | 1.5 | 0 | Body text, descriptions |
| Body Small | 13px | 400 | 1.5 | 0 | Track rows, metadata |
| Caption | 12px | 500 | 1.4 | 0.01em | Timestamps, labels, badges |
| Caption Small | 11px | 500 | 1.3 | 0.02em | Section labels, status text |

### Section Labels (Sidebar)
```css
font-size: 11px;
font-weight: 600;
letter-spacing: 0.05em;
text-transform: uppercase;
color: var(--text-tertiary);
padding: 16px 16px 8px;
```

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight gaps, icon padding |
| space-2 | 8px | Small gaps |
| space-3 | 12px | Internal padding |
| space-4 | 16px | Standard padding, card gaps |
| space-5 | 20px | Section spacing |
| space-6 | 24px | Large gaps |
| space-8 | 32px | Section separators |
| space-10 | 40px | Major sections |
| space-12 | 48px | Page padding |

---

## Shadows & Effects

### Elevation System
```css
/* Card shadow */
box-shadow: 0 2px 8px rgba(0,0,0,0.3);

/* Dropdown/menu shadow */
box-shadow: 0 8px 24px rgba(0,0,0,0.5);

/* Modal shadow */
box-shadow: 0 16px 48px rgba(0,0,0,0.6);

/* Hover lift */
transform: translateY(-2px);
box-shadow: 0 8px 24px rgba(0,0,0,0.4);
```

### Blurs
```css
/* Glassmorphism for overlays */
backdrop-filter: blur(12px);
background: rgba(18, 18, 18, 0.8);

/* Player bar glass */
backdrop-filter: blur(8px);
background: rgba(13, 13, 13, 0.85);
```

---

## Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 4px | Buttons, badges, small elements |
| radius-md | 6px | Inputs, small cards |
| radius-lg | 8px | Cards, panels |
| radius-xl | 12px | Large cards, modals |
| radius-2xl | 16px | Big containers |
| radius-full | 9999px | Pills, avatars, circular buttons |

---

## Component Specifications

### 1. Sidebar

```
Width: 200px
Background: var(--sidebar-bg) #0F0F0F
Border-right: 1px solid var(--border-subtle)
Padding: 16px 0
```

**Structure (top to bottom):**

#### Logo Section
```
Padding: 0 16px 20px
Display: flex, align-items: center, gap: 8px

Logo icon: 32px circle, background: var(--accent), text "T" in white, font-weight 700
App name: "Tplayer", font-size: 18px, font-weight: 700, color: var(--text-primary)
Chevron down: 16px, color: var(--text-tertiary), clickable for workspace switcher
```

#### Navigation Links (Home, Library)
```
Padding: 0 8px
Each link:
  Height: 36px
  Padding: 0 12px
  Border-radius: 6px
  Display: flex, align-items: center, gap: 12px
  Font-size: 14px, font-weight: 500
  Color: var(--text-secondary)
  Icon: 20px, color: var(--text-secondary)

Active state:
  Background: var(--surface-3)
  Color: var(--text-primary)
  Icon color: var(--text-primary)

Hover state:
  Background: var(--surface-2)
  Color: var(--text-primary)

Active + Hover: background var(--surface-3)
```

#### Section Labels
```
Padding: 16px 16px 8px
Font: 11px, weight 600, uppercase, letter-spacing 0.05em
Color: var(--text-tertiary)

Sections: YOUR MUSIC, IMPORT & DISCOVER, PLAYLISTS
```

#### Music Section Links (Songs, Albums, Artists, Playlists, Folders)
```
Same style as nav links
Additional: small count badge on right (optional, for Songs)
Icon + text layout

Playlists item: has sub-item count or chevron
```

#### Import Section Links (YouTube Import, Discover)
```
YouTube Import icon: YouTube red (#FF0000) or custom icon
Discover icon: compass/search icon
```

#### Playlists Section
```
Header row: "PLAYLISTS" label + "+" button on right
"+" button: 24px, rounded, hover:bg-surface-2

Playlist items:
  Same link style as above
  Small icon: music note or custom playlist icon
  Text: playlist name
  Hover: shows play count or duration

Playlists shown:
  Lofi Beats
  Gym Motivation
  Night Drive
  Favs (with heart icon, red)
  Classical Collection
```

#### Bottom Actions
```
Padding: 16px
Position: sticky bottom
Items: Settings (gear icon), Accessibility (eye icon)
Same link style
```

---

### 2. Top Bar

```
Height: 64px
Padding: 0 24px
Display: flex, align-items: center, justify-content: space-between
Background: transparent (scrolls with content, no sticky needed since main area is scrollable)
```

#### Search Input
```
Width: 400px (or max-width: 500px, flex: 1)
Height: 40px
Background: var(--input-bg) #1A1A1A
Border: 1px solid var(--input-border)
Border-radius: 8px
Padding: 0 16px 0 40px (space for search icon)

Search icon: 18px, color var(--text-tertiary), position absolute left 12px
Placeholder: "Search songs, artists, albums...", color var(--text-tertiary)

Focus state:
  Border-color: var(--accent)
  Box-shadow: 0 0 0 3px rgba(232,168,124,0.15)

Right side of search: "Ctrl K" keyboard shortcut hint
  Font: 11px, color var(--text-muted)
  Background: var(--surface-2)
  Padding: 2px 6px
  Border-radius: 4px
```

#### Right Actions
```
Display: flex, gap: 12px, align-items: center

Icons (right to left):
  - Activity/Charts icon (bar chart)
  - Notifications bell icon (with dot indicator if unread)
  - Profile: Avatar (32px circle) + "Younes" + chevron down

Profile dropdown trigger:
  Display: flex, gap: 8px, align-items: center
  Padding: 4px 8px
  Border-radius: 6px
  Hover: bg-surface-2
```

---

### 3. Main Content Area

Scrollable, padding: 24px

#### Greeting Section
```
Margin-bottom: 32px

Title: "Good evening, Younes"
  Font: Display (32px, weight 700, color: text-primary)
  
Subtitle: "Enjoy your music"
  Font: Body (14px, weight 400, color: text-secondary)
  Margin-top: 4px
```

#### Section Headers
```
Display: flex, justify-content: space-between, align-items: center
Margin-bottom: 16px

Title: H2 (20px, weight 600)
"See all" or arrow button on right:
  Font: Caption (12px, weight 500, color: text-tertiary)
  Hover: color text-primary
```

#### Continue Listening Cards
```
Display: grid, grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))
Gap: 20px

Each card:
  Background: var(--surface-1)
  Border-radius: radius-lg (8px)
  Padding: 12px
  Transition: transform 200ms, box-shadow 200ms
  
  Album art container:
    Aspect-ratio: 1/1
    Border-radius: radius-md (6px)
    Overflow: hidden
    Position: relative
    
    Image: object-fit: cover, width 100%, height 100%
    
    Hover overlay:
      Position: absolute, inset: 0
      Background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)
      Opacity: 0 → 1 on hover
      Transition: opacity 200ms
    
    Play button (appears on hover):
      Position: absolute, bottom: 12px, right: 12px
      Size: 48px circle
      Background: var(--accent)
      Color: var(--background) (dark text on accent)
      Border-radius: radius-full
      Display: flex, align-items: center, justify-content: center
      Box-shadow: 0 4px 12px rgba(0,0,0,0.4)
      Transform: translateY(8px), opacity: 0 → translateY(0), opacity: 1
      Transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1) (spring bounce)
      
  Track info below art:
    Margin-top: 12px
    
    Title: 14px, weight 600, color text-primary, 1 line, ellipsis
    Artist: 13px, weight 400, color text-secondary, 1 line, ellipsis
    
  Progress indicator (optional, shown on currently playing):
    Height: 3px
    Background: var(--progress-bg)
    Border-radius: radius-full
    Margin-top: 8px
    
    Fill:
      Height: 100%
      Background: var(--accent)
      Border-radius: radius-full
      Width: dynamic based on playback progress
```

#### Recently Added Row
```
Display: flex, gap: 16px, overflow-x: auto
Padding-bottom: 8px (for scrollbar)
Scroll-snap-type: x mandatory

Each item:
  Width: 140px
  Flex-shrink: 0
  Scroll-snap-align: start
  
  Thumbnail:
    Aspect-ratio: 1/1
    Border-radius: radius-md
    Overflow: hidden
    
  Artist name: 13px, weight 500, color text-primary, margin-top: 8px, 1 line
  Album name: 12px, weight 400, color text-secondary, 1 line
  
  Hover:
    Image scale: 1.03
    Transition: 300ms ease
```

#### YouTube Imports List
```
Each row:
  Height: 56px
  Display: flex, align-items: center, gap: 12px
  Padding: 0 12px
  Border-radius: radius-md
  
  Hover:
    Background: var(--surface-2)
    
  Thumbnail:
    Width: 40px, height: 40px
    Border-radius: radius-sm
    Object-fit: cover
  
  Title:
    Flex: 1
    Font: 14px, weight 500, color text-primary
    1 line, ellipsis
  
  Duration:
    Font: 12px, weight 400, color text-tertiary
    Width: 48px, text-align: right
  
  Format badge (MP3):
    Padding: 2px 8px
    Background: var(--surface-3)
    Border-radius: radius-sm
    Font: 11px, weight 600, color text-secondary
    Text-transform: uppercase
  
  Quality badge (320kbps):
    Same style as format badge
    
  Time ago (2 days ago):
    Font: 12px, color text-tertiary
    Width: 80px
    
  3-dot menu:
    Width: 32px, height: 32px
    Border-radius: radius-full
    Display: flex, align-items: center, justify-content: center
    Color: text-tertiary
    Hover: bg-surface-3, color text-primary
```

---

### 4. Now Playing Panel

```
Width: 320px
Background: var(--surface-1) with radial gradient overlay
Border-left: 1px solid var(--border-subtle)
Padding: 24px
Display: flex, flex-direction: column
```

#### Tab Bar
```
Display: flex, gap: 24px
Border-bottom: 1px solid var(--border-subtle)
Padding-bottom: 12px
Margin-bottom: 20px

Tab:
  Font: 14px, weight 500
  Color: var(--text-tertiary)
  Padding-bottom: 12px
  Position: relative
  Cursor: pointer
  
  Active:
    Color: var(--text-primary)
    
    After pseudo-element:
      Content: ''
      Position: absolute, bottom: -1px, left: 0, right: 0
      Height: 2px
      Background: var(--accent)
      Border-radius: 2px 2px 0 0
      
  Hover (inactive):
    Color: var(--text-secondary)
```

#### Album Art (Now Playing)
```
Width: 100%
Aspect-ratio: 1/1
Border-radius: radius-lg
Overflow: hidden
Box-shadow: 0 8px 32px rgba(0,0,0,0.5)
Margin-bottom: 20px

Image: object-fit: cover
```

#### Track Info (Now Playing)
```
Display: flex, justify-content: space-between, align-items: flex-start
Margin-bottom: 16px

Left:
  Title: 16px, weight 600, color text-primary, 1 line, ellipsis
  Artist: 14px, weight 400, color text-secondary, margin-top: 4px
  
Right:
  Heart icon button
    Size: 32px
    Color: var(--text-tertiary)
    Hover: color var(--accent)
    Active (favorited): color var(--accent), fill: var(--accent)
```

#### Progress Bar
```
Width: 100%
Height: 4px
Background: var(--progress-bg)
Border-radius: radius-full
Cursor: pointer
Margin-bottom: 8px

Fill:
  Height: 100%
  Background: var(--accent)
  Border-radius: radius-full
  Transition: width 100ms linear

Hover:
  Height: 6px (thumb appears)
  
  Thumb:
    Width: 12px, height: 12px
    Background: var(--accent)
    Border-radius: radius-full
    Position: absolute on right edge of fill
    Box-shadow: 0 0 8px rgba(232,168,124,0.5)
    
Time labels below:
  Display: flex, justify-content: space-between
  Font: 11px, color var(--text-tertiary)
```

#### Player Controls (Now Playing)
```
Display: flex, justify-content: center, align-items: center
Gap: 16px
Margin: 16px 0

Shuffle icon: 20px, color text-tertiary, active: color accent
Prev icon: 24px, color text-primary, hover: scale 1.1
Play/Pause: 
  Size: 56px circle
  Background: var(--accent)
  Color: var(--background) (dark)
  Border-radius: radius-full
  Display: flex, align-items: center, justify-content: center
  Box-shadow: 0 4px 16px rgba(232,168,124,0.3)
  Hover: scale 1.05, box-shadow increases
  Active: scale 0.95
Next icon: same as prev
Repeat icon: same as shuffle
```

#### Quality Badges
```
Display: flex, gap: 8px, flex-wrap: wrap
Margin-bottom: 24px

Each badge:
  Padding: 4px 10px
  Background: var(--surface-2)
  Border: 1px solid var(--border-default)
  Border-radius: radius-sm
  Font: 11px, weight 600
  Color: var(--text-secondary)
  
Badges shown:
  FLAC | 24-bit | 44.1 kHz | Lossless
```

#### Queue Section
```
Border-top: 1px solid var(--border-subtle)
Padding-top: 16px
Flex: 1 (takes remaining space)
Overflow-y: auto

Header:
  Display: flex, justify-content: space-between, align-items: center
  Margin-bottom: 12px
  
  "Queue": 14px, weight 600
  "Clear": 12px, weight 500, color text-tertiary, hover: color text-primary

Queue item:
  Height: 48px
  Display: flex, align-items: center, gap: 10px
  Padding: 0 8px
  Border-radius: radius-md
  
  Hover:
    Background: var(--surface-2)
    
  Thumbnail:
    Width: 36px, height: 36px
    Border-radius: radius-sm
    
  Info:
    Flex: 1
    
    Title: 13px, weight 500, color text-primary, 1 line
    Artist: 12px, weight 400, color text-secondary, 1 line
    
  Duration: 12px, color text-tertiary
  
  Playing indicator (for current track):
    Small animated bars icon (3 vertical bars, oscillating heights)
    Color: var(--accent)
    
  Drag handle: grip icon on left, opacity 0 → 1 on hover
```

---

### 5. Mini Player Bar (Bottom)

```
Height: 64px
Background: var(--player-bar-bg)
Border-top: 1px solid var(--border-subtle)
Padding: 0 16px
Display: flex, align-items: center, justify-content: space-between
```

#### Left Section (Track Info)
```
Width: 25%
Display: flex, align-items: center, gap: 12px

Album art: 48px × 48px, border-radius: radius-sm

Info:
  Title: 13px, weight 500, color text-primary, 1 line
  Artist: 12px, weight 400, color text-secondary, 1 line
  Badges: FLAC | 24-bit | 44.1 kHz (inline, small, muted)

Heart icon: 18px, color text-tertiary, hover: color accent, margin-left: 8px
```

#### Center Section (Controls + Visualizer)
```
Width: 50%
Display: flex, flex-direction: column, align-items: center, gap: 4px

Controls row:
  Display: flex, align-items: center, gap: 20px
  
  Shuffle: 18px
  Prev: 20px
  Play/Pause: 40px circle, bg accent, color dark
  Next: 20px
  Repeat: 18px
  
Visualizer:
  Width: 120px
  Height: 20px
  Display: flex, align-items: center, justify-content: center, gap: 2px
  
  Bars (20-30 bars):
    Width: 2px
    Background: var(--accent) at varying opacity
    Border-radius: radius-full
    Animation: height oscillation (randomized, smooth)
    
  Note: Visualizer is decorative in v1. Real audio analysis can be added later.
```

#### Right Section (Volume + Extras)
```
Width: 25%
Display: flex, align-items: center, justify-content: flex-end, gap: 12px

Volume:
  Speaker icon: 18px, color text-tertiary
  Slider: width 100px, height 4px
  
Mini player toggle: 18px icon, color text-tertiary, hover: color text-primary
Queue toggle: 18px icon, color text-tertiary, hover: color text-primary
```

---

## Animations & Transitions

### Timing Functions
```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Duration Tokens
```css
--duration-instant: 75ms;
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Specific Animations

#### Card Play Button Reveal
```css
/* On parent hover */
.card:hover .play-button {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms var(--ease-spring);
}

.play-button {
  opacity: 0;
  transform: translateY(8px);
}
```

#### Now Playing Panel Slide-In
```css
.now-playing-panel {
  transform: translateX(100%);
  transition: transform 300ms var(--ease-out);
}

.now-playing-panel.open {
  transform: translateX(0);
}
```

#### Track Row Hover
```css
.track-row {
  transition: background-color 150ms var(--ease-default);
}

.track-row:hover {
  background-color: var(--surface-2);
}
```

#### Album Art Scale
```css
.album-art {
  transition: transform 300ms var(--ease-default);
}

.card:hover .album-art {
  transform: scale(1.03);
}
```

#### Progress Bar Thumb
```css
.progress-bar {
  height: 4px;
  transition: height 150ms var(--ease-default);
}

.progress-bar:hover {
  height: 6px;
}

.progress-bar:hover .thumb {
  opacity: 1;
  transform: scale(1);
}

.thumb {
  opacity: 0;
  transform: scale(0);
  transition: all 150ms var(--ease-default);
}
```

#### Page Transition
```css
.page-enter {
  opacity: 0;
  transform: translateY(8px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 200ms var(--ease-out);
}
```

#### Toast Slide-In
```css
.toast {
  transform: translateY(-100%);
  opacity: 0;
  transition: all 300ms var(--ease-spring);
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}
```

---

## Scrollbar Styling

```css
/* Webkit */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* Firefox */
scrollbar-width: thin;
scrollbar-color: var(--scrollbar-thumb) transparent;
```

---

## Responsive Behavior

### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| Mobile | < 768px | Not supported (desktop app) |
| Tablet | 768-1024px | Collapse Now Playing panel to overlay, sidebar stays |
| Desktop | 1024-1440px | Default three-column layout |
| Large | > 1440px | More columns in grids, wider spacing |

### Tablet Behavior (768-1024px)
- Now Playing panel: hidden by default, toggle button in top bar, slides in as overlay (z-50, backdrop blur)
- Sidebar: stays visible
- Grid columns: 3-4 instead of 4-5

### Keyboard Shortcuts Display
- Show "Ctrl K" hint in search bar
- Profile dropdown shows keyboard shortcuts section

---

## Iconography

All icons from **Lucide React**. Size mapping:

| Context | Size | Stroke Width |
|---------|------|--------------|
| Sidebar nav | 20px | 1.5 |
| Top bar | 20px | 1.5 |
| Player controls | 20-24px | 2 |
| Play/Pause button | 24px | 2.5 |
| Small actions (heart, menu) | 16-18px | 1.5 |
| Badges/indicators | 14px | 2 |

### Icon Mapping (from image)
- Home → `Home` icon
- Library → `Library` icon
- Songs → `Music` icon
- Albums → `Disc` icon
- Artists → `Users` icon
- Playlists → `ListMusic` icon
- Folders → `Folder` icon
- YouTube Import → Custom or `Youtube` icon
- Discover → `Compass` icon
- Favs playlist → `Heart` icon (red fill)
- Settings → `Settings` icon
- Search → `Search` icon
- Notifications → `Bell` icon
- Profile → Avatar + `ChevronDown`
- Shuffle → `Shuffle` icon
- Previous → `SkipBack` icon
- Next → `SkipForward` icon
- Repeat → `Repeat` icon
- Play → `Play` icon
- Pause → `Pause` icon
- Heart/Favorite → `Heart` icon
- Volume → `Volume2` / `Volume1` / `VolumeX`
- Queue → `ListMusic` or `List` icon
- More actions → `MoreVertical` (3 dots)
- Mini player → `PictureInPicture` or `Square` icon

---

## Asset Requirements

### App Icon
- 256×256 PNG for app icon
- 16×16, 32×32 for taskbar
- SVG source for scaling

### Placeholder Images
- Empty library illustration (subtle, monochrome)
- Empty queue illustration
- No search results illustration

### Logo
- "T" lettermark in a circle, accent color background
- Used in sidebar and app icon

---

## Implementation Notes

1. **CSS Variables**: All colors, spacing, radii, shadows defined as CSS custom properties on `:root`. Theme toggle swaps the values.

2. **Tailwind Config**: Extend theme with all custom colors, use `dark:` prefix for dark mode utilities.

3. **Component Isolation**: Each major section (Sidebar, TopBar, MainContent, NowPlayingPanel, PlayerBar) is a top-level component. Internal sections are sub-components.

4. **Scroll Behavior**: Main content area has `overflow-y: auto`. Now Playing panel has independent scroll. Sidebar scrolls if content overflows.

5. **Glassmorphism**: Player bar uses `backdrop-filter: blur(8px)` with semi-transparent background. Now Playing panel has subtle radial gradient.

6. **Focus States**: All interactive elements have visible focus rings using accent color for keyboard navigation accessibility.

7. **Loading States**: Skeleton UI uses pulsing gray blocks (shadcn Skeleton component) matching surface colors.

8. **Empty States**: Custom illustrations with CTA buttons, consistent padding and typography.
