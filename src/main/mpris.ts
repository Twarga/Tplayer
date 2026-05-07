// MPRIS integration placeholder
// dbus-next has complex typing; stub for now

export async function initMpris(): Promise<void> {
  console.log('[mpris] MPRIS placeholder - dbus integration not fully wired')
}

export function updateMprisPlayingState(_state: string, _metadata?: Record<string, unknown>): void {
  // noop
}

export function shutdownMpris(): void {
  // noop
}