import React from 'react'
import { cn } from '@/lib/utils'

interface QualityBadgesProps {
  format?: string
  bitDepth?: number
  sampleRate?: number
  className?: string
}

const BADGE_LABELS: Record<string, string> = {
  FLAC: 'FLAC',
  ALAC: 'ALAC',
  WAV: 'WAV',
  AIFF: 'AIFF',
  AAC: 'AAC',
  MP3: 'MP3',
  OGG: 'OGG',
  OPUS: 'OPUS',
}

export function QualityBadges({ format, bitDepth, sampleRate, className }: QualityBadgesProps) {
  const badges: string[] = []

  if (format) {
    const label = BADGE_LABELS[format.toUpperCase()] || format.toUpperCase()
    badges.push(label)
  }

  if (bitDepth) {
    badges.push(`${bitDepth}-bit`)
  }

  if (sampleRate) {
    const kHz = sampleRate >= 1000 ? `${(sampleRate / 1000).toFixed(1)} kHz` : `${sampleRate} Hz`
    badges.push(kHz)
  }

  const isLossless = format && ['FLAC', 'ALAC', 'WAV', 'AIFF'].includes(format.toUpperCase())
  if (isLossless) {
    badges.push('Lossless')
  }

  return (
    <div className={cn('flex gap-2 flex-wrap', className)}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="px-2.5 py-1 text-[11px] font-semibold uppercase bg-surface-2 border border-border-default rounded-sm text-secondary"
        >
          {badge}
        </span>
      ))}
    </div>
  )
}