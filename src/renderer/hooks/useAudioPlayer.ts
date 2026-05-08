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

let audioElement: HTMLAudioElement | null = null
let mediaSourceNode: MediaElementAudioSourceNode | null = null
let gainNode: GainNode | null = null
let eqNodes: BiquadFilterNode[] | null = null
let lastProgressSyncAt = 0
let currentLoadToken = 0
let endedToken = -1
let playbackErrorToken = -1

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
  if (!audioElement) return

  const currentTime = audioElement.currentTime
  const duration = audioElement.duration

  updatePlaybackStore(currentTime, duration)

  if (force) {
    lastProgressSyncAt = 0
  }

  syncPlaybackProgress({ currentTime, duration })
}

function ensureAudioGraph() {
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.crossOrigin = 'anonymous'
    audioElement.preload = 'auto'
    
    const ctx = getAudioContext()
    mediaSourceNode = ctx.createMediaElementSource(audioElement)
    
    // Create EQ nodes
    eqNodes = EQ_FREQS.map((freq) => {
      const node = ctx.createBiquadFilter()
      node.type = 'peaking'
      node.frequency.value = freq
      node.Q.value = 1.0
      node.gain.value = 0
      return node
    })
    
    // Create Gain node
    gainNode = ctx.createGain()
    gainNode.gain.value = 1.0
    gainNode.connect(ctx.destination)
    
    // Connect chain: source -> eq[0] -> ... -> eq[N] -> gain -> destination
    mediaSourceNode.connect(eqNodes[0])
    for (let i = 0; i < eqNodes.length - 1; i++) {
      eqNodes[i].connect(eqNodes[i + 1])
    }
    eqNodes[eqNodes.length - 1].connect(gainNode)
    
    let playRecorded = false

    audioElement.addEventListener('play', () => {
      playRecorded = false
      usePlayerStore.setState({ isPlaying: true, playbackState: 'playing' })
    })

    audioElement.addEventListener('pause', () => {
      if (!audioElement?.ended) {
        usePlayerStore.setState({ isPlaying: false, playbackState: 'paused' })
      }
    })

    audioElement.addEventListener('loadedmetadata', () => {
      syncPlaybackRuntime(true)
    })

    audioElement.addEventListener('durationchange', () => {
      syncPlaybackRuntime(true)
    })

    audioElement.addEventListener('seeked', () => {
      syncPlaybackRuntime(true)
    })

    audioElement.addEventListener('timeupdate', () => {
      if (!audioElement) return
      
      const currentTime = audioElement.currentTime
      const duration = audioElement.duration
      
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
    
    audioElement.addEventListener('ended', () => {
      if (endedToken === currentLoadToken) return
      endedToken = currentLoadToken
      syncPlaybackRuntime(true)
      window.tplayerAPI.player.trackEnded()
    })

    audioElement.addEventListener('error', () => {
      if (playbackErrorToken === currentLoadToken) return
      playbackErrorToken = currentLoadToken
      const errorStr = audioElement?.error?.message || 'Unknown decode error'
      getToastStore().add(`Failed to play track: ${errorStr}`, 'error')
      usePlayerStore.setState({ isPlaying: false, playbackState: 'error' })
    })
  }
}

function updateEqGains(bands: number[], enabled: boolean): void {
  if (!eqNodes) return
  for (let i = 0; i < eqNodes.length; i++) {
    eqNodes[i].gain.setTargetAtTime(enabled ? (bands[i] ?? 0) : 0, getAudioContext().currentTime, 0.05)
  }
}

export function useAudioPlayer() {
  const { volume } = usePlayerStore()
  const bands = useEqStore((s) => s.bands)
  const isEnabled = useEqStore((s) => s.isEnabled)

  useEffect(() => {
    ensureAudioGraph()
    if (gainNode) {
      gainNode.gain.setTargetAtTime(volume, getAudioContext().currentTime, 0.1)
    }
  }, [volume])

  useEffect(() => {
    ensureAudioGraph()
    updateEqGains(bands, isEnabled)
  }, [bands, isEnabled])

  useEffect(() => {
    ensureAudioGraph()

    const cleanupLoad = window.tplayerAPI.player.onLoad((data: TrackLoadPayload) => {
      currentLoadToken += 1
      endedToken = -1
      playbackErrorToken = -1
      window.tplayerAPI.system.log?.('onLoad triggered', data)
      if (data.url && audioElement) {
        window.tplayerAPI.system.log?.('setting src and playing')
        if (getAudioContext().state === 'suspended') {
          getAudioContext().resume().then(() => window.tplayerAPI.system.log?.('AudioContext resumed')).catch(e => window.tplayerAPI.system.log?.('Resume error:', e))
        }
        audioElement.pause()
        audioElement.src = data.url
        audioElement.currentTime = data.startTime || 0
        audioElement.load()
        updatePlaybackStore(data.startTime || 0, data.duration)
        audioElement.play()
          .then(() => window.tplayerAPI.system.log?.('Play successful'))
          .catch(e => {
            if (e?.name === 'AbortError') return
            window.tplayerAPI.system.log?.('[audio] Play failed:', e.message)
          })
      } else {
        window.tplayerAPI.system.log?.('Missing url or audioElement', { hasUrl: !!data.url, hasElement: !!audioElement })
      }
    })

    const cleanupState = window.tplayerAPI.player.onPlaybackState((state: PlaybackStatePayload) => {
      if (state.state === 'paused') {
        audioElement?.pause()
      } else if (state.state === 'playing') {
        if (getAudioContext().state === 'suspended') {
          getAudioContext().resume()
        }
        audioElement?.play().catch(e => console.error('[audio] Play failed:', e))
      }
    })
    
    const cleanupSeekTo = window.tplayerAPI.player.onSeekTo?.((data: SeekPayload) => {
       if (audioElement) {
         audioElement.currentTime = data.time
         updatePlaybackStore(data.time, audioElement.duration)
       }
    })

    return () => {
      cleanupLoad()
      cleanupState()
      cleanupSeekTo?.()
    }
  }, [])

  return {}
}
