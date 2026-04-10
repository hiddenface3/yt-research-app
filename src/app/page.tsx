'use client'
import { useState } from 'react'
import { Play, Sparkles, TrendingUp, BarChart2, Link } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import VideoGrid from '@/components/VideoGrid'
import Sidebar from '@/components/Sidebar'

type Video = {
  video_id: string
  title: string
  channel_name: string
  thumbnail_url: string
  view_count: number
  like_count: number
  comment_count: number
  duration: string
  published_at: string
  subscriber_count: number
  description?: string
}

type SmartMeta = {
  sourceVideo: { title: string; channelName: string; videoId: string }
  queries: string[]
} | null

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')
  const [error, setError] = useState('')
  const [sidebarRefresh, setSidebarRefresh] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [smartMeta, setSmartMeta] = useState<SmartMeta>(null)

  // Regular text search
  const handleSearch = async (query: string, order: string) => {
    setLoading(true)
    setError('')
    setCurrentQuery(query)
    setHasSearched(true)
    setVideos([])
    setSmartMeta(null)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&order=${order}&max=20`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVideos(data.videos || [])
      setSidebarRefresh((n) => n + 1)
    } catch (err: any) {
      setError(err.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // AI-powered smart search from YouTube URL
  const handleSmartSearch = async (url: string) => {
    setLoading(true)
    setError('')
    setCurrentQuery(url)
    setHasSearched(true)
    setVideos([])
    setSmartMeta(null)

    try {
      const res = await fetch(`/api/smart-search?input=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVideos(data.videos || [])
      setSmartMeta({ sourceVideo: data.sourceVideo, queries: data.queries })
      setSidebarRefresh((n) => n + 1)
    } catch (err: any) {
      setError(err.message || 'Smart search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e1e1e] bg-[#0f0f0f]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#ff3c3c] flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base hidden sm:block">YT Research</span>
          </div>

          <div className="flex-1 flex justify-center">
            <SearchBar onSearch={handleSearch} onSmartSearch={handleSmartSearch} loading={loading} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-xs text-[#a78bfa]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Groq AI Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 py-6 gap-6">
        <Sidebar
          onSelectSearch={(q) => handleSearch(q, 'relevance')}
          refreshTrigger={sidebarRefresh}
        />

        <main className="flex-1 min-w-0">
          {/* Hero */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#ff3c3c]/10 border border-[#ff3c3c]/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-[#ff3c3c]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">YT Research Tool</h1>
                <p className="text-[#666] text-sm max-w-md">
                  Search YouTube channels and videos — or paste a URL to find similar content using Groq AI.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full mt-4">
                {[
                  { icon: <TrendingUp className="w-4 h-4" />, label: 'Trending Niches', desc: "Find what's blowing up", color: 'text-[#ff3c3c]' },
                  { icon: <Link className="w-4 h-4" />, label: 'Paste a URL', desc: 'Find similar channels', color: 'text-[#7c3aed]' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'Groq AI Powered', desc: 'Smart query generation', color: 'text-[#a78bfa]' },
                ].map((f) => (
                  <div key={f.label} className="p-4 rounded-xl border border-[#1e1e1e] bg-[#141414] text-left">
                    <div className={`${f.color} mb-2`}>{f.icon}</div>
                    <div className="text-sm font-medium text-white">{f.label}</div>
                    <div className="text-xs text-[#555] mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {['AI channels 2025', 'history storytelling', 'new small channels', 'n8n automation'].map((q) => (
                  <button key={q} onClick={() => handleSearch(q, 'relevance')}
                    className="px-3 py-1.5 rounded-full border border-[#222] bg-[#1a1a1a] text-xs text-[#888] hover:text-white hover:border-[#333] transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart search result banner */}
          {smartMeta && !loading && (
            <div className="mb-4 p-4 rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#a78bfa]" />
                <span className="text-sm font-medium text-[#a78bfa]">Groq AI analysed the video</span>
              </div>
              <p className="text-xs text-[#888] mb-2">
                Source: <span className="text-white">{smartMeta.sourceVideo.title}</span>
                {' '} by <span className="text-[#aaa]">{smartMeta.sourceVideo.channelName}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] text-[#555] self-center">Searched for:</span>
                {smartMeta.queries.map((q, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/20">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          {(hasSearched || loading) && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {loading
                    ? smartMeta !== null || currentQuery.includes('youtu')
                      ? 'Groq is analyzing & searching...'
                      : 'Searching YouTube...'
                    : smartMeta
                    ? `Similar channels found`
                    : `Results for "${currentQuery}"`}
                </h2>
                {!loading && videos.length > 0 && (
                  <p className="text-xs text-[#555] mt-0.5">{videos.length} videos found • Saved to history</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl border border-[#ff3c3c]/30 bg-[#ff3c3c]/10 text-sm text-[#ff8888] mb-4">
              {error}
            </div>
          )}

          {/* Grid */}
          <VideoGrid videos={videos} loading={loading} />

          {/* Empty */}
          {hasSearched && !loading && videos.length === 0 && !error && (
            <div className="text-center py-20">
              <p className="text-[#555] text-sm">No results found</p>
              <p className="text-[#444] text-xs mt-1">Try different keywords or a different URL</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
