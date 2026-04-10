import { NextRequest, NextResponse } from 'next/server'
import { extractVideoId, generateSearchQueries } from '@/lib/groq'
import { searchYouTube } from '@/lib/youtube'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const input = searchParams.get('input')?.trim()

  if (!input) return NextResponse.json({ error: 'Missing input' }, { status: 400 })

  try {
    // Step 1: Extract video ID from URL
    const videoId = extractVideoId(input)
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID from URL' }, { status: 400 })
    }

    // Step 2: Fetch video details from YouTube (1 unit)
    const ytRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
    )
    const ytData = await ytRes.json()
    const video = ytData.items?.[0]

    if (!video) {
      return NextResponse.json({ error: 'Video not found on YouTube' }, { status: 404 })
    }

    const title = video.snippet.title
    const description = video.snippet.description || ''
    const channelName = video.snippet.channelTitle

    // Step 3: Ask Groq to generate smart search queries (1 Groq call)
    const queries = await generateSearchQueries(title, description, channelName)

    if (queries.length === 0) {
      return NextResponse.json({ error: 'Could not generate search queries' }, { status: 500 })
    }

    // Step 4: Run all queries in parallel on YouTube
    const searchPromises = queries.map((q) => searchYouTube(q, 8, 'relevance'))
    const results = await Promise.all(searchPromises)

    // Step 5: Merge, deduplicate by video_id
    const seen = new Set<string>()
    seen.add(videoId) // exclude the original video
    const allVideos = results.flat().filter((v) => {
      if (seen.has(v.video_id)) return false
      seen.add(v.video_id)
      return true
    })

    // Step 6: Save to Supabase
    const { data: search } = await supabase
      .from('searches')
      .insert({
        query: `[Smart] Similar to: ${title}`,
        result_count: allVideos.length,
      })
      .select()
      .single()

    if (search && allVideos.length > 0) {
      await supabase.from('videos').insert(
        allVideos.map((v) => ({ ...v, search_id: search.id }))
      )
    }

    return NextResponse.json({
      sourceVideo: { title, channelName, videoId },
      queries,
      videos: allVideos,
      searchId: search?.id,
    })
  } catch (err: any) {
    console.error('Smart search error:', err)
    return NextResponse.json({ error: err.message || 'Smart search failed' }, { status: 500 })
  }
}
