import { RotateCcw, Sparkles } from 'lucide-react'
import { useEqStore, EQ_PRESETS } from '@/stores/eqStore'
import { cn } from '@/lib/utils'

const BAND_LABELS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k']

export function EqualizerView() {
  const { bands, isEnabled, presetName, setBand, setPreset, enable, reset } = useEqStore()

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-tertiary font-semibold">Playback tone</p>
          <h1 className="font-display text-[2rem] font-bold text-primary mt-2">Equalizer</h1>
          <p className="text-sm text-secondary mt-2 max-w-2xl leading-6">
            Shape the player output with a stable 10-band EQ. Presets are instant, and custom changes persist between sessions.
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer border-y border-white/[0.06] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-tertiary">EQ</p>
            <p className="text-sm font-semibold text-primary mt-1">{isEnabled ? 'Enabled' : 'Bypassed'}</p>
          </div>
          <button
            onClick={() => enable(!isEnabled)}
            className={cn(
              'w-12 h-7 rounded-full relative interactive-soft',
              isEnabled ? 'bg-accent shadow-accent-glow' : 'bg-surface-4'
            )}
          >
            <span
              className={cn(
                'absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-card transition-transform duration-fast',
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </label>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
        <section className="border-y border-white/[0.06] py-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-tertiary font-semibold">Current profile</p>
              <div className="flex items-center gap-2 mt-2">
                <Sparkles size={15} className="text-accent" />
                <h2 className="text-lg font-semibold text-primary">{presetName}</h2>
              </div>
            </div>

            <button
              onClick={() => reset()}
              className="h-10 px-1 border-b border-white/[0.08] text-secondary hover:text-primary hover:border-accent interactive-soft flex items-center gap-2"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          <div className={cn(
            'relative border-y border-white/[0.06] px-5 py-8',
            !isEnabled && 'opacity-70'
          )}>
            <div className="pointer-events-none absolute inset-x-5 top-1/2 h-px bg-border-subtle" />
            <div className="flex justify-between items-end h-[320px] gap-3">
              {bands.map((gain, i) => (
                <div key={BAND_LABELS[i]} className="flex-1 flex flex-col items-center gap-3">
                  <span className={cn(
                    'text-[10px] font-mono',
                    gain === 0 ? 'text-tertiary' : gain > 0 ? 'text-accent' : 'text-secondary'
                  )}>
                    {gain > 0 ? `+${gain}` : gain}
                  </span>

                  <div className="relative h-[220px] w-full flex justify-center">
                    <div className="absolute top-0 bottom-0 w-[2px] rounded-full bg-border-subtle" />
                    <div
                      className={cn(
                        'absolute left-1/2 -translate-x-1/2 w-4 rounded-full bg-accent/18 border border-accent/30 transition-all duration-fast ease-default',
                        !isEnabled && 'bg-surface-4 border-border-subtle'
                      )}
                      style={{
                        height: `${Math.max(Math.abs(gain) * 8, 6)}px`,
                        bottom: gain >= 0 ? '50%' : `calc(50% - ${Math.max(Math.abs(gain) * 8, 6)}px)`,
                      }}
                    />
                    <div
                      className={cn(
                        'absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border border-white/10 bg-surface-elevated shadow-progress-thumb transition-transform duration-fast ease-default',
                        !isEnabled && 'shadow-none bg-surface-3'
                      )}
                      style={{
                        bottom: `calc(50% + ${gain * 8}px - 10px)`,
                      }}
                    />
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      value={gain}
                      onChange={(e) => void setBand(i, Number(e.target.value))}
                      disabled={!isEnabled}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>

                  <span className="text-[11px] text-tertiary font-medium">{BAND_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="border-y border-white/[0.06] py-5">
          <p className="text-xs uppercase tracking-[0.14em] text-tertiary font-semibold">Presets</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.keys(EQ_PRESETS).map((name) => (
              <button
                key={name}
                onClick={() => void setPreset(name)}
                className={cn(
                  'px-3 py-3 text-xs font-semibold text-left interactive-soft border-b',
                  presetName === name
                    ? 'text-accent border-accent'
                    : 'text-secondary border-white/[0.06] hover:text-primary hover:border-white/[0.14]'
                )}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="mt-5 border-y border-white/[0.06] py-4">
            <p className="text-xs uppercase tracking-[0.14em] text-tertiary font-semibold">Status</p>
            <p className="text-sm font-semibold text-primary mt-2">
              {isEnabled ? `${presetName} is active` : 'EQ is currently bypassed'}
            </p>
            <p className="text-xs text-secondary mt-2 leading-5">
              Band values and bypass state persist automatically. Turn EQ off to return to the untouched playback signal.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
