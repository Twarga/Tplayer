import { useEffect } from 'react'
import { Download, Check, X, RefreshCw, Clock3, AlertCircle, AudioLines } from 'lucide-react'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { cn } from '@/lib/utils'

export function DownloadsView() {
  const { downloads, isHistoryLoading, loadHistory, clearHistory, cancelDownload } = useYouTubeStore()

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const stats = {
    total: downloads.length,
    active: downloads.filter((d) => d.status === 'downloading' || d.status === 'pending').length,
    completed: downloads.filter((d) => d.status === 'done').length,
    failed: downloads.filter((d) => d.status === 'failed' || d.status === 'cancelled').length,
  }

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <section className="mb-7 border-y border-white/[0.065] py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              <AudioLines size={12} />
              Download History
            </div>
            <h1 className="max-w-4xl text-[clamp(2rem,4.8vw,4.8rem)] font-extrabold leading-[0.95] text-primary">
              Imports without clutter.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary">
              Completed, failed, and cancelled imports stay visible across restarts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => void loadHistory()} className="text-tertiary hover:text-accent transition-colors interactive-soft" title="Refresh history">
              <RefreshCw size={18} className={isHistoryLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={clearHistory} className="text-xs text-tertiary hover:text-primary transition-colors interactive-soft">
              Clear history
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-0 border-y border-white/[0.06] md:grid-cols-4">
          <HistoryStat label="All imports" value={stats.total} />
          <HistoryStat label="Active" value={stats.active} tone="accent" />
          <HistoryStat label="Completed" value={stats.completed} tone="success" />
          <HistoryStat label="Needs attention" value={stats.failed} tone="warning" />
        </div>
      </section>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-primary">Recent Activity</h2>
          <p className="text-sm text-secondary">A complete log of persisted imports, with live progress for anything still running.</p>
        </div>
      </div>

      {isHistoryLoading && downloads.length === 0 ? (
        <div className="border-y border-white/[0.06] p-12 text-center">
          <RefreshCw size={24} className="mx-auto text-accent animate-spin mb-4" />
          <p className="text-sm font-medium text-primary">Loading download history</p>
          <p className="text-xs text-tertiary mt-1">Reading persisted records from the local database.</p>
        </div>
      ) : downloads.length === 0 ? (
        <div className="border-y border-white/[0.06] text-center py-16">
          <Download size={48} className="mx-auto text-tertiary mb-4 opacity-50" />
          <p className="text-lg text-secondary mb-2">No downloads yet</p>
          <p className="text-sm text-tertiary">Go to YouTube Import to start downloading music.</p>
        </div>
      ) : (
        <div className="max-w-5xl divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {downloads.map((d) => (
            <div key={d.id} className="py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/[0.045] flex items-center justify-center shrink-0">
                {d.status === 'done' ? <Check size={20} className="text-green-500" /> :
                 d.status === 'cancelled' ? <Clock3 size={20} className="text-yellow-400" /> :
                 d.status === 'failed' ? <X size={20} className="text-red-500" /> :
                 <Download size={20} className="text-accent" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{d.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className={cn(
                          'text-[11px] font-semibold uppercase tracking-[0.18em]',
                          d.status === 'done' ? 'text-green-400' :
                          d.status === 'cancelled' ? 'text-yellow-300' :
                          d.status === 'failed' ? 'text-red-400' :
                          'text-accent'
                        )}>{d.status}</span>
                        {d.artist && <span className="text-xs text-secondary">{d.artist}</span>}
                        {d.createdAt && <span className="text-xs text-tertiary">{formatHistoryTime(d.createdAt)}</span>}
                        {typeof d.trackId === 'number' && d.status === 'done' && (
                          <span className="text-xs text-green-300">Added to library</span>
                        )}
                      </div>
                    </div>

                    {d.status === 'downloading' && (
                      <button
                        onClick={() => cancelDownload(d.videoId)}
                        className="p-2 text-tertiary hover:text-red-400 transition-colors"
                        title="Cancel download"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {(d.status === 'downloading' || d.status === 'pending') && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-tertiary mb-2">
                        <span>{Math.round(d.progress)}%</span>
                        <div className="flex items-center gap-3">
                          {d.size && <span>{d.size}</span>}
                          {d.speed && <span>{d.speed}</span>}
                          {d.eta && <span>ETA {d.eta}</span>}
                        </div>
                      </div>
                      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${d.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {(d.status === 'failed' || d.status === 'cancelled') && d.error && (
                    <div className="mt-3 flex items-start gap-2 border-l border-red-500/40 bg-red-500/10 px-3 py-2">
                      <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-300" />
                      <p className="text-xs text-red-300">{d.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'accent' | 'success' | 'warning'
}) {
  return (
    <div className="border-r border-white/[0.06] px-4 py-4 last:border-r-0">
      <p className="text-[11px] uppercase tracking-[0.18em] text-tertiary font-semibold">{label}</p>
      <p
        className={cn(
          'mt-2 text-2xl font-bold',
          tone === 'accent' ? 'text-accent' :
          tone === 'success' ? 'text-green-400' :
          tone === 'warning' ? 'text-yellow-300' :
          'text-primary'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function formatHistoryTime(value: string): string {
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
