import { create } from 'zustand'
import { api } from '@/lib/ipc'

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [5, 4, 3, 1, -1, -1, 0, 2, 3, 4],
  Pop: [-1, 1, 3, 4, 3, 0, -1, -1, -1, -2],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  Classical: [4, 3, 2, 1, -1, 0, 0, 2, 3, 4],
  HipHop: [5, 4, 1, -2, -1, 1, 2, 0, 1, 2],
  Electronic: [5, 4, 1, -1, -2, -1, 0, 1, 3, 4],
  VocalBoost: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
  BassBoost: [6, 5, 4, 2, 0, -1, 0, 1, 2, 3],
}

function derivePresetName(bands: number[]): string {
  const entry = Object.entries(EQ_PRESETS).find(([, presetBands]) =>
    presetBands.length === bands.length && presetBands.every((value, index) => value === bands[index])
  )

  return entry?.[0] ?? 'Custom'
}

interface EqStore {
  bands: number[]
  isEnabled: boolean
  presetName: string
  setBand: (index: number, value: number) => Promise<void>
  setBands: (bands: number[]) => Promise<void>
  setPreset: (name: string) => Promise<number[]>
  reset: () => Promise<void>
  enable: (enabled: boolean) => Promise<void>
  init: () => () => void
}

export const useEqStore = create<EqStore>((set, get) => ({
  bands: [...EQ_PRESETS.Flat],
  isEnabled: false,
  presetName: 'Flat',

  init() {
    let mounted = true

    const cleanup = api.eq.onBandsChanged((bands) => {
      if (!mounted || !Array.isArray(bands) || bands.length !== 10) return
      set({
        bands,
        presetName: derivePresetName(bands),
      })
    })

    Promise.all([api.eq.getEnabled(), api.settings.get('eq_bands')]).then(([enabled, rawBands]) => {
      if (!mounted) return

      let bands = [...EQ_PRESETS.Flat]
      if (rawBands) {
        try {
          const parsed = JSON.parse(rawBands)
          if (Array.isArray(parsed) && parsed.length === 10) {
            bands = parsed.map((value) => Number(value) || 0)
          }
        } catch {}
      }

      set({
        isEnabled: enabled,
        bands,
        presetName: derivePresetName(bands),
      })
    })

    return () => {
      mounted = false
      cleanup()
    }
  },

  setBand: async (index, value) => {
    const bands = [...get().bands]
    bands[index] = value
    set({ bands, presetName: derivePresetName(bands) })
    await api.eq.setBands(bands)
  },

  setBands: async (bands) => {
    const normalized = bands.map((value) => Number(value) || 0)
    set({
      bands: normalized,
      presetName: derivePresetName(normalized),
    })
    await api.eq.setBands(normalized)
  },

  setPreset: async (name) => {
    const preset = [...(EQ_PRESETS[name] || EQ_PRESETS.Flat)]
    set({ bands: preset, presetName: name })
    await api.eq.setBands(preset)
    return preset
  },

  reset: async () => {
    const flat = [...EQ_PRESETS.Flat]
    set({ bands: flat, presetName: 'Flat' })
    await api.eq.setBands(flat)
  },

  enable: async (enabled) => {
    set({ isEnabled: enabled })
    await api.eq.enable(enabled)
  },
}))
