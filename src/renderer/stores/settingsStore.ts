import { create } from 'zustand'
import { api } from '@/lib/ipc'

interface SettingsStore {
  settings: Record<string, string>
  musicFolders: string[]
  isLoading: boolean
  load: () => Promise<void>
  set: (key: string, value: string) => Promise<void>
  addFolder: () => Promise<string | null>
  removeFolder: (path: string) => Promise<void>
  scanFolders: () => Promise<{ added: number; updated: number; total: number }>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {},
  musicFolders: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true })
    try {
      const settings = await api.settings.getAll()
      const folders = await api.settings.getFolders()
      set({ settings, musicFolders: folders })
    } catch (err) {
      console.error('[settingsStore] load failed:', err)
    } finally {
      set({ isLoading: false })
    }
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
      // Auto-scan the new folder
      try {
        const result = await api.library.scan([path])
        console.log('[settingsStore] Scanned:', result)
      } catch (err) {
        console.error('[settingsStore] Scan failed:', err)
      }
    }
    return path
  },

  removeFolder: async (path) => {
    await api.settings.removeFolder(path)
    const folders = await api.settings.getFolders()
    set({ musicFolders: folders })
  },

  scanFolders: async () => {
    const folders = get().musicFolders
    if (folders.length === 0) return { added: 0, updated: 0, total: 0 }
    return api.library.scan(folders)
  },
}))