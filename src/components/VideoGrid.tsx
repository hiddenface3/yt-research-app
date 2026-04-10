'use client'
import VideoCard from './VideoCard'

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

type Props = {
  videos: Video[]
  loading: boolean
}

const SkeletonCard = () => (
  <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#222]">
    <div className="aspect-video skeleton" />
    <div className="p-3 space-y-2">
      <div className="skeleton h-4 rounded w-full" />
      <div className="skeleton h-4 rounded w-3/4" />
      <div className="skeleton h-3 rounded w-1/2" />
      <div className="skeleton h-3 rounded w-1/3" />
    </div>
  </div>
)

export default function VideoGrid({ videos, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (videos.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video, i) => (
        <VideoCard key={video.video_id} video={video} index={i} />
      ))}
    </div>
  )
}
