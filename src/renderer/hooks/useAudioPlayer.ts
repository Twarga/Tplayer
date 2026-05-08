import { useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useEqStore } from '@/stores/eqStore'
import { getToastStore } from '@/stores/toastStore'
import { getAudioContext } from '@/lib/audioContext'
import type {
  PlaybackProgressPayload,
  PlaybackStatePayload,
  SeekPayload,
  TrackLoadPayload,
} from '../../shared/types/playback'

const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

interface AudioGraphState {
  element: HTMLAudioElement
  source: MediaElementAudioSourceNode
  dryGain: GainNode
  wetGain: GainNode
  outputGain: GainNode
  eqNodes: BiquadFilterNode[]
}

let audioGraph: AudioGraphState | null = null
let lastProgressSyncAt = 0
let currentLoadToken = 0
let endedToken = -1
let playbackErrorToken = -1

interface LocalSeekEvent extends Event {
  detail?: {
    time?: number
  }
}

function updatePlaybackStore(currentTime: number, duration: number): void {
  usePlayerStore.setState((state) => ({
    currentTime: Number.isFinite(currentTime) ? currentTime : state.currentTime,
    duration: Number.isFinite(duration) && duration > 0 ? duration : state.duration,
  }))
}

function syncPlaybackProgress(payload: PlaybackProgressPayload): void {
  const now = Date.now()
  if (now - lastProgressSyncAt < 250) return

  lastProgressSyncAt = now
  window.tplayerAPI.player.syncProgress(payload).catch(() => {})
}

function syncPlaybackRuntime(force = false): void {
  if (!audioGraph) return

  const currentTime = audioGraph.element.currentTime
  const duration = audioGraph.element.duration

  updatePlaybackStore(currentTime, duration)

  if (force) {
    lastProgressSyncAt = 0
  }

  syncPlaybackProgress({ currentTime, duration })
}

function applyEqState(bands: number[], enabled: boolean): void {
  if (!audioGraph) return

  const ctx = getAudioContext()
  const dryLevel = enabled ? 0 : 1
  const wetLevel = enabled ? 1 : 0

  audioGraph.dryGain.gain.setTargetAtTime(dryLevel, ctx.currentTime, 0.04)
  audioGraph.wetGain.gain.setTargetAtTime(wetLevel, ctx.currentTime, 0.04)

  for (let i = 0; i < audioGraph.eqNodes.length; i++) {
    const gain = enabled ? (bands[i] ?? 0) : 0
    audioGraph.eqNodes[i].gain.setTargetAtTime(gain, ctx.currentTime, 0.04)
  }
}

function ensureAudioGraph(): AudioGraphState {
  if (audioGraph) {
    return audioGraph
  }

  const element = new Audio()
  element.crossOrigin = 'anonymous'
  element.preload = 'auto'

  const ctx = getAudioContext()
  const source = ctx.createMediaElementSource(element)
  const dryGain = ctx.createGain()
  const wetGain = ctx.createGain()
  const outputGain = ctx.createGain()
  const eqNodes = EQ_FREQS.map((freq) => {
    const node = ctx.createBiquadFilter()
    node.type = 'peaking'
    node.frequency.value = freq
    node.Q.value = 1
    node.gain.value = 0
    return node
  })

  source.connect(dryGain)
  dryGain.connect(outputGain)

  source.connect(eqNodes[0])
  for (let i = 0; i < eqNodes.length - 1; i++) {
    eqNodes[i].connect(eqNodes[i + 1])
  }
  eqNodes[eqNodes.length - 1].connect(wetGain)
  wetGain.connect(outputGain)
  outputGain.connect(ctx.destination)

  outputGain.gain.value = 1
  dryGain.gain.value = 1
  wetGain.gain.value = 0

  let playRecorded = false

  element.addEventListener('play', () => {
    playRecorded = false
    usePlayerStore.setState({ isPlaying: true, playbackState: 'playing' })
  })

  element.addEventListener('pause', () => {
    if (!element.ended) {
      usePlayerStore.setState({ isPlaying: false, playbackState: 'paused' })
    }
  })

  element.addEventListener('loadedmetadata', () => {
    syncPlaybackRuntime(true)
  })

  element.addEventListener('durationchange', () => {
    syncPlaybackRuntime(true)
  })

  element.addEventListener('seeked', () => {
    syncPlaybackRuntime(true)
  })

  element.addEventListener('timeupdate', () => {
    const currentTime = element.currentTime
    const duration = element.duration

    syncPlaybackRuntime()

    if (!playRecorded && duration > 0) {
      if (currentTime > 30 || currentTime > duration * 0.5) {
        playRecorded = true
        const trackId = usePlayerStore.getState().currentTrack?.id
        if (trackId) {
          window.tplayerAPI.player.recordPlay(trackId)
        }
      }
    }
  })

  element.addEventListener('ended', () => {
    if (endedToken === currentLoadToken) return
    endedToken = currentLoadToken
    syncPlaybackRuntime(true)
    window.tplayerAPI.player.trackEnded()
  })

  element.addEventListener('error', () => {
    if (playbackErrorToken === currentLoadToken) return
    playbackErrorToken = currentLoadToken
    const errorStr = element.error?.message || 'Unknown decode error'
    getToastStore().add(`Failed to play track: ${errorStr}`, 'error')
    usePlayerStore.setState({ isPlaying: false, playbackState: 'error' })
  })

  audioGraph = {
    element,
    source,
    dryGain,
    wetGain,
    outputGain,
    eqNodes,
  }

  return audioGraph
}

