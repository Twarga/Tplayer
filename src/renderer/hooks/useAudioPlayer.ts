import { useRef, useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'

let audioContext: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let eqNodes: BiquadFilterNode[] = []

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export function useAudioPlayer() {
  const { volume, isPlaying } = usePlayerStore()

  // Sync volume to gain node whenever it changes
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.setTargetAtTime(volume, getAudioContext().currentTime, 0.1)
    }
  }, [volume])

  useEffect(() => {
    // Listen for audio data from main process
    const cleanupLoad = window.tplayerAPI.player.onLoad((data: { 
      pcmData: Float32Array
      sampleRate: number
      channels: number
      duration: number
    }) => {
      playPCM(data.pcmData, data.sampleRate, data.channels)
    })

    const cleanupState = window.tplayerAPI.player.onPlaybackState((state: { state: string }) => {
      if (state.state === 'paused') {
        getAudioContext().suspend()
      } else if (state.state === 'playing') {
        getAudioContext().resume()
      }
    })

    return () => {
      cleanupLoad()
      cleanupState()
    }
  }, [])

  const playPCM = (pcmData: Float32Array, sampleRate: number, channels: number) => {
    const ctx = getAudioContext()
    ctx.resume()
    
    // Stop current playback
    if (currentSource) {
      try { currentSource.stop() } catch {}
      currentSource = null
    }

    // Create audio buffer
    const frameCount = Math.floor(pcmData.length / channels)
    const audioBuffer = ctx.createBuffer(channels, frameCount, sampleRate)
    
    for (let ch = 0; ch < channels; ch++) {
      const channelData = audioBuffer.getChannelData(ch)
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = pcmData[i * channels + ch] || 0
      }
    }

    // Build audio chain: source → gain → destination
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    
    if (!gainNode) {
      gainNode = ctx.createGain()
      gainNode.gain.value = volume
      gainNode.connect(ctx.destination)
    }
    
    source.connect(gainNode)
    source.start()
    currentSource = source

    source.onended = () => {
      window.tplayerAPI.player.next()
    }
  }

  return { playPCM }
}