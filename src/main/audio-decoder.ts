import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'
import fs from 'fs'

export interface DecodedAudio {
  pcmData: Float32Array
  sampleRate: number
  channels: number
  duration: number
}

const _cache = new Map<string, { data: Float32Array; mtime: number }>()

export function clearDecodeCache(): void {
  _cache.clear()
}

export function decodeAudioFile(filePath: string): Promise<DecodedAudio> {
  return new Promise((resolve, reject) => {
    const stat = fs.statSync(filePath)
    const cacheKey = `${filePath}:${stat.mtimeMs}`
    const cached = _cache.get(cacheKey)
    if (cached) {
      resolve({ pcmData: cached.data, sampleRate: 44100, channels: 2, duration: cached.data.length / 44100 / 2 })
      return
    }

    const chunks: Buffer[] = []

    const stream: Readable = ffmpeg(filePath)
      .audioCodec('pcm_f32le')
      .format('f32le')
      .audioChannels(2)
      .audioFrequency(44100)
      .noVideo()
      .on('error', (err: Error) => {
        reject(new Error(`FFmpeg error: ${err.message}`))
      })
      .on('end', () => {
        if (chunks.length === 0) {
          reject(new Error('No audio data decoded'))
          return
        }

        const buf = Buffer.concat(chunks)
        const sampleCount = Math.floor(buf.length / 4)
        const pcmData = new Float32Array(sampleCount)

        for (let i = 0; i < sampleCount; i++) {
          pcmData[i] = buf.readFloatLE(i * 4)
        }

        _cache.set(cacheKey, { data: pcmData, mtime: stat.mtimeMs })

        resolve({
          pcmData,
          sampleRate: 44100,
          channels: 2,
          duration: sampleCount / 44100 / 2,
        })
      })
      .pipe() as Readable

    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('error', (err: Error) => reject(new Error(`Stream error: ${err.message}`)))
  })
}

export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: { format?: { duration?: number } }) => {
      if (err) reject(err)
      else resolve(metadata.format?.duration ?? 0)
    })
  })
}

export function isFFmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err: Error | null) => {
      resolve(!err)
    })
  })
}
