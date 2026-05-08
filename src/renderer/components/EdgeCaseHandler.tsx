import React, { useState, useEffect } from 'react'

interface EdgeCaseHandlerProps {
  children?: React.ReactNode
}

export function EdgeCaseHandler({ children }: EdgeCaseHandlerProps) {
  const [ffmpegError, setFfmpegError] = useState(false)
  const [ytDlpError, setYtDlpError] = useState(false)

  useEffect(() => {
    window.tplayerAPI.system.checkFfmpeg().then((available) => {
      if (!available) setFfmpegError(true)
    }).catch(() => {})

    window.tplayerAPI.system.checkYtDlp().then((status) => {
      if (!status.available) setYtDlpError(true)
    }).catch(() => {})
  }, [])

  return (
    <>
      {ffmpegError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl text-sm">
          FFmpeg not found. Install with: <code className="bg-black/20 px-2 py-0.5 rounded">sudo apt install ffmpeg</code>
          <button onClick={() => setFfmpegError(false)} className="ml-4 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {ytDlpError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl text-sm">
          yt-dlp not found. Install with: <code className="bg-black/20 px-2 py-0.5 rounded">pip install yt-dlp</code>
          <button onClick={() => setYtDlpError(false)} className="ml-4 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {children}
    </>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-surface-2 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-tertiary">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-secondary mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  )
}

export function LoadingSkeleton({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-12 bg-surface-1 rounded-md animate-pulse" />
      ))}
    </div>
  )
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center justify-between mb-4">
      <span className="text-sm text-red-400">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-400 hover:text-red-300 font-medium underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}
