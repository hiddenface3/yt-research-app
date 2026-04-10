'use client'
import { useState, useRef, useEffect } from 'react'
import { Play, Sparkles, TrendingUp, BarChart2, Link, Bot, TerminalSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
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

type AgentLog = {
  type: 'status' | 'thought' | 'tool_call' | 'tool_result' | 'final' | 'error' | 'videos'
  message: string
  data?: any
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [currentQuery, setCurrentQuery] = useState('')
  const [error, setError] = useState('')
  const [sidebarRefresh, setSidebarRefresh] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Agent mode states
  const [agentMode, setAgentMode] = useState(false)
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])
  const [agentSummary, setAgentSummary] = useState('')
  const logContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [agentLogs])

  const handleSearch = async (query: string, order: string) => {
    setLoading(true)
    setError('')
    setCurrentQuery(query)
    setHasSearched(true)
    setVideos([])
    setAgentLogs([])
    setAgentSummary('')

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

  const handleSmartSearch = async (url: string) => {
    if (agentMode) {
      // Run deep research agent
      return runAgent(url)
    }

    // Standard smart search
    setLoading(true)
    setError('')
    setCurrentQuery(url)
    setHasSearched(true)
    setVideos([])
    setAgentLogs([])
    setAgentSummary('')

    try {
      const res = await fetch(`/api/smart-search?input=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVideos(data.videos || [])
      setSidebarRefresh((n) => n + 1)
    } catch (err: any) {
      setError(err.message || 'Smart search failed.')
    } finally {
      setLoading(false)
    }
  }

  const runAgent = async (prompt: string) => {
    setLoading(true)
    setError('')
    setCurrentQuery(prompt)
    setHasSearched(true)
    setVideos([])
    setAgentSummary('')
    setAgentLogs([{ type: 'status', message: 'Connecting to Groq Agent...' }])

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.body) throw new Error('No stream body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          if (event.startsWith('data: ')) {
            try {
              const log: AgentLog = JSON.parse(event.slice(6))
              setAgentLogs((prev) => [...prev, log])

              if (log.type === 'videos' && Array.isArray(log.data)) {
                // To avoid duplicate videos, merge based on video_id
                setVideos((prev) => {
                  const existingIds = new Set(prev.map(v => v.video_id))
                  const newVideos = log.data.filter((v: Video) => v.video_id && !existingIds.has(v.video_id))
                  return [...prev, ...newVideos]
                })
              } else if (log.type === 'final') {
                setAgentSummary(log.message)
              } else if (log.type === 'error') {
                setError(log.message)
              }
            } catch (err) {
              console.error('Failed to parse SSE', event)
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Agent crashed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#1e1e1e] bg-[#0f0f0f]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#ff3c3c] flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base hidden sm:block">YT Research</span>
          </div>

          <div className="flex-1 flex justify-center">
            <SearchBar onSearch={(q, o) => agentMode ? runAgent(q) : handleSearch(q, o)} onSmartSearch={handleSmartSearch} loading={loading} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={() => setAgentMode(!agentMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                agentMode 
                  ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-[#a78bfa]' 
                  : 'border-[#222] bg-[#1a1a1a] text-[#888] hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-xs font-medium hidden md:block">
                Deep Research Agent
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-4 py-6 gap-6 overflow-hidden">
        {/* Only show standard sidebar if not in agent mode or no agent logs */}
        {!agentMode && agentLogs.length === 0 && (
          <Sidebar onSelectSearch={(q) => handleSearch(q, 'relevance')} refreshTrigger={sidebarRefresh} />
        )}

        <main className={`flex-1 min-w-0 flex flex-col ${agentMode && agentLogs.length > 0 ? 'border-r border-[#1e1e1e] pr-6' : ''}`}>
          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#ff3c3c]/10 border border-[#ff3c3c]/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-[#ff3c3c]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">YT Research Tool</h1>
                <p className="text-[#666] text-sm max-w-md">
                  Search YouTube channels, or toggle <b>Deep Research Agent</b> to let Groq analyze channels iteratively.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-[#ff3c3c]/30 bg-[#ff3c3c]/10 text-sm text-[#ff8888] mb-4">
              {error}
            </div>
          )}

          {/* Agent Summary output */}
          {agentSummary && (
            <div className="mb-6 w-full">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#a78bfa]" />
                Agent Research Report
              </h2>
              <div className="prose prose-invert prose-sm max-w-none p-6 rounded-xl border border-[#7c3aed]/30 bg-[#0f0f0f] whitespace-pre-wrap">
                {agentSummary}
              </div>
            </div>
          )}

          {!agentMode && <VideoGrid videos={videos} loading={loading} />}

          {!loading && videos.length === 0 && hasSearched && !agentSummary && !error && (
            <div className="text-center py-20">
              <p className="text-[#555] text-sm">No results found</p>
            </div>
          )}
        </main>

        {/* Agent Logs Sidebar */}
        {(agentMode || agentLogs.length > 0) && hasSearched && (
          <aside className="w-80 flex-shrink-0 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1e1e1e]">
              <TerminalSquare className="w-4 h-4 text-[#a78bfa]" />
              <h3 className="font-semibold text-white text-sm">Agent Thoughts</h3>
              {loading && <span className="ml-auto w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />}
            </div>
            
            <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] pr-2 custom-scrollbar">
              {agentLogs.map((log, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border ${
                  log.type === 'tool_call' ? 'bg-[#1a1a1a] border-[#333] text-[#ddd]' :
                  log.type === 'tool_result' ? 'bg-[#0f0f0f] border-[#222] text-[#888]' :
                  log.type === 'status' ? 'bg-[#7c3aed]/10 border-[#7c3aed]/30 text-[#a78bfa]' :
                  log.type === 'error' ? 'bg-[#ff3c3c]/10 border-[#ff3c3c]/30 text-[#ff8888]' :
                  'bg-[#111] border-[#222] text-white'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1 font-semibold uppercase opacity-80">
                    {log.type === 'tool_call' && <Sparkles className="w-3 h-3" />}
                    {log.type === 'tool_result' && <CheckCircle2 className="w-3 h-3" />}
                    {log.type === 'error' && <AlertCircle className="w-3 h-3" />}
                    {log.type}
                  </div>
                  <div className="break-words whitespace-pre-wrap">{log.message}</div>
                  {log.data && (
                    <div className="mt-1.5 p-1.5 bg-black/40 rounded text-[#666] break-all">
                      {typeof log.data === 'object' ? JSON.stringify(log.data) : log.data}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
