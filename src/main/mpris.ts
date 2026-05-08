import { BrowserWindow } from 'electron'
import { getPlayerStateExport, pause, resume, nextTrack, prevTrack, seek, setRepeatMode, setShuffle, setVolume } from './audio-engine'
import type { PlayerExportState } from '../shared/types/playback'
import { pathToFileURL } from 'url'

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
    LoopStatus: 'None' | 'Track' | 'Playlist'
    Shuffle: boolean
    Position: number
  }

  constructor() {
    super('org.mpris.MediaPlayer2.Player')

    this._state = {
      PlaybackStatus: 'Stopped',
      Metadata: { 'mpris:trackid': new dbus.Variant('o', '/org/mpris/MediaPlayer2/Tplayer/Track/0') },
      Volume: 0.8,
      LoopStatus: 'None',
      Shuffle: false,
      Position: 0,
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
  set Volume(v: number) {
    setVolume(v)
  }
  get Position() { return this._state.Position }

  get CanGoNext() { return true }
  get CanGoPrevious() { return true }
  get CanPlay() { return true }
  get CanPause() { return true }
  get CanSeek() { return true }
  get CanControl() { return true }

  get LoopStatus() { return this._state.LoopStatus }
  set LoopStatus(v: string) {
    if (v === 'Track') {
      setRepeatMode('one')
      return
    }
    if (v === 'Playlist') {
      setRepeatMode('all')
      return
    }
    setRepeatMode('off')
  }

  get Shuffle() { return this._state.Shuffle }
  set Shuffle(v: boolean) {
    setShuffle(Boolean(v))
  }

  Next() { nextTrack() }
  Previous() { prevTrack() }
  Pause() { pause() }
  PlayPause() {
    const state = getPlayerStateExport()
    if (state.isPlaying) pause()
    else resume()
  }
  Stop() { pause() }
  Play() { resume() }
  Seek(offset: number) {
    const current = getPlayerStateExport().currentTime
    const newPos = Math.max(0, current + offset / 1e6)
    seek(newPos)
  }
  SetPosition(_trackId: string, position: number) {
    seek(position / 1e6)
  }
  OpenUri(_uri: string) {}

  syncFromState(state: PlayerExportState) {
    switch (state.playbackState) {
      case 'playing':
        this._state.PlaybackStatus = 'Playing'
        break
      case 'paused':
      case 'loading':
        this._state.PlaybackStatus = 'Paused'
        break
      default:
        this._state.PlaybackStatus = 'Stopped'
    }

    const meta: Record<string, unknown> = {
      'mpris:trackid': new dbus.Variant(
        'o',
        `/org/mpris/MediaPlayer2/Tplayer/Track/${state.currentTrackId ?? 0}`
      ),
    }

    if (state.currentTrack) {
      if (state.currentTrack.title) meta['xesam:title'] = new dbus.Variant('s', state.currentTrack.title)
      if (state.currentTrack.artist) meta['xesam:artist'] = new dbus.Variant('as', [state.currentTrack.artist])
      if (state.currentTrack.album) meta['xesam:album'] = new dbus.Variant('s', state.currentTrack.album)
      if (state.currentTrack.cover_path) {
        meta['mpris:artUrl'] = new dbus.Variant('s', pathToFileURL(state.currentTrack.cover_path).toString())
      }
      if (state.duration > 0) {
        meta['mpris:length'] = new dbus.Variant('x', Math.round(state.duration * 1e6))
      }
    }

    this._state.Metadata = meta
    this._state.Volume = state.volume
    this._state.Position = Math.round(state.currentTime * 1e6)
    this._state.LoopStatus =
      state.repeatMode === 'one' ? 'Track' :
      state.repeatMode === 'all' ? 'Playlist' :
      'None'
    this._state.Shuffle = state.isShuffled

    try {
      Interface.emitPropertiesChanged(this, {
        PlaybackStatus: new dbus.Variant('s', this._state.PlaybackStatus),
        Metadata: new dbus.Variant('a{sv}', meta),
        Volume: new dbus.Variant('d', this._state.Volume),
        LoopStatus: new dbus.Variant('s', this._state.LoopStatus),
        Shuffle: new dbus.Variant('b', this._state.Shuffle),
      }, [])
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
    mprisIface.syncFromState(getPlayerStateExport())

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

export function syncMprisPlayerState(state: PlayerExportState): void {
  try {
    mprisIface?.syncFromState(state)
  } catch (err) {
    console.error('[mpris] syncPlayerState failed:', err)
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
