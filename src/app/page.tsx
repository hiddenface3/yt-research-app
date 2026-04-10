'use client'
import { useState } from 'react'
import { Play, Sparkles, TrendingUp, BarChart2 } from 'lucide-react'
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

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')
  const [error, setError] = useState('')
  const [sidebarRefresh, setSidebarRefresh] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (query: string, order: string) => {
    setLoading(true)
    setError('')
    setCurrentQuery(query)
    setHasSearched(true)
    setVideos([])

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e1e1e] bg-[#0f0f0f]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#ff3c3c] flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base hidden sm:block">YT Research</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 flex justify-center">
            <SearchBar onSearch={handleSearch} loading={loading} />
          </div>

          {/* Right badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#222] bg-[#1a1a1a] text-xs text-[#666]">
              <Sparkles className="w-3.5 h-3.5 text-[#ff3c3c]" />
              <span>AI Sort — Coming Soon</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar */}
        <Sidebar onSelectSearch={(q) => handleSearch(q, 'relevance')} refreshTrigger={sidebarRefresh} />

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Hero — only shown before first search */}
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#ff3c3c]/10 border border-[#ff3c3c]/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-[#ff3c3c]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">YT Research Tool</h1>
                <p className="text-[#666] text-sm max-w-md">
                  Search YouTube channels and videos. All your research is automatically saved and organized.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full mt-4">
                {[
                  { icon: <TrendingUp className="w-4 h-4" />, label: 'Trending Niches', desc: 'Find what\'s blowing up' },
                  { icon: <BarChart2 className="w-4 h-4" />, label: 'Channel Analysis', desc: 'Views vs subscriber ratio' },
                  { icon: <Sparkles className="w-4 h-4" />, label: 'AI Sort (Soon)', desc: 'Auto-organize by niche' },
                ].map((f) => (
                  <div key={f.label} className="p-4 rounded-xl border border-[#1e1e1e] bg-[#141414] text-left">
                    <div className="text-[#ff3c3c] mb-2">{f.icon}</div>
                    <div className="text-sm font-medium text-white">{f.label}</div>
                    <div className="text-xs text-[#555] mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
              {/* Quick searches */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['AI channels 2025', 'history storytelling', 'new small channels', 'n8n automation'].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSearch(q, 'relevance')}
                    className="px-3 py-1.5 rounded-full border border-[#222] bg-[#1a1a1a] text-xs text-[#888] hover:text-white hover:border-[#333] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results header */}
          {(hasSearched || loading) && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {loading ? 'Searching YouTube...' : `Results for "${currentQuery}"`}
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

          {/* Video grid */}
          <VideoGrid videos={videos} loading={loading} />

          {/* Empty state */}
          {hasSearched && !loading && videos.length === 0 && !error && (
            <div className="text-center py-20">
              <p className="text-[#555] text-sm">No videos found for &quot;{currentQuery}&quot;</p>
              <p className="text-[#444] text-xs mt-1">Try different keywords</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
