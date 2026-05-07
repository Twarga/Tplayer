import React from 'react'
import { Volume2, Volume1, VolumeX } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { usePlayerStore } from '@/stores/playerStore'

interface VolumeControlProps {
  className?: string
}

export function VolumeControl({ className }: VolumeControlProps) {
  const { volume, setVolume } = usePlayerStore()

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.33 ? Volume1 : Volume2

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <button
        onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
        className="w-5 h-5 text-tertiary hover:text-primary transition-colors"
      >
        <VolumeIcon size={18} />
      </button>
      <div className="w-24">
        <Slider
          value={[volume * 100]}
          onValueChange={([v]) => setVolume(v / 100)}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
      <span className="text-[11px] text-tertiary w-8 text-right">{Math.round(volume * 100)}%</span>
    </div>
  )
}