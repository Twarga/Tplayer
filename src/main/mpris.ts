import { BrowserWindow } from 'electron'
import { getState, pause, resume, nextTrack, prevTrack, seek } from './audio-engine'
import type { PlaybackState } from '../shared/types/playback'

const dbus = require('dbus-next')

let bus: ReturnType<typeof dbus.sessionBus> | null = null
let mprisIface: InstanceType<typeof dbus.Interface> | null = null
let mainWindow: BrowserWindow | null = null

const Interface = dbus.interface.Interface

class MprisInterface extends Interface {
  _state: {
    PlaybackStatus: 'Playing' | 'Paused' | 'Stopped'
    Metadata: Record<string, unknown>
    Volume: number
  }

  constructor() {
    super('org.mpris.MediaPlayer2.Player')

    this._state = {
      PlaybackStatus: 'Stopped',
      Metadata: { 'mpris:trackid': '/org/mpris/MediaPlayer2/Tplayer/Track/0' },
      Volume: 0.8,
    }

    Interface.configureMembers(this.constructor, {
      properties: {
        PlaybackStatus: { signature: 's', access: 'read' },
        Metadata: { signature: 'a{sv}', access: 'read' },
        Volume: { signature: 'd', access: 'readwrite' },
        Position: { signature: 'x', access: 'read' },
        CanGoNext: { signature: 'b', access: 'read' },
        CanGoPrevious: { signature: 'b', access: 'read' },
        CanPlay: { signature: 'b', access: 'read' },
        CanPause: { signature: 'b', access: 'read' },
        CanSeek: { signature: 'b', access: 'read' },
        CanControl: { signature: 'b', access: 'read' },
        LoopStatus: { signature: 's', access: 'readwrite' },
        Shuffle: { signature: 'b', access: 'readwrite' },
      },
      methods: {
        Next: { inSignature: '', outSignature: '' },
        Previous: { inSignature: '', outSignature: '' },
        Pause: { inSignature: '', outSignature: '' },
        PlayPause: { inSignature: '', outSignature: '' },
        Stop: { inSignature: '', outSignature: '' },
        Play: { inSignature: '', outSignature: '' },
        Seek: { inSignature: 'x', outSignature: '' },
        SetPosition: { inSignature: 'ox', outSignature: '' },
        OpenUri: { inSignature: 's', outSignature: '' },
      },
    })
  }

  get PlaybackStatus() { return this._state.PlaybackStatus }
  get Metadata() { return this._state.Metadata }
  get Volume() { return this._state.Volume }
  set Volume(v: number) { this._state.Volume = v }

  get Position() {
    const state = getState()
    if (state.playbackState === 'playing' || state.playbackState === 'paused') {
      return Math.round(state.currentTime * 1e6)
    }
    return 0
  }

  get CanGoNext() { return true }
  get CanGoPrevious() { return true }
  get CanPlay() { return true }
  get CanPause() { return true }
  get CanSeek() { return true }
  get CanControl() { return true }

  get LoopStatus() {
    const state = getState()
    if (state.repeatMode === 'one') return 'Track'
    if (state.repeatMode === 'all') return 'Playlist'
    return 'None'
  }
  set LoopStatus(_v: string) {}

  get Shuffle() { return getState().isShuffled }
  set Shuffle(_v: boolean) {}

  Next() { nextTrack() }
  Previous() { prevTrack() }
  Pause() { pause() }
  PlayPause() {
    const state = getState()
    if (state.isPlaying) pause()
    else resume()
  }
  Stop() { pause() }
  Play() { resume() }
  Seek(offset: number) {
    const current = getState().currentTime
    const newPos = Math.max(0, current + offset / 1e6)
    seek(newPos)
  }
  SetPosition(_trackId: string, position: number) {
    seek(position / 1e6)
  }
  OpenUri(_uri: string) {}

