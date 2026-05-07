import { useEffect, useRef } from 'react'

let audioContext: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

export function useAudioPlayer() {
  const isPlayingRef = useRef(false)

  useEffect(() => {
    // Listen for audio data from main process
    const cleanup = window.tplayerAPI.player.onLoad((data: { 
      pcmData: Float32Array
      sampleRate: number
      channels: number
      duration: number
    }) => {
      playPCM(data.pcmData, data.sampleRate, data.channels)
    })

    const cleanupPause = window.tplayerAPI.player.onPlaybackState((state: { state: string }) => {
      if (state.state === 'paused') {
        pauseAudio()
      } else if (state.state === 'playing') {
        resumeAudio()
      }
    })

    return () => {
      cleanup()
      cleanupPause()
    }
  }, [])

  const playPCM = (pcmData: Float32Array, sampleRate: number, channels: number) => {
    const ctx = getAudioContext()
    
    // Stop current playback
    if (currentSource) {
      try { currentSource.stop() } catch {}
      currentSource = null
    }

    // Create audio buffer
    const frameCount = pcmData.length / channels
    const audioBuffer = ctx.createBuffer(channels, frameCount, sampleRate)
    
    for (let ch = 0; ch < channels; ch++) {
      const channelData = audioBuffer.getChannelData(ch)
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = pcmData[i * channels + ch] || 0
      }
    }

    // Create source and connect
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    
    if (!gainNode) {
      gainNode = ctx.createGain()
      gainNode.connect(ctx.destination)
    }
    
    source.connect(gainNode)
    source.start()
    currentSource = source
    isPlayingRef.current = true

    source.onended = () => {
      isPlayingRef.current = false
      window.tplayerAPI.player.next()
    }
  }

  const pauseAudio = () => {
    if (audioContext?.state === 'running') {
      audioContext.suspend()
    }
  }

  const resumeAudio = () => {
    if (audioContext?.state === 'suspended') {
      audioContext.resume()
    }
  }

  const setVolume = (volume: number) => {
    if (gainNode) {
      gainNode.gain.value = volume
    }
  }

  return { playPCM, pauseAudio, resumeAudio, setVolume }
}