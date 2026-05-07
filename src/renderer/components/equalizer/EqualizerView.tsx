import { useState } from 'react'
import { useEqStore } from '@/stores/eqStore'
import { cn } from '@/lib/utils'

const BAND_LABELS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']
const PRESETS = ['Flat', 'Rock', 'Pop', 'Jazz', 'Classical', 'Hip-Hop', 'Electronic', 'Bass Boost']

export function EqualizerView() {
  const { bands, isEnabled, presetName, setBand, setPreset, enable } = useEqStore()
  const [localBands, setLocalBands] = useState(bands)

  const handleBandChange = (index: number, value: number) => {
    const newBands = [...localBands]
    newBands[index] = value
    setLocalBands(newBands)
    setBand(index, value)
  }

  const handlePreset = async (name: string) => {
    const newBands = await setPreset(name)
    setLocalBands(newBands)
  }

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">Equalizer</h1>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm text-secondary">Enable</span>
          <button
            onClick={() => enable(!isEnabled)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors relative",
              isEnabled ? "bg-accent" : "bg-surface-4"
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              isEnabled ? "translate-x-6" : "translate-x-0.5"
            )} />
          </button>
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map((name) => (
          <button
            key={name}
            onClick={() => handlePreset(name)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              presetName === name
                ? "bg-accent text-background"
                : "bg-surface-2 text-secondary hover:bg-surface-3 hover:text-primary"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="bg-surface-1 rounded-xl p-6">
        <div className="flex justify-between items-end h-48 gap-2">
          {localBands.map((gain, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-tertiary font-mono">{gain > 0 ? `+${gain}` : gain}</span>
              <div className="flex-1 w-full flex justify-center relative" style={{ height: '120px' }}>
                <div className="w-1.5 h-full bg-surface-3 rounded-full relative">
                  <div
                    className="absolute bottom-1/2 left-0 right-0 bg-accent rounded-full transition-all duration-150"
                    style={{
                      height: `${Math.abs(gain) * 4}px`,
                      bottom: gain >= 0 ? '50%' : `calc(50% - ${Math.abs(gain) * 4}px)`,
                    }}
                  />
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={gain}
                    onChange={(e) => handleBandChange(i, Number(e.target.value))}
                    disabled={!isEnabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-tertiary">{BAND_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}