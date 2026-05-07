import React from 'react'
import { Heart, Volume2, Volume1, VolumeX, Shuffle, SkipBack, SkipForward, Repeat, Repeat1, PictureInPicture, ListMusic } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'
import { Slider } from '@/components/ui/slider'

function formatDuration(s: number): string {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface MiniPlayerBarProps {
  onQueueToggle?: () => void
  onMiniPlayerToggle?: () => void
}

export function MiniPlayerBar({ onQueueToggle, onMiniPlayerToggle }: MiniPlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    togglePlay,
    next,
    prev,
    setVolume,
  } = usePlayerStore()

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.33 ? Volume1 : Volume2

  return (
    <div className="h-16 w-full bg-player-bar-bg border-t border-border-subtle px-4 flex items-center">
      <div className="w-[25%] flex items-center gap-3">
        {currentTrack ? (
          <>
            <div className="w-12 h-12 rounded bg-surface-2 flex items-center justify-center text-accent font-bold text-lg">
              {currentTrack.title[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-primary truncate">{currentTrack.title}</p>
              <p className="text-[12px] text-secondary truncate">{currentTrack.artist}</p>
            </div>
            <div className="hidden md:flex gap-1">
              <span className="text-[10px] text-tertiary px-1.5 py-0.5 bg-surface-2 rounded">FLAC</span>
              <span className="text-[10px] text-tertiary px-1.5 py-0.5 bg-surface-2 rounded">24-bit</span>
            </div>
            <button className="w-[18px] h-[18px] text-tertiary hover:text-accent transition-colors">
              <Heart size={16} />
            </button>
          </>
        ) : (
          <span className="text-tertiary text-sm">No track playing</span>
        )}
      </div>

      <div className="w-[50%] flex flex-col items-center gap-1">
        <div className="flex items-center gap-5">
          <button className={`w-[18px] h-[18px] ${isShuffled ? 'text-accent' : 'text-tertiary'} hover:text-primary transition-colors`}>
            <Shuffle size={16} />
          </button>

          <button onClick={prev} className="w-5 h-5 text-primary hover:scale-110 transition-transform">
            <SkipBack size={18} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-accent text-background flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          <button onClick={next} className="w-5 h-5 text-primary hover:scale-110 transition-transform">
            <SkipForward size={18} />
          </button>

          <button className={`w-[18px] h-[18px] ${repeatMode !== 'off' ? 'text-accent' : 'text-tertiary'} hover:text-primary transition-colors`}>
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        <div className="w-[120px] h-5 flex items-center justify-center gap-[2px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-[2px] rounded-full bg-accent"
              style={{
                height: `${isPlaying ? Math.random() * 16 + 4 : 4}px`,
                opacity: isPlaying ? 0.3 + Math.random() * 0.7 : 0.3,
                transition: 'height 150ms ease',
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-[25%] flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
            className="w-[18px] h-[18px] text-tertiary hover:text-primary transition-colors"
          >
            <VolumeIcon size={16} />
          </button>
          <div className="w-[100px]">
            <Slider
              value={[volume * 100]}
              onValueChange={([v]) => setVolume(v / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        <button onClick={onMiniPlayerToggle} className="w-[18px] h-[18px] text-tertiary hover:text-primary transition-colors">
          <PictureInPicture size={16} />
        </button>

        <button onClick={onQueueToggle} className="w-[18px] h-[18px] text-tertiary hover:text-primary transition-colors">
          <ListMusic size={16} />
        </button>
      </div>
    </div>
  )
}