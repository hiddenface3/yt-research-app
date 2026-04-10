const API_KEY = process.env.YOUTUBE_API_KEY
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export type YouTubeVideo = {
  video_id: string
  title: string
  channel_name: string
  channel_id: string
  thumbnail_url: string
  view_count: number
  like_count: number
  comment_count: number
  duration: string
  published_at: string
  description: string
  subscriber_count: number
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'
  const h = parseInt(match[1] || '0')
  const m = parseInt(match[2] || '0')
  const s = parseInt(match[3] || '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function searchYouTube(
  query: string,
  maxResults = 20,
  order: 'relevance' | 'date' | 'viewCount' = 'relevance'
): Promise<YouTubeVideo[]> {
  // Step 1: Search for video IDs
  const searchRes = await fetch(
    `${BASE_URL}/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&order=${order}&key=${API_KEY}`
  )
  const searchData = await searchRes.json()
  if (!searchData.items || searchData.items.length === 0) return []

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
  const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(',')

  // Step 2: Get video stats + duration
  const videoRes = await fetch(
    `${BASE_URL}/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${API_KEY}`
  )
  const videoData = await videoRes.json()

  // Step 3: Get channel subscriber counts
  const channelRes = await fetch(
    `${BASE_URL}/channels?part=statistics&id=${channelIds}&key=${API_KEY}`
  )
  const channelData = await channelRes.json()
  const channelMap: Record<string, number> = {}
  channelData.items?.forEach((ch: any) => {
    channelMap[ch.id] = parseInt(ch.statistics.subscriberCount || '0')
  })

  return videoData.items.map((item: any) => ({
    video_id: item.id,
    title: item.snippet.title,
    channel_name: item.snippet.channelTitle,
    channel_id: item.snippet.channelId,
    thumbnail_url:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      '',
    view_count: parseInt(item.statistics.viewCount || '0'),
    like_count: parseInt(item.statistics.likeCount || '0'),
    comment_count: parseInt(item.statistics.commentCount || '0'),
    duration: parseDuration(item.contentDetails.duration),
    published_at: item.snippet.publishedAt,
    description: item.snippet.description?.slice(0, 300) || '',
    subscriber_count: channelMap[item.snippet.channelId] || 0,
  }))
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  const years = Math.floor(months / 12)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

export async function getChannelStats(channelId: string) {
  const res = await fetch(
    `${BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`
  )
  const data = await res.json()
  if (!data.items?.length) return null
  const item = data.items[0]
  return {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    subscriberCount: parseInt(item.statistics.subscriberCount || '0'),
    viewCount: parseInt(item.statistics.viewCount || '0'),
    videoCount: parseInt(item.statistics.videoCount || '0'),
  }
}

export async function getRecentChannelVideos(channelId: string, maxResults = 5) {
  const searchRes = await fetch(
    `${BASE_URL}/search?part=id&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${API_KEY}`
  )
  const searchData = await searchRes.json()
  if (!searchData.items?.length) return []

  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
  const videoRes = await fetch(
    `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
  )
  const videoData = await videoRes.json()

  // Get subscriber count as well to match the standard card
  const channelRes = await fetch(
    `${BASE_URL}/channels?part=statistics&id=${channelId}&key=${API_KEY}`
  )
  const channelData = await channelRes.json()
  const subs = channelData.items?.length ? parseInt(channelData.items[0].statistics.subscriberCount || '0') : 0

  return videoData.items.map((item: any) => ({
    video_id: item.id,
    title: item.snippet.title,
    channel_name: item.snippet.channelTitle,
    channel_id: item.snippet.channelId,
    thumbnail_url:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.medium?.url ||
      '',
    view_count: parseInt(item.statistics.viewCount || '0'),
    like_count: parseInt(item.statistics.likeCount || '0'),
    comment_count: parseInt(item.statistics.commentCount || '0'),
    duration: parseDuration(item.contentDetails.duration),
    published_at: item.snippet.publishedAt,
    description: item.snippet.description?.slice(0, 300) || '',
    subscriber_count: subs,
  }))
}
