import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('tplayerAPI', {
  player: {
    play: (trackId: number) => ipcRenderer.invoke('player:play', trackId)
  }
})
