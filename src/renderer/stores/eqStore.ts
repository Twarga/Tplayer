import { create } from 'zustand'
import { api } from '@/lib/ipc'

const PRESETS: Record<string, number[]> = {
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

interface EqStore {
  bands: number[]
  isEnabled: boolean
  presetName: string
  setBand: (index: number, value: number) => void
  setBands: (bands: number[]) => void
  setPreset: (name: string) => void
  enable: (enabled: boolean) => void
  init: () => void
}

export const useEqStore = create<EqStore>((set, get) => ({
  bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  isEnabled: false,
  presetName: 'Flat',

  init() {
    api.eq.getEnabled().then((enabled) => set({ isEnabled: enabled }))
  },

  setBand: async (index, value) => {
    const bands = [...get().bands]
    bands[index] = value
    set({ bands, presetName: 'Custom' })
    await api.eq.setBands(bands)
  },

  setBands: async (bands) => {
    set({ bands })
    await api.eq.setBands(bands)
  },

  setPreset: async (name) => {
    const preset = PRESETS[name] || PRESETS.Flat
    set({ bands: preset, presetName: name })
    await api.eq.setPreset(name)
  },

  enable: async (enabled) => {
    set({ isEnabled: enabled })
    await api.eq.enable(enabled)
  },
}))