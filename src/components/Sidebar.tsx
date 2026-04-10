'use client'
import { useEffect, useState } from 'react'
import { Clock, Search, Trash2, ChevronRight } from 'lucide-react'

type SearchRecord = {
  id: string
  query: string
  result_count: number
  created_at: string
}

type Props = {
  onSelectSearch: (query: string) => void
  refreshTrigger: number
}

function timeAgoShort(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function Sidebar({ onSelectSearch, refreshTrigger }: Props) {
  const [searches, setSearches] = useState<SearchRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history?limit=30')
      const data = await res.json()
      setSearches(data.searches || [])
    } catch (err) {
      console.error('History fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory() }, [refreshTrigger])

  const deleteSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch('/api/history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSearches((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-4 h-4 text-[#666]" />
        <span className="text-sm font-medium text-[#aaa]">Search History</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-180px)]">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))
        ) : searches.length === 0 ? (
          <div className="text-xs text-[#555] px-2 py-4 text-center">
            No searches yet. Start researching!
          </div>
        ) : (
          searches.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSearch(s.query)}
              className="group w-full text-left px-3 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-transparent hover:border-[#2a2a2a] transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Search className="w-3 h-3 text-[#555] flex-shrink-0" />
                  <span className="text-xs text-[#ccc] truncate">{s.query}</span>
                </div>
                <button
                  onClick={(e) => deleteSearch(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#ff3c3c] flex-shrink-0 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1 pl-5">
                <span className="text-[10px] text-[#555]">{timeAgoShort(s.created_at)}</span>
                {s.result_count > 0 && (
                  <span className="text-[10px] text-[#444]">{s.result_count} results</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