  updatePlayingState(playbackState: PlaybackState) {
    switch (playbackState) {
      case 'playing':
        this._state.PlaybackStatus = 'Playing'
        break
      case 'paused':
      case 'loading':
        this._state.PlaybackStatus = 'Paused'
        break
      default:
    }
    try {
      Interface.emitPropertiesChanged(this, { PlaybackStatus: new dbus.Variant('s', this._state.PlaybackStatus) }, [])
    } catch {}
  }

  updateMeta(title: string, artists: string[], album?: string, artUrl?: string, length?: number) {
    const meta: Record<string, unknown> = {
      'mpris:trackid': new dbus.Variant('o', '/org/mpris/MediaPlayer2/Tplayer/Track/0'),
    }
    if (title) meta['xesam:title'] = new dbus.Variant('s', title)
    if (artists.length) meta['xesam:artist'] = new dbus.Variant('as', artists)
    if (album) meta['xesam:album'] = new dbus.Variant('s', album)
    if (artUrl) meta['mpris:artUrl'] = new dbus.Variant('s', artUrl)
    if (length && length > 0) meta['mpris:length'] = new dbus.Variant('x', Math.round(length * 1e6))
    this._state.Metadata = meta
    try {
      Interface.emitPropertiesChanged(this, { Metadata: new dbus.Variant('a{sv}', meta) }, [])
    } catch {}
  }
}

export async function initMpris(win: BrowserWindow): Promise<void> {
  mainWindow = win
  try {
    bus = dbus.sessionBus()
    const result = await bus.requestName('org.mpris.MediaPlayer2.Tplayer')
    console.log('[mpris] requestName result:', result)

    mprisIface = new MprisInterface()

    const RootIface = class extends Interface {
      constructor() { super('org.mpris.MediaPlayer2') }
      get Identity() { return 'Tplayer' }
      get CanRaise() { return true }
      get CanQuit() { return true }
      get CanSetFullscreen() { return false }
      get HasTrackList() { return false }
      get DesktopEntry() { return 'tplayer' }
      get SupportedUriSchemes() { return ['file'] }
      get SupportedMimeTypes() { return ['audio/mpeg', 'audio/flac', 'audio/ogg', 'audio/opus', 'audio/wav', 'audio/aac'] }
      Raise() {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
      Quit() {}
    }

    Interface.configureMembers(RootIface, {
      properties: {
        Identity: { signature: 's', access: 'read' },
        CanRaise: { signature: 'b', access: 'read' },
        CanQuit: { signature: 'b', access: 'read' },
        CanSetFullscreen: { signature: 'b', access: 'read' },
        HasTrackList: { signature: 'b', access: 'read' },
        DesktopEntry: { signature: 's', access: 'read' },
        SupportedUriSchemes: { signature: 'as', access: 'read' },
        SupportedMimeTypes: { signature: 'as', access: 'read' },
      },
      methods: {
        Raise: { inSignature: '', outSignature: '' },
        Quit: { inSignature: '', outSignature: '' },
      },
    })

    const rootIface = new RootIface()

    bus.export('/org/mpris/MediaPlayer2', mprisIface)
    bus.export('/org/mpris/MediaPlayer2', rootIface)

    console.log('[mpris] MPRIS registered on D-Bus')
  } catch (err) {
    console.error('[mpris] Failed to initialize MPRIS:', err)
  }
}

export function updateMprisMeta(title: string, artists: string[], album?: string, artUrl?: string, length?: number): void {
  try {
    mprisIface?.updateMeta(title, artists, album, artUrl, length)
  } catch (err) {
    console.error('[mpris] updateMeta failed:', err)
  }
}

export function updateMprisPlayingState(playbackState: PlaybackState): void {
  try {
    mprisIface?.updatePlayingState(playbackState)
  } catch (err) {
    console.error('[mpris] updatePlayingState failed:', err)
  }
}

export function shutdownMpris(): void {
  if (bus) {
    try { bus.releaseName('org.mpris.MediaPlayer2.Tplayer') } catch {}
  }
  if (bus) {
    try { bus.disconnect() } catch {}
    bus = null
  }
  mprisIface = null
  console.log('[mpris] MPRIS shutdown')
}
