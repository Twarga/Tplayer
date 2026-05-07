import { useEffect, useState } from 'react'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function YouTubeView() {
  const { searchResults, isSearching, downloads, search, download, init, clearHistory } = useYouTubeStore()
  const [query, setQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')

  useEffect(() => { init() }, [])

  const handleSearch = async () => {
    if (!query.trim()) return
    await search(query.trim())
  }

  const handleDownload = async () => {
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
    <div className="p-6 overflow-y-auto h-full">
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
          onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
          className="flex-1"
        />
        <Button onClick={handleDownload} variant="outline">
          Download
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-primary mb-4">Search Results</h2>
          <div className="grid grid-cols-3 gap-4">
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
                    onClick={() => download(`https://youtube.com/watch?v=${result.videoId}`, result.videoId)}
                  >
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
              <div key={item.id} className="bg-surface-1 rounded-md p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{item.title}</p>
                  <p className="text-xs text-secondary capitalize">{item.status}</p>
                </div>
                {item.status === 'downloading' && (
                  <div className="w-32">
                    <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-tertiary text-right mt-1">{Math.round(item.progress)}%</p>
                  </div>
                )}
                {item.status === 'done' && <span className="text-xs text-accent">Done</span>}
                {item.status === 'failed' && <span className="text-xs text-red-500">{item.error || 'Failed'}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}