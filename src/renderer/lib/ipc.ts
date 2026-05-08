import type { TplayerAPI } from '../../shared/ipc/contracts'

export const api: TplayerAPI = window.tplayerAPI

export function useIPC() {
  return api
}
