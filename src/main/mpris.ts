import { getState } from './audio-engine'

let _bus: unknown = null
let _isRegistered = false

async function getBus() {
  if (_bus) return _bus

  try {
    const { dbus } = await import('dbus-next')
    _bus = dbus.sessionBus()
    return _bus
  } catch {
    return null
  }
}

export async function initMpris(): Promise<void> {
  const bus = await getBus()
  if (!bus) {
    console.warn('[mpris] dbus-next not available, MPRIS disabled')
    return
  }

  try {
    const service = await bus.requestBusName('org.mpris.MediaPlayer2.Tplayer')

    const rootInterface = {
      name: 'org.mpris.MediaPlayer2',
      methods: {
        Raise: () => {},
        Quit: () => {},
      },
      properties: {
        Identity: 'Tplayer',
        CanRaise: true,
        CanQuit: true,
        HasTrackList: false,
        SupportedUriSchemes: ['file'],
        SupportedMimeTypes: [
          'audio/mpeg',
          'audio/flac',
          'audio/ogg',
          'audio/wav',
          'audio/aac',
          'audio/x-flac',
          'audio/ogg;vorbis',
        ],
      },
    }

    const playerInterface = {
      name: 'org.mpris.MediaPlayer2.Player',
      methods: {
        Next: () => {},
        Previous: () => {},
        Pause: () => {},
        Stop: () => {},
        Play: () => {},
        Seek: (x: number) => {},
        SetPosition: (x: number, y: number) => {},
        OpenUri: (x: string) => {},
      },
      properties: {
        PlaybackStatus: 'Stopped',
        LoopStatus: 'None',
        Rate: 1.0,
        SetRate: 1.0,
        Shuffle: false,
        Volume: 1.0,
        Position: 0,
        MinimumRate: 1.0,
        MaximumRate: 1.0,
        CanGoNext: true,
        CanGoPrevious: true,
        CanPause: true,
        CanPlay: true,
        CanSeek: true,
        CanControl: true,
      },
    }

    await bus.registerObject('/org/mpris/MediaPlayer2', [rootInterface, playerInterface])
    _isRegistered = true
    console.log('[mpris] MPRIS interface registered')
  } catch (err) {
    console.error('[mpris] Failed to register MPRIS interface:', err)
  }
}

export function updateMprisPlayingState(state: string, metadata?: Record<string, unknown>): void {
  if (!_isRegistered) return

}

export function shutdownMpris(): void {
  _isRegistered = false
  _bus = null
}