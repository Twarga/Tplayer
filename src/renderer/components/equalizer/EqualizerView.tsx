import React from 'react'
import { useEqStore } from '@/stores/eqStore'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

const BAND_LABELS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']
const PRESET_NAMES = ['Flat', 'Rock', 'Pop', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic', 'Vocal Boost', 'Bass Boost', 'Custom']

export function EqualizerView() {
  const { bands, isEnabled, presetName, setBand, setPreset, enable } = useEqStore()

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">Equalizer</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-secondary">Enable</span>
          <Switch checked={isEnabled} onCheckedChange={enable} />
        </div>
      </div>

      <div className="mb-8">
        <label className="text-sm text-secondary mb-3 block">Preset</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => setPreset(name)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                presetName === name
                  ? 'bg-accent text-background'
                  : 'bg-surface-2 text-secondary hover:bg-surface-3 hover:text-primary'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-1 rounded-xl p-6">
        <div className="grid grid-cols-10 gap-4">
          {bands.map((gain, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-tertiary font-medium">{gain > 0 ? `+${gain}` : gain}dB</span>
              <div className="h-48 flex flex-col items-center justify-center">
                <Slider
                  orientation="vertical"
                  value={[gain]}
                  onValueChange={([v]) => setBand(i, v)}
                  min={-12}
                  max={12}
                  step={1}
                  disabled={!isEnabled}
                  className="h-40"
                />
              </div>
              <span className="text-[11px] text-tertiary font-medium">{BAND_LABELS[i]}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4 text-[11px] text-tertiary">
          <span>-12 dB</span>
          <span>0 dB</span>
          <span>+12 dB</span>
        </div>
      </div>
    </div>
  )
}