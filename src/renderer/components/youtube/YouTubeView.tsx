import { useState } from 'react'
import { useYouTubeStore } from '@/stores/youtubeStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FolderOpen,
  HardDrive,
  ListMusic,
  Loader2,
  Music,
  Search,
  Settings2,
  SquareCheck,
  Square,
  X,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface YouTubeViewProps {
  onViewChange?: (view: string) => void
}

export function YouTubeView({ onViewChange }: YouTubeViewProps) {
  const {
    searchResults,
    isSearching,
    searchError,
    hasSearched,
    lastQuery,
    downloads,
    playlistInfo,
    isFetchingPlaylist,
    selectedVideoIds,
    playlistUrl,
    playlistError,
    downloadSettings,
    batchProgress,
    isBatchDownloading,
    search,
    download,
    cancelDownload,
    clearHistory,
    fetchPlaylist,
    toggleVideoSelection,
    selectAllVideos,
    deselectAllVideos,
    downloadPlaylist,
    updateDownloadSettings,
  } = useYouTubeStore()

  const [activeTab, setActiveTab] = useState('search')
  const [query, setQuery] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [createPlaylistToggle, setCreatePlaylistToggle] = useState(false)
  const [playlistNameInput, setPlaylistNameInput] = useState('')

  const downloadByVideoId = new Map(downloads.map((item) => [item.videoId, item]))
  const firstResult = searchResults[0]
  const secondaryResults = searchResults.slice(1)

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

  const handleFetchPlaylist = async () => {
    if (!query.trim()) return
    const target = extractYouTubeTarget(query.trim())
    if (!target || !target.id.startsWith('playlist:')) {
      setUrlError('Paste a valid YouTube playlist URL.')
      return
    }
    setUrlError(null)
    await fetchPlaylist(query.trim())
  }

  const handleDownloadSelected = async () => {
    if (!playlistUrl || selectedVideoIds.size === 0) return
    const selectedIds = Array.from(selectedVideoIds)
    await downloadPlaylist(
      playlistUrl,
      selectedIds,
      downloadSettings,
      createPlaylistToggle,
      playlistNameInput.trim() || 'YouTube Import'
    )
    // Navigate to new playlist after a delay if created
    if (createPlaylistToggle && onViewChange) {
      setTimeout(() => {
        // Navigate to playlists view after creation
        onViewChange('playlists')
      }, 3000)
    }
  }

  const allSelected = playlistInfo !== null && playlistInfo.length > 0 && selectedVideoIds.size === playlistInfo.length
  const someSelected = selectedVideoIds.size > 0 && !allSelected

  return (
    <div className="h-full overflow-y-auto px-8 pb-28 animate-fade-in">
      <section className="mb-6 border-b border-white/[0.06] pb-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">YouTube Import</p>
            <p className="mt-1 text-sm text-secondary">
              Search by title, import a single video, or pull an entire playlist.
            </p>
          </div>
          {downloads.length > 0 && (
            <p className="text-xs uppercase tracking-[0.18em] text-tertiary">{downloads.length} imports</p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#151018]/85 border border-white/[0.11]">
            <TabsTrigger value="search" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-black">
              <Search size={13} className="mr-1.5" />
              Search
            </TabsTrigger>
            <TabsTrigger value="single" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-black">
              <Music size={13} className="mr-1.5" />
              Single URL
            </TabsTrigger>
            <TabsTrigger value="playlist" className="text-xs data-[state=active]:bg-accent data-[state=active]:text-black">
              <ListMusic size={13} className="mr-1.5" />
              Playlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <div className="flex gap-3">
              <Input
                placeholder="Search YouTube by title or artist"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (urlError) setUrlError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 rounded-full bg-[#151018]/85 border-white/[0.11]"
              />
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="min-w-[112px]">
                {isSearching ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Search size={16} className="mr-2" />}
                Search
              </Button>
            </div>
            {searchError && (
              <div className="mt-4 border-l border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{searchError}</span>
                </div>
              </div>
            )}

            <div className="mt-6">
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
            </div>
          </TabsContent>

          <TabsContent value="single" className="mt-4">
            <div className="flex gap-3">
              <Input
                placeholder="Paste a YouTube video URL"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (urlError) setUrlError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleDownloadUrl()}
                className="flex-1 rounded-full bg-[#151018]/85 border-white/[0.11]"
              />
              <Button onClick={handleDownloadUrl} disabled={!extractYouTubeTarget(query.trim())}>
                <Download size={16} className="mr-2" />
                Import URL
              </Button>
            </div>
            {urlError && activeTab === 'single' && (
              <div className="mt-4 border-l border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{urlError}</span>
                </div>
              </div>
            )}
            <div className="mt-6 border-y border-dashed border-white/[0.12] py-10">
              <p className="text-sm font-semibold text-primary">Single video import</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-secondary">
                Paste any YouTube video, Short, or embed link. The audio will be extracted and added to your library using your current advanced settings.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="playlist" className="mt-4">
            <div className="flex gap-3">
              <Input
                placeholder="Paste a YouTube playlist URL"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  if (urlError) setUrlError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchPlaylist()}
                className="flex-1 rounded-full bg-[#151018]/85 border-white/[0.11]"
              />
              <Button onClick={handleFetchPlaylist} disabled={isFetchingPlaylist || !query.trim()}>
                {isFetchingPlaylist ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ListMusic size={16} className="mr-2" />}
                Fetch Playlist
              </Button>
            </div>
            {urlError && activeTab === 'playlist' && (
              <div className="mt-4 border-l border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{urlError}</span>
                </div>
              </div>
            )}
            {playlistError && (
              <div className="mt-4 border-l border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{playlistError}</span>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="mt-4">
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary hover:text-primary interactive-soft"
              >
                <Settings2 size={14} />
                Advanced Settings
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="mt-3 grid gap-4 rounded-lg border border-white/[0.08] bg-[#151018]/60 p-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                      Audio Format
                    </label>
                    <select
                      value={downloadSettings.audioFormat}
                      onChange={(e) => updateDownloadSettings({ audioFormat: e.target.value as any })}
                      className="w-full rounded-md bg-[#0d0a10] border border-white/[0.11] px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                    >
                      <option value="mp3">MP3</option>
                      <option value="m4a">M4A</option>
                      <option value="flac">FLAC</option>
                      <option value="wav">WAV</option>
                      <option value="opus">Opus</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                      Quality (0 = best, 10 = worst)
                    </label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[downloadSettings.audioQuality]}
                        onValueChange={([v]) => updateDownloadSettings({ audioQuality: v })}
                        min={0}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-6 text-right text-xs font-mono text-primary">{downloadSettings.audioQuality}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Embed Thumbnail</label>
                    <Switch
                      checked={downloadSettings.embedThumbnail}
                      onCheckedChange={(v) => updateDownloadSettings({ embedThumbnail: v })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-tertiary">Add Metadata</label>
                    <Switch
                      checked={downloadSettings.addMetadata}
                      onCheckedChange={(v) => updateDownloadSettings({ addMetadata: v })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Playlist Videos */}
            {playlistInfo && playlistInfo.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.18em] text-tertiary">
                    {playlistInfo.length} videos found
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={allSelected ? deselectAllVideos : selectAllVideos}
                      className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-primary interactive-soft"
                    >
                      {allSelected ? <SquareCheck size={14} /> : someSelected ? <SquareCheck size={14} /> : <Square size={14} />}
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                <ScrollArea className="h-[360px] rounded-lg border border-white/[0.06]">
                  <div className="divide-y divide-white/[0.06]">
                    {playlistInfo.map((video) => {
                      const isSelected = selectedVideoIds.has(video.videoId)
                      return (
                        <div
                          key={video.videoId}
                          onClick={() => toggleVideoSelection(video.videoId)}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors',
                            isSelected ? 'bg-accent/10' : 'hover:bg-white/[0.03]'
                          )}
                        >
                          <div className="shrink-0">
                            {isSelected ? (
                              <SquareCheck size={16} className="text-accent" />
                            ) : (
                              <Square size={16} className="text-tertiary" />
                            )}
                          </div>
                          <div className="aspect-video w-20 shrink-0 overflow-hidden bg-white/[0.04]">
                            <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-primary">{video.title}</p>
                            <p className="mt-0.5 truncate text-xs text-secondary">{video.channel} • {video.duration}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* Batch progress */}
                {isBatchDownloading && batchProgress && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-secondary">
                        {batchProgress.currentTitle}
                      </span>
                      <span className="text-xs text-tertiary">
                        {batchProgress.completed}/{batchProgress.total}
                      </span>
                    </div>
                    <div className="h-[3px] bg-white/16 overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300"
                        style={{ width: `${batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Create playlist option */}
                <div className="mt-4 flex items-center gap-3">
                  <Switch
                    checked={createPlaylistToggle}
                    onCheckedChange={setCreatePlaylistToggle}
                    id="create-playlist"
                  />
                  <label htmlFor="create-playlist" className="text-sm text-secondary cursor-pointer">
                    Create as app playlist
                  </label>
                </div>
                {createPlaylistToggle && (
                  <div className="mt-2">
                    <Input
                      placeholder="Playlist name"
                      value={playlistNameInput}
                      onChange={(e) => setPlaylistNameInput(e.target.value)}
                      className="max-w-sm rounded-full bg-[#151018]/85 border-white/[0.11]"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={handleDownloadSelected}
                    disabled={isBatchDownloading || selectedVideoIds.size === 0}
                    className="min-w-[160px]"
                  >
                    {isBatchDownloading ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Download size={16} className="mr-2" />
                    )}
                    Download Selected ({selectedVideoIds.size})
                  </Button>
                </div>
              </div>
            )}

            {playlistInfo && playlistInfo.length === 0 && !isFetchingPlaylist && (
              <div className="mt-6 border-y border-dashed border-white/[0.12] py-10">
                <p className="text-sm font-semibold text-primary">No videos found in this playlist.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
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
