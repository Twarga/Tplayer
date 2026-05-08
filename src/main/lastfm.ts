import crypto from 'crypto'
import { shell } from 'electron'
import { getSetting, setSetting } from './database'

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'
const LASTFM_AUTH = 'https://www.last.fm/api/auth/'
const AUTH_TIMEOUT_MS = 2 * 60 * 1000
const AUTH_POLL_MS = 3000

interface LastFmConfig {
  apiKey: string
  secret: string
  sessionKey: string
  username: string
}

function getConfig(): LastFmConfig {
  return {
    apiKey: getSetting('lastfm_api_key') || '',
    secret: getSetting('lastfm_secret') || '',
    sessionKey: getSetting('lastfm_session_key') || '',
    username: getSetting('lastfm_username') || '',
  }
}

function md5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex')
}

async function lastFmRequest(params: Record<string, string>): Promise<unknown> {
  const { apiKey, sessionKey } = getConfig()
  const allParams = { ...params, api_key: apiKey, sk: sessionKey }
  return signedRequest(allParams)
}

async function signedRequest(allParams: Record<string, string>): Promise<unknown> {
  const { secret } = getConfig()
  if (!secret) {
    throw new Error('Last.fm secret is not configured')
  }

  const payload = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join('')

  const sig = md5(payload + secret)
  const body = new URLSearchParams({ ...allParams, api_sig: sig, format: 'json' })

  const response = await fetch(LASTFM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const json = await response.json() as Record<string, unknown>
  if (!response.ok || json.error) {
    throw new Error(String(json.message || `Last.fm request failed with status ${response.status}`))
  }
  return json
}

export async function auth(apiKey: string, secret: string): Promise<string> {
  if (!apiKey.trim() || !secret.trim()) {
    throw new Error('Last.fm API key and shared secret are required')
  }

  setSetting('lastfm_api_key', apiKey.trim())
  setSetting('lastfm_secret', secret.trim())

  const tokenResponse = await signedRequest({
    method: 'auth.getToken',
    api_key: apiKey.trim(),
  }) as { token?: string }

  const token = tokenResponse.token
  if (!token) {
    throw new Error('Last.fm did not return an auth token')
  }

  await shell.openExternal(`${LASTFM_AUTH}?api_key=${encodeURIComponent(apiKey.trim())}&token=${encodeURIComponent(token)}`)

  const startedAt = Date.now()
  while (Date.now() - startedAt < AUTH_TIMEOUT_MS) {
    try {
      const sessionResponse = await signedRequest({
        method: 'auth.getSession',
        api_key: apiKey.trim(),
        token,
      }) as { session?: { key?: string; name?: string } }

      const sessionKey = sessionResponse.session?.key
      if (sessionKey) {
        setSetting('lastfm_session_key', sessionKey)
        setSetting('lastfm_username', sessionResponse.session?.name || '')
        return sessionResponse.session?.name || ''
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Last.fm auth failed'
      if (!message.toLowerCase().includes('unauthorized') && !message.toLowerCase().includes('token')) {
        throw error
      }
    }

    await new Promise((resolve) => setTimeout(resolve, AUTH_POLL_MS))
  }

  throw new Error('Last.fm authorization timed out before approval was completed')
}

export function isAuthd(): boolean {
  const { apiKey, secret, sessionKey } = getConfig()
  return apiKey.length > 0 && secret.length > 0 && sessionKey.length > 0
}

export function disconnect(): void {
  setSetting('lastfm_session_key', '')
  setSetting('lastfm_username', '')
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
