'use client'
import { useState, useRef } from 'react'
import { Search, X, Sliders, Sparkles, Link } from 'lucide-react'
import { isYouTubeUrl } from '@/lib/groq'

type Props = {
  onSearch: (query: string, order: string) => void
  onSmartSearch: (url: string) => void
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

export default function SearchBar({ onSearch, onSmartSearch, loading }: Props) {
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState('relevance')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isUrl = isYouTubeUrl(query.trim())
  const filtered = SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase()) && query.length > 0 && !isUrl
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setShowSuggestions(false)
    if (isUrl) {
      onSmartSearch(query.trim())
    } else {
      onSearch(query.trim(), order)
    }
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
          {/* Icon — changes based on URL detection */}
          {isUrl ? (
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff3c3c] w-4 h-4" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] w-4 h-4" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search keywords or paste a YouTube URL..."
            className={`w-full pl-10 pr-10 py-2.5 rounded-lg border bg-[#1e1e1e] text-white placeholder-[#555] text-sm focus:outline-none focus:ring-1 transition-colors ${
              isUrl
                ? 'border-[#ff3c3c]/50 focus:border-[#ff3c3c] focus:ring-[#ff3c3c]/30'
                : 'border-[#2a2a2a] focus:border-[#3a3a3a] focus:ring-[#3a3a3a]'
            }`}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters — hide when URL mode */}
        {!isUrl && (
          <button type="button" onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border transition-colors ${
              showFilters
                ? 'border-[#ff3c3c] bg-[#ff3c3c]/10 text-[#ff3c3c]'
                : 'border-[#2a2a2a] bg-[#1e1e1e] text-[#666] hover:text-white hover:border-[#3a3a3a]'
            }`}>
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* Submit button */}
        <button type="submit" disabled={loading || !query.trim()}
          className={`px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2 ${
            isUrl ? 'bg-[#7c3aed] hover:bg-[#6d28d9]' : 'bg-[#ff3c3c] hover:bg-[#ff5555]'
          }`}>
          {loading ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isUrl ? 'Analyzing...' : 'Searching'}
            </>
          ) : isUrl ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Find Similar
            </>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* URL mode hint */}
      {isUrl && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <Link className="w-3 h-3 text-[#7c3aed]" />
          <span className="text-xs text-[#7c3aed]">
            AI mode — Groq will analyze this video and find similar channels
          </span>
        </div>
      )}

      {/* Filters row */}
      {showFilters && !isUrl && (
        <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <span className="text-xs text-[#666]">Sort by:</span>
          {(['relevance', 'viewCount', 'date'] as const).map((o) => (
            <button key={o} onClick={() => setOrder(o)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                order === o ? 'bg-[#ff3c3c] text-white' : 'bg-[#252525] text-[#aaa] hover:bg-[#2a2a2a] hover:text-white'
              }`}>
              {o === 'viewCount' ? 'View Count' : o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] shadow-xl z-50 overflow-hidden">
          {filtered.map((s) => (
            <button key={s} onMouseDown={() => pick(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-[#ccc] hover:bg-[#252525] hover:text-white flex items-center gap-3">
              <Search className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
