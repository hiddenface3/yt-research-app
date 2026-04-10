'use client'
import { useState } from 'react'
import { Bookmark, BookmarkCheck, ExternalLink, Clock, ThumbsUp, MessageSquare } from 'lucide-react'
import { formatCount, timeAgo } from '@/lib/youtube'

type Props = {
  video: {
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
  index?: number
}

export default function VideoCard({ video, index = 0 }: Props) {
  const [bookmarked, setBookmarked] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBookmarked(!bookmarked)
    try {
      await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: video.video_id,
          title: video.title,
          channel_name: video.channel_name,
          thumbnail_url: video.thumbnail_url,
          view_count: video.view_count,
        }),
      })
    } catch (err) {
      console.error('Bookmark error:', err)
    }
  }

  const viewRatio =
    video.subscriber_count > 0
      ? (video.view_count / video.subscriber_count).toFixed(1)
      : null

  const getRatioBadgeColor = (ratio: number) => {
    if (ratio >= 3) return 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30'
    if (ratio >= 1) return 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/30'
    return 'bg-[#ff3c3c]/20 text-[#ff3c3c] border border-[#ff3c3c]/30'
  }

  return (
    <div
      className="fade-up group bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#222] hover:border-[#333] hover:bg-[#1f1f1f] transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${index * 40}ms` }}
      onClick={() => window.open(`https://youtube.com/watch?v=${video.video_id}`, '_blank')}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#111] overflow-hidden">
        {!imgError ? (
          <img
            src={video.thumbnail_url || `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <span className="text-[#333] text-xs">No thumbnail</span>
          </div>
        )}

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
          {video.duration}
        </span>

        {/* View ratio badge */}
        {viewRatio && parseFloat(viewRatio) > 0 && (
          <span
            className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold ${getRatioBadgeColor(
              parseFloat(viewRatio)
            )}`}
          >
            {viewRatio}x
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ExternalLink className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug group-hover:text-[#ff5555] transition-colors">
          {video.title}
        </h3>

        {/* Channel row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[#ff3c3c]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-[#ff3c3c] font-bold">
                {video.channel_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-[#aaa] truncate">{video.channel_name}</span>
          </div>
          <span className="text-[10px] text-[#555] flex-shrink-0 ml-2">
            {timeAgo(video.published_at)}
          </span>
        </div>

        {/* Sub count */}
        {video.subscriber_count > 0 && (
          <div className="text-[10px] text-[#666]">
            {formatCount(video.subscriber_count)} subscribers
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#222]">
          <span className="flex items-center gap-1 text-[11px] text-[#888]">
            <Clock className="w-3 h-3" />
            {formatCount(video.view_count)} views
          </span>
          {video.like_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#888]">
              <ThumbsUp className="w-3 h-3" />
              {formatCount(video.like_count)}
            </span>
          )}
          {video.comment_count > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#888]">
              <MessageSquare className="w-3 h-3" />
              {formatCount(video.comment_count)}
            </span>
          )}

          {/* Bookmark button */}
          <button
            onClick={handleBookmark}
            className={`ml-auto p-1 rounded transition-colors ${
              bookmarked
                ? 'text-[#ff3c3c]'
                : 'text-[#555] hover:text-[#ff3c3c]'
            }`}
          >
            {bookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
