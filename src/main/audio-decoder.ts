import ffmpeg from 'fluent-ffmpeg'

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
    const chunks: Buffer[] = []

    const cmd = ffmpeg(filePath)
      .format('f32le')
      .audioChannels(2)
      .audioFrequency(44100)
      .noVideo()

    cmd.on('error', (err: Error) => {
      reject(new Error(`FFmpeg error: ${err.message}`))
    })

    cmd.on('end', () => {
      if (chunks.length === 0) {
        reject(new Error('No audio data'))
        return
      }

      const buf = Buffer.concat(chunks)
      const sampleCount = Math.floor(buf.length / 4)
      const pcmData = new Float32Array(sampleCount)

      for (let i = 0; i < sampleCount; i++) {
        pcmData[i] = buf.readFloatLE(i * 4)
      }

      resolve({
        pcmData,
        sampleRate: 44100,
        channels: 2,
        duration: sampleCount / 44100 / 2,
      })
    })

    cmd.on('data', (chunk: Buffer) => chunks.push(chunk))

    cmd.run()
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