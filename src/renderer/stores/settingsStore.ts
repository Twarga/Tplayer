import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface SettingsStore {
  settings: Record<string, string>
  musicFolders: string[]
  load: () => Promise<void>
  set: (key: string, value: string) => Promise<void>
  addFolder: () => Promise<string | null>
  removeFolder: (path: string) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  musicFolders: [],

  load: async () => {
    const settings = await api.settings.getAll()
    const folders = await api.settings.getFolders()
    set({ settings, musicFolders: folders })
  },

  set: async (key, value) => {
    await api.settings.set(key, value)
    set((s) => ({ settings: { ...s.settings, [key]: value } }))
  },

  addFolder: async () => {
    const path = await api.settings.openFolderDialog()
    if (path) {
      await api.settings.addFolder(path)
      const folders = await api.settings.getFolders()
      set({ musicFolders: folders })
    }
    return path
  },

  removeFolder: async (path) => {
    await api.settings.removeFolder(path)
    const folders = await api.settings.getFolders()
    set({ musicFolders: folders })
  },
}))