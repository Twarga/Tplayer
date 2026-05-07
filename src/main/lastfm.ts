import crypto from 'crypto'
import { getSetting, setSetting } from './database'

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'

interface LastFmConfig {
  apiKey: string
  secret: string
  sessionKey: string
}

function getConfig(): LastFmConfig {
  return {
    apiKey: getSetting('lastfm_api_key') || '',
    secret: getSetting('lastfm_secret') || '',
    sessionKey: getSetting('lastfm_session_key') || '',
  }
}

function md5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex')
}

async function lastFmRequest(params: Record<string, string>): Promise<unknown> {
  const { apiKey, sessionKey } = getConfig()
  const allParams = { ...params, api_key: apiKey, sk: sessionKey }

  const payload = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join('')

  const sig = md5(payload + getConfig().secret)
  const body = new URLSearchParams({ ...allParams, api_sig: sig })

  const response = await fetch(LASTFM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  return response.json()
}

export async function auth(apiKey: string, secret: string): Promise<string> {
  const config = getConfig()
  config.apiKey = apiKey
  config.secret = secret

  setSetting('lastfm_api_key', apiKey)
  setSetting('lastfm_secret', secret)

  return ''
}

export function isAuthd(): boolean {
  const { sessionKey } = getConfig()
  return sessionKey.length > 0
}

export function disconnect(): void {
  setSetting('lastfm_session_key', '')
  setSetting('lastfm_api_key', '')
  setSetting('lastfm_secret', '')
}

export async function updateNowPlaying(artist: string, track: string, album?: string): Promise<void> {
  if (!isAuthd()) return

  const params: Record<string, string> = {
    method: 'track.updateNowPlaying',
    artist,
    track,
  }
  if (album) params.album = album

  try {
    await lastFmRequest(params)
  } catch {
    // silently fail
  }
}

let _scrobbleQueue: Array<{ artist: string; track: string; album?: string; timestamp: number }> = []
let _retryCount = 0
const MAX_RETRIES = 3

export async function scrobble(artist: string, track: string, album?: string, timestamp?: number): Promise<void> {
  if (!isAuthd()) return

  const ts = timestamp || Math.floor(Date.now() / 1000)
  const entry = { artist, track, album, timestamp: ts }

  try {
    const result = await lastFmRequest({
      method: 'track.scrobble',
      artist,
      track,
      timestamp: ts.toString(),
      ...(album ? { album } : {}),
    }) as { scrobbles?: { scrobble: { correct?: string } } }

    if ((result as Record<string, unknown>)?.[''] === 'ok') {
      _retryCount = 0
      return
    }

    _scrobbleQueue.push(entry)
    await retryScrobbles()
  } catch {
    _scrobbleQueue.push(entry)
  }
}

async function retryScrobbles(): Promise<void> {
  if (_retryCount >= MAX_RETRIES || _scrobbleQueue.length === 0) {
    _scrobbleQueue = []
    _retryCount = 0
    return
  }

  _retryCount++
  await new Promise((r) => setTimeout(r, 2000 * _retryCount))
}

export function getQueueLength(): number {
  return _scrobbleQueue.length
}