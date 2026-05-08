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
  Link2,
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
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  const handleSearch = async () => {
    await search(query)
  }

  const handleDownloadUrl = async () => {
    if (!urlInput.trim()) {
      setUrlError(null)
      return
    }

    const url = urlInput.trim()
    const videoId = extractVideoId(url)
    if (!videoId) {
      setUrlError('Paste a valid YouTube watch, short, or embed URL.')
      return
    }

    setUrlError(null)
    await download(url, videoId)
    setUrlInput('')
  }

  const downloadByVideoId = new Map(downloads.map((item) => [item.videoId, item]))

  return (
    <div className="p-6 overflow-y-auto h-full animate-fade-in">
      <section className="surface-card rounded-[28px] border border-border-subtle overflow-hidden mb-6">
        <div className="px-6 py-6 md:px-7 md:py-7 bg-[radial-gradient(circle_at_top_left,rgba(232,168,124,0.2),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-2/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-4">
              <Download size={12} />
              YouTube Import
            </div>
            <h1 className="text-3xl font-bold text-primary">Bring tracks into your library without leaving Tplayer.</h1>
            <p className="mt-3 text-sm text-secondary max-w-2xl leading-6">
              Search for a track, review the result, and import it directly into your music folders with real progress feedback.
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border-subtle p-6 md:grid-cols-[minmax(0,1.75fr)_minmax(300px,0.95fr)]">
          <div className="rounded-[24px] border border-border-subtle bg-surface-1/90 p-5 surface-card">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary mb-3">
              <Search size={13} />
              Search
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Search YouTube by song, artist, or set..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="min-w-[118px]">
                {isSearching ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    <Search size={16} className="mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <p className="mt-3 text-xs text-tertiary">
              Best for finding one track quickly, then importing it straight into your main library.
            </p>
            {searchError && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{searchError}</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-border-subtle bg-surface-1/90 p-5 surface-card">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary mb-3">
              <Link2 size={13} />
              Direct URL
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Paste a YouTube URL..."
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  if (urlError) setUrlError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleDownloadUrl()}
                className="flex-1"
              />
              <Button onClick={handleDownloadUrl} variant="outline" disabled={!urlInput.trim()} className="w-full">
                <Download size={16} className="mr-2" />
                Download from URL
              </Button>
            </div>
            <p className="mt-3 text-xs text-tertiary">
              Use this when you already know the exact video you want.
            </p>
            {urlError && <p className="mt-3 text-xs text-red-300">{urlError}</p>}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Search Results</h2>
            <p className="text-sm text-secondary">
              {isSearching
                ? 'Looking up tracks...'
                : hasSearched && lastQuery
                  ? `Results for "${lastQuery}"`
                  : 'Start with a search to review tracks before downloading.'}
            </p>
          </div>
        </div>

        {isSearching ? (
          <div className="rounded-[24px] border border-border-subtle bg-surface-1/80 p-10 surface-card">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 size={24} className="animate-spin text-accent mb-3" />
              <p className="text-sm font-medium text-primary">Searching YouTube</p>
              <p className="text-xs text-tertiary mt-1">Fetching real results from `yt-dlp`.</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {searchResults.map((result) => {
              const downloadItem = downloadByVideoId.get(result.videoId)
              const isActive = downloadItem?.status === 'downloading'
              const isDone = downloadItem?.status === 'done'

              return (
                <div
                  key={result.videoId}
                  className="surface-card rounded-[24px] overflow-hidden hover:bg-surface-2/80 interactive-soft group"
                >
                  <div className="aspect-video bg-surface-2 relative overflow-hidden">
                    {result.thumbnail ? (
                      <img
                        src={result.thumbnail}
                        alt={result.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(232,168,124,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] flex items-center justify-center text-tertiary">
                        No thumbnail
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent">
                      <div className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 max-w-[65%] truncate">
                        {result.channel}
                      </div>
                      <div className="rounded-full bg-black/70 px-2 py-1 text-[11px] font-medium text-white">
                        {result.duration}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <p className="text-sm font-semibold text-primary line-clamp-2 min-h-[2.75rem]">{result.title}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-tertiary truncate">{result.channel}</p>
                      {downloadItem && (
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                            isDone
                              ? 'bg-green-500/15 text-green-300'
                              : isActive
                                ? 'bg-accent/15 text-accent'
                                : downloadItem.status === 'cancelled'
                                  ? 'bg-yellow-500/15 text-yellow-300'
                                : downloadItem.status === 'failed'
                                  ? 'bg-red-500/15 text-red-300'
                                  : 'bg-surface-3 text-secondary'
                          )}
                        >
                          {downloadItem.status}
                        </span>
                      )}
                    </div>

                    <Button
                      variant={isDone ? 'outline' : 'default'}
                      size="sm"
                      className="w-full mt-4"
                      disabled={isActive}
                      onClick={() => download(`https://youtube.com/watch?v=${result.videoId}`, result.videoId, result.title)}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 size={14} className="mr-2" />
                          Downloaded
                        </>
                      ) : isActive ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Downloading
                        </>
                      ) : (
                        <>
                          <Download size={14} className="mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border-default bg-surface-1/70 p-10 surface-card">
            <div className="max-w-md">
              <p className="text-sm font-semibold text-primary">
                {hasSearched ? 'No results matched that search.' : 'Search results will appear here.'}
              </p>
              <p className="text-sm text-secondary mt-2 leading-6">
                {hasSearched
                  ? 'Try a broader artist name, remove extra punctuation, or paste a direct URL if you already know the track.'
                  : 'Search by song title, artist, or mix name to import a track with cleaner context and fewer mistakes.'}
              </p>
            </div>
          </div>
        )}
      </section>

      {downloads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Download Activity</h2>
              <p className="text-sm text-secondary">Recent imports, active transfers, and any failures that need attention.</p>
            </div>
            <button onClick={clearHistory} className="text-xs text-tertiary hover:text-primary interactive-soft">
              Clear history
            </button>
          </div>

          <div className="space-y-3">
            {downloads.map((item) => (
              <div key={item.id} className="surface-card rounded-[20px] p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{item.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider',
                          item.status === 'done'
                            ? 'bg-green-500/20 text-green-400'
                            : item.status === 'cancelled'
                              ? 'bg-yellow-500/20 text-yellow-300'
                            : item.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-accent/20 text-accent'
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

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}
