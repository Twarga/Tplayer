import { Download, Check, X, RefreshCw, Clock3 } from 'lucide-react'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { cn } from '@/lib/utils'

export function DownloadsView() {
  const { downloads, clearHistory, cancelDownload } = useYouTubeStore()

  return (
    <div className="p-6 overflow-y-auto h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">Downloads</h1>
        <button onClick={clearHistory} className="p-2 text-tertiary hover:text-primary transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>
      
      {downloads.length === 0 ? (
        <div className="text-center py-16">
          <Download size={48} className="mx-auto text-tertiary mb-4 opacity-50" />
          <p className="text-lg text-secondary mb-2">No downloads yet</p>
          <p className="text-sm text-tertiary">Go to YouTube Import to start downloading music.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map((d) => (
            <div key={d.id} className="flex items-center gap-4 p-4 rounded-lg bg-surface-1 hover:bg-surface-2 transition-colors border border-border-subtle">
              <div className="w-10 h-10 rounded bg-surface-3 flex items-center justify-center shrink-0">
                {d.status === 'done' ? <Check size={20} className="text-green-500" /> :
                 d.status === 'cancelled' ? <Clock3 size={20} className="text-yellow-400" /> :
                 d.status === 'failed' ? <X size={20} className="text-red-500" /> :
                 <Download size={20} className="text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{d.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'text-xs',
                    d.status === 'done' ? 'text-green-400' :
                    d.status === 'cancelled' ? 'text-yellow-300' :
                    d.status === 'failed' ? 'text-red-400' :
                    'text-secondary'
                  )}>{d.status}</span>
                  {d.status === 'downloading' && (
                    <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden max-w-[200px]">
                      <div className="h-full bg-accent transition-all" style={{ width: `${d.progress}%` }} />
                    </div>
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
          ))}
        </div>
      )}
    </div>
  )
}
