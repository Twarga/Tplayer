import type { TplayerAPI } from '../../shared/ipc/contracts'

declare global {
  interface Window {
    tplayerAPI: TplayerAPI
  }
}

export type { TplayerAPI }