export function useAudioPlayer() {
  const { volume } = usePlayerStore()
  const bands = useEqStore((s) => s.bands)
  const isEnabled = useEqStore((s) => s.isEnabled)

  useEffect(() => {
    const graph = ensureAudioGraph()
    graph.outputGain.gain.setTargetAtTime(volume, getAudioContext().currentTime, 0.08)
  }, [volume])

  useEffect(() => {
    ensureAudioGraph()
    applyEqState(bands, isEnabled)
  }, [bands, isEnabled])

  useEffect(() => {
    ensureAudioGraph()

    const cleanupLoad = window.tplayerAPI.player.onLoad((data: TrackLoadPayload) => {
      currentLoadToken += 1
      endedToken = -1
      playbackErrorToken = -1

      const graph = ensureAudioGraph()
      const { element } = graph

      if (data.url) {
        if (getAudioContext().state === 'suspended') {
          getAudioContext().resume().catch(() => {})
        }

        element.pause()
        element.src = data.url
        element.currentTime = data.startTime || 0
        element.load()
        updatePlaybackStore(data.startTime || 0, data.duration)
        element.play().catch((e) => {
          if (e?.name === 'AbortError') return
          window.tplayerAPI.system.log?.('[audio] Play failed:', e.message)
        })
      }
    })

    const cleanupState = window.tplayerAPI.player.onPlaybackState((state: PlaybackStatePayload) => {
      const graph = ensureAudioGraph()
      if (state.state === 'paused') {
        graph.element.pause()
      } else if (state.state === 'playing') {
        if (getAudioContext().state === 'suspended') {
          getAudioContext().resume()
        }
        graph.element.play().catch((e) => {
          if (e?.name === 'AbortError') return
          console.error('[audio] Play failed:', e)
        })
      }
    })

    const cleanupSeekTo = window.tplayerAPI.player.onSeekTo?.((data: SeekPayload) => {
      const graph = ensureAudioGraph()
      graph.element.currentTime = data.time
      updatePlaybackStore(data.time, graph.element.duration)
    })

    const handleLocalSeek = (event: LocalSeekEvent) => {
      const time = event.detail?.time
      if (!Number.isFinite(time)) return

      const graph = ensureAudioGraph()
      try {
        graph.element.currentTime = Math.max(0, time as number)
        updatePlaybackStore(graph.element.currentTime, graph.element.duration)
        syncPlaybackRuntime(true)
      } catch (err) {
        window.tplayerAPI.system.log?.('[audio] Local seek failed:', err)
      }
    }

    window.addEventListener('tplayer:local-seek', handleLocalSeek)

    return () => {
      cleanupLoad()
      cleanupState()
      cleanupSeekTo?.()
      window.removeEventListener('tplayer:local-seek', handleLocalSeek)
    }
  }, [])

  return {}
}
