import { useState, useEffect } from 'react'
import { Download, Check, X, RefreshCw } from 'lucide-react'
import { api } from '@/lib/ipc'
import type { Download as DownloadRecord } from '@/lib/types'

export function DownloadsView() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([])

  const loadDownloads = async () => {
    try {
      const data = await api.library.getDownloads()
      setDownloads(data || [])
    } catch (err) {
      console.error('Failed to load downloads', err)
    }
  }

  useEffect(() => {
    loadDownloads()
  }, [])

  return (
    <div className="p-6 overflow-y-auto h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-primary">Downloads</h1>
        <button onClick={loadDownloads} className="p-2 text-tertiary hover:text-primary transition-colors">
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
                 d.status === 'failed' ? <X size={20} className="text-red-500" /> :
                 <Download size={20} className="text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{d.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-secondary">{d.status}</span>
                  {d.status === 'downloading' && (
                    <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden max-w-[200px]">
                      <div className="h-full bg-accent transition-all" style={{ width: `${d.progress}%` }} />
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
