import crypto from 'crypto'
import { shell } from 'electron'
import { getSetting, setSetting } from './database'

const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/'
const LASTFM_AUTH = 'https://www.last.fm/api/auth/'
const AUTH_TIMEOUT_MS = 2 * 60 * 1000
const AUTH_POLL_MS = 3000
const MAX_RETRY_ATTEMPTS = 5
const RETRY_BASE_DELAY_MS = 5_000
const RETRY_MAX_DELAY_MS = 60_000

interface LastFmConfig {
  apiKey: string
  secret: string
  sessionKey: string
  username: string
}

interface ScrobbleQueueEntry {
  artist: string
  track: string
  album?: string
  timestamp: number
  attempts: number
  nextRetryAt: number
  lastError?: string
}

class LastFmRequestError extends Error {
  recoverable: boolean

  constructor(message: string, recoverable: boolean) {
    super(message)
    this.name = 'LastFmRequestError'
    this.recoverable = recoverable
  }
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
    throw new LastFmRequestError('Last.fm secret is not configured', false)
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
    const errorCode = typeof json.error === 'number' ? json.error : Number(json.error)
    const message = String(json.message || `Last.fm request failed with status ${response.status}`)
    const recoverable =
      response.status >= 500 ||
      response.status === 429 ||
      errorCode === 11 ||
      errorCode === 16 ||
      errorCode === 26 ||
      /network|timeout|temporar|rate limit|unavailable/i.test(message)

    throw new LastFmRequestError(message, recoverable)
  }
  return json
}

function isRecoverableLastFmError(error: unknown): boolean {
  if (error instanceof LastFmRequestError) {
    return error.recoverable
  }

  const message = error instanceof Error ? error.message : String(error)
  return /network|fetch|timeout|temporar|rate limit|unavailable/i.test(message)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
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
        if (_scrobbleQueue.length > 0) {
          void retryQueuedScrobbles()
        }
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
  _scrobbleQueue = []
  if (_retryTimer) {
    clearTimeout(_retryTimer)
    _retryTimer = null
  }
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
    if (_scrobbleQueue.length > 0) {
      void retryQueuedScrobbles()
    }
  } catch {
    // silently fail
  }
}

let _scrobbleQueue: ScrobbleQueueEntry[] = []
let _retryTimer: NodeJS.Timeout | null = null

function queueKey(entry: Pick<ScrobbleQueueEntry, 'artist' | 'track' | 'timestamp'>): string {
  return `${entry.artist}::${entry.track}::${entry.timestamp}`
}

function scheduleRetryProcessing(): void {
  if (_retryTimer || _scrobbleQueue.length === 0) return

  const nextRetryAt = Math.min(..._scrobbleQueue.map((entry) => entry.nextRetryAt))
  const delay = Math.max(0, nextRetryAt - Date.now())
  _retryTimer = setTimeout(() => {
    _retryTimer = null
    void retryQueuedScrobbles()
  }, delay)
}

function enqueueScrobbleRetry(entry: Pick<ScrobbleQueueEntry, 'artist' | 'track' | 'album' | 'timestamp'>, error: unknown): void {
  const lastError = getErrorMessage(error)
  const existing = _scrobbleQueue.find((item) => queueKey(item) === queueKey(entry))
  if (existing) {
    existing.lastError = lastError
    existing.nextRetryAt = Math.min(existing.nextRetryAt, Date.now() + RETRY_BASE_DELAY_MS)
    scheduleRetryProcessing()
    return
  }

  _scrobbleQueue.push({
    ...entry,
    attempts: 0,
    nextRetryAt: Date.now() + RETRY_BASE_DELAY_MS,
    lastError,
  })
  scheduleRetryProcessing()
}

async function submitScrobble(entry: Pick<ScrobbleQueueEntry, 'artist' | 'track' | 'album' | 'timestamp'>): Promise<void> {
  await lastFmRequest({
    method: 'track.scrobble',
    artist: entry.artist,
    track: entry.track,
    timestamp: entry.timestamp.toString(),
    ...(entry.album ? { album: entry.album } : {}),
  })
}

async function retryQueuedScrobbles(): Promise<void> {
  if (!isAuthd() || _scrobbleQueue.length === 0) return

  const now = Date.now()
  const dueEntries = _scrobbleQueue.filter((entry) => entry.nextRetryAt <= now)
  if (dueEntries.length === 0) {
    scheduleRetryProcessing()
    return
  }

  for (const entry of dueEntries) {
    try {
      await submitScrobble(entry)
      _scrobbleQueue = _scrobbleQueue.filter((item) => queueKey(item) !== queueKey(entry))
    } catch (error) {
      entry.attempts += 1
      entry.lastError = getErrorMessage(error)

      if (!isRecoverableLastFmError(error) || entry.attempts >= MAX_RETRY_ATTEMPTS) {
        _scrobbleQueue = _scrobbleQueue.filter((item) => queueKey(item) !== queueKey(entry))
        continue
      }

      const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** (entry.attempts - 1), RETRY_MAX_DELAY_MS)
      entry.nextRetryAt = Date.now() + delay
    }
  }

  scheduleRetryProcessing()
}

export async function scrobble(artist: string, track: string, album?: string, timestamp?: number): Promise<void> {
  if (!isAuthd()) return

  const ts = timestamp || Math.floor(Date.now() / 1000)
  const entry = { artist, track, album, timestamp: ts }

  try {
    await submitScrobble(entry)
    if (_scrobbleQueue.length > 0) {
      void retryQueuedScrobbles()
    }
    return
  } catch (error) {
    if (isRecoverableLastFmError(error)) {
      enqueueScrobbleRetry(entry, error)
      return
    }

    throw error
  }
}

export function getQueueLength(): number {
  return _scrobbleQueue.length
}
