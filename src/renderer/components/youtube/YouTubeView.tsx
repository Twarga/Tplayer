import { useState } from 'react'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FolderOpen,
  HardDrive,
  Loader2,
  Search,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function YouTubeView() {
  const {
    searchResults,
    isSearching,
    searchError,
    hasSearched,
    lastQuery,
    downloads,
    search,
    download,
    cancelDownload,
    clearHistory,
  } = useYouTubeStore()

  const [query, setQuery] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  const handleSearch = async () => {
    await search(query)
  }

  const handleDownloadUrl = async () => {
    if (!query.trim()) {
      setUrlError(null)
      return
    }

    const url = query.trim()
    const target = extractYouTubeTarget(url)
    if (!target) {
      setUrlError('Paste a valid YouTube video, short, embed, or playlist URL.')
      return
    }

    setUrlError(null)
    await download(url, target.id, target.title)
    setQuery('')
  }

  const downloadByVideoId = new Map(downloads.map((item) => [item.videoId, item]))
  const firstResult = searchResults[0]
  const secondaryResults = searchResults.slice(1)

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <section className="mb-6 border-b border-white/[0.06] pb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">YouTube Import</p>
            <p className="mt-1 text-sm text-secondary">
              Search by title, artist, or paste a YouTube link.
            </p>
          </div>
          {downloads.length > 0 && (
            <p className="text-xs uppercase tracking-[0.18em] text-tertiary">{downloads.length} imports</p>
          )}
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Search YouTube or paste a URL"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (urlError) setUrlError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && (extractYouTubeTarget(query.trim()) ? handleDownloadUrl() : handleSearch())}
            className="flex-1 rounded-full bg-[#151018]/85 border-white/[0.11]"
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="min-w-[112px]">
            {isSearching ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
            Search
          </Button>
          <Button onClick={handleDownloadUrl} variant="outline" disabled={!extractYouTubeTarget(query.trim())}>
            <Download size={16} className="mr-2" />
            Import URL
          </Button>
        </div>
        {(searchError || urlError) && (
          <div className="mt-4 border-l border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{searchError || urlError}</span>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        {isSearching ? (
          <div className="border-y border-white/[0.06] py-8">
            <Loader2 size={22} className="animate-spin text-accent mb-3" />
            <p className="text-sm font-medium text-primary">Searching YouTube</p>
            <p className="text-xs text-tertiary mt-1">Fetching results from yt-dlp.</p>
          </div>
        ) : firstResult ? (
          <>
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.18em] text-tertiary">
                {lastQuery ? `Results for "${lastQuery}"` : 'Search results'}
              </p>
            </div>

            <FeaturedResult
              result={firstResult}
              downloadItem={downloadByVideoId.get(firstResult.videoId)}
              onDownload={() => download(`https://youtube.com/watch?v=${firstResult.videoId}`, firstResult.videoId, firstResult.title)}
            />

            {secondaryResults.length > 0 && (
              <div className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {secondaryResults.map((result) => {
                  const downloadItem = downloadByVideoId.get(result.videoId)
                  return (
                    <ResultRow
                      key={result.videoId}
                      result={result}
                      downloadItem={downloadItem}
                      onDownload={() => download(`https://youtube.com/watch?v=${result.videoId}`, result.videoId, result.title)}
                    />
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="border-y border-dashed border-white/[0.12] py-10">
            <p className="text-sm font-semibold text-primary">
              {hasSearched ? 'No results matched that search.' : 'Ready to import.'}
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-secondary">
              {hasSearched
                ? 'Try a cleaner artist and title, or paste the exact YouTube URL.'
                : 'Search for music, paste a video URL, or paste a playlist URL to bring it into your local library.'}
            </p>
          </div>
        )}
      </section>

      {downloads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-tertiary">Download Activity</p>
            <button onClick={clearHistory} className="text-xs text-tertiary hover:text-primary interactive-soft">
              Clear history
            </button>
          </div>

          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {downloads.map((item) => (
              <div key={item.id} className="py-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={cn(
                          'text-[10px] uppercase font-bold tracking-wider',
                          item.status === 'done'
                            ? 'text-green-400'
                            : item.status === 'cancelled'
                              ? 'text-yellow-300'
                            : item.status === 'failed'
                              ? 'text-red-400'
                              : 'text-accent'
                        )}
                      >
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
                    <div className="h-[3px] bg-white/16 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
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

                {(item.status === 'failed' || item.status === 'cancelled') && item.error && (
                  <p className="text-[10px] text-red-400 mt-2">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function FeaturedResult({
  result,
  downloadItem,
  onDownload,
}: {
  result: {
    videoId: string
    title: string
    channel: string
    duration: string
    thumbnail?: string
  }
  downloadItem?: {
    status: string
  }
  onDownload: () => void
}) {
  const isActive = downloadItem?.status === 'downloading'
  const isDone = downloadItem?.status === 'done'

  return (
    <div className="grid gap-5 border-y border-white/[0.06] py-5 md:grid-cols-[minmax(220px,0.38fr)_minmax(0,1fr)]">
      <div className="aspect-video overflow-hidden bg-white/[0.04]">
        {result.thumbnail ? (
          <img src={result.thumbnail} alt={result.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-tertiary">No thumbnail</div>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-between">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-accent">Best match</p>
          <h2 className="line-clamp-3 text-2xl font-bold leading-tight text-primary">{result.title}</h2>
          <p className="mt-2 text-sm text-secondary">{result.channel}</p>
          <p className="mt-1 text-xs text-tertiary">{result.duration}</p>
        </div>
        <button
          onClick={onDownload}
          disabled={isActive}
          className={cn(
            'mt-5 inline-flex w-fit items-center gap-2 border-b px-1 pb-1 text-sm font-semibold interactive-soft',
            isDone ? 'border-green-400 text-green-300' : 'border-accent text-accent hover:text-primary',
            isActive && 'cursor-wait opacity-60'
          )}
        >
          {isDone ? <CheckCircle2 size={15} /> : isActive ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {isDone ? 'Downloaded' : isActive ? 'Downloading' : 'Import track'}
        </button>
      </div>
    </div>
  )
}

function ResultRow({
  result,
  downloadItem,
  onDownload,
}: {
  result: {
    videoId: string
    title: string
    channel: string
    duration: string
    thumbnail?: string
  }
  downloadItem?: {
    status: string
  }
  onDownload: () => void
}) {
  const isActive = downloadItem?.status === 'downloading'
  const isDone = downloadItem?.status === 'done'

  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-4 py-3">
      <div className="aspect-video overflow-hidden bg-white/[0.04]">
        {result.thumbnail ? (
          <img src={result.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-primary">{result.title}</p>
        <p className="mt-1 truncate text-xs text-secondary">{result.channel} • {result.duration}</p>
      </div>
      <button
        onClick={onDownload}
        disabled={isActive}
        className={cn(
          'flex items-center gap-2 border-b px-1 pb-1 text-xs font-semibold interactive-soft',
          isDone ? 'border-green-400 text-green-300' : 'border-accent text-accent hover:text-primary',
          isActive && 'cursor-wait opacity-60'
        )}
      >
        {isDone ? <CheckCircle2 size={14} /> : isActive ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {isDone ? 'Done' : isActive ? 'Active' : 'Import'}
      </button>
    </div>
  )
}

function extractYouTubeTarget(input: string): { id: string; title?: string } | null {
  if (!input) return null

  try {
    const parsed = new URL(input)
    const host = parsed.hostname.replace(/^www\./, '')
    if (!['youtube.com', 'music.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) return null

    const playlistId = parsed.searchParams.get('list')
    if (playlistId) {
      return { id: `playlist:${playlistId}`, title: 'YouTube playlist import' }
    }

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? { id } : null
    }

    const watchId = parsed.searchParams.get('v')
    if (watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) return { id: watchId }

    const pathMatch = parsed.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/)
    return pathMatch ? { id: pathMatch[1] } : null
  } catch {
    return null
  }
}
