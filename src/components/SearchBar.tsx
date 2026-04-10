'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, X, Sliders } from 'lucide-react'

type Props = {
  onSearch: (query: string, order: string) => void
  loading: boolean
}

const SUGGESTIONS = [
  'AI automation 2025',
  'history storytelling channel',
  'your life as medieval',
  'n8n tutorial beginner',
  'new YouTube channel blowing up',
  'faceless YouTube channel',
]

export default function SearchBar({ onSearch, loading }: Props) {
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState('relevance')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase()) && query.length > 0
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setShowSuggestions(false)
    onSearch(query.trim(), order)
  }

  const pick = (s: string) => {
    setQuery(s)
    setShowSuggestions(false)
    onSearch(s, order)
  }

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search a video concept or idea..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] text-white placeholder-[#555] text-sm focus:outline-none focus:border-[#3a3a3a] focus:ring-1 focus:ring-[#3a3a3a]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-lg border transition-colors ${
            showFilters
              ? 'border-[#ff3c3c] bg-[#ff3c3c]/10 text-[#ff3c3c]'
              : 'border-[#2a2a2a] bg-[#1e1e1e] text-[#666] hover:text-white hover:border-[#3a3a3a]'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Search button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 rounded-lg bg-[#ff3c3c] hover:bg-[#ff5555] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* Filters row */}
      {showFilters && (
        <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <span className="text-xs text-[#666]">Sort by:</span>
          {(['relevance', 'viewCount', 'date'] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrder(o)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                order === o
                  ? 'bg-[#ff3c3c] text-white'
                  : 'bg-[#252525] text-[#aaa] hover:bg-[#2a2a2a] hover:text-white'
              }`}
            >
              {o === 'viewCount' ? 'View Count' : o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] shadow-xl z-50 overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s}
              onMouseDown={() => pick(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-[#252525] hover:text-white flex items-center gap-3"
            >
              <Search className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
