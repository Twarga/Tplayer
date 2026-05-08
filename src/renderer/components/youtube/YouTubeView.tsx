import { useState } from 'react'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, X, FolderOpen, Clock, Zap, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

export function YouTubeView() {
  const { searchResults, isSearching, downloads, search, download, cancelDownload, clearHistory } = useYouTubeStore()
  const [query, setQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    await search(query.trim())
  }

  const handleDownloadUrl = async () => {
    if (!urlInput.trim()) return
    const url = urlInput.trim()
    const videoId = extractVideoId(url)
    if (videoId) {
      await download(url, videoId)
      setUrlInput('')
    }
  }

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-6">YouTube Import</h1>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="flex gap-3 mb-8">
        <Input
          placeholder="Paste YouTube URL to download..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDownloadUrl()}
          className="flex-1"
        />
        <Button onClick={handleDownloadUrl} variant="outline">
          <Download size={16} className="mr-2" />
          Download
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-primary mb-4">Search Results</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {searchResults.map((result) => (
              <div key={result.videoId} className="bg-surface-1 rounded-lg overflow-hidden hover:bg-surface-2 transition-colors group">
                <div className="aspect-video bg-surface-2 relative">
                  {result.thumbnail ? (
                    <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-3 flex items-center justify-center text-tertiary">
                      No thumbnail
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {result.duration}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-primary line-clamp-2 mb-1">{result.title}</p>
                  <p className="text-xs text-secondary mb-3">{result.channel}</p>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => download(`https://youtube.com/watch?v=${result.videoId}`, result.videoId, result.title)}
                  >
                    <Download size={14} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {downloads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Downloads</h2>
            <button onClick={clearHistory} className="text-xs text-tertiary hover:text-primary">
              Clear history
            </button>
          </div>
          <div className="space-y-2">
            {downloads.map((item) => (
              <div key={item.id} className="bg-surface-1 rounded-md p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                        item.status === 'done' ? "bg-green-500/20 text-green-400" :
                        item.status === 'failed' ? "bg-red-500/20 text-red-400" :
                        "bg-accent/20 text-accent"
                      )}>
                        {item.status}
                      </span>
                      {item.size && (
                        <span className="text-[10px] text-tertiary flex items-center gap-1">
                          <HardDrive size={10} />
                          {item.size}
                        </span>
                      )}
                      {item.speed && (
                        <span className="text-[10px] text-tertiary flex items-center gap-1">
                          <Zap size={10} />
                          {item.speed}
                        </span>
                      )}
                      {item.eta && (
                        <span className="text-[10px] text-tertiary flex items-center gap-1">
                          <Clock size={10} />
                          {item.eta}
                        </span>
                      )}
                    </div>
                    {item.folder && (
                      <p className="text-[10px] text-tertiary mt-1 flex items-center gap-1">
                        <FolderOpen size={10} />
                        {item.folder}
                      </p>
                    )}
                  </div>

                  {item.status === 'downloading' && (
                    <button
                      onClick={() => cancelDownload(item.videoId)}
                      className="text-tertiary hover:text-red-400 transition-colors"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {(item.status === 'downloading' || item.status === 'pending') && (
                  <div className="w-full">
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-tertiary">{Math.round(item.progress)}%</span>
                      {item.speed && <span className="text-[10px] text-tertiary">{item.speed}</span>}
                    </div>
                  </div>
                )}

                {item.status === 'done' && item.path && (
                  <p className="text-[10px] text-accent mt-2 truncate">{item.path}</p>
                )}

                {item.status === 'failed' && item.error && (
                  <p className="text-[10px] text-red-400 mt-2">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
