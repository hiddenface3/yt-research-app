import { NextRequest, NextResponse } from 'next/server'
import { searchYouTube } from '@/lib/youtube'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')
  const order = (searchParams.get('order') || 'relevance') as 'relevance' | 'date' | 'viewCount'
  const max = parseInt(searchParams.get('max') || '20')

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  try {
    const videos = await searchYouTube(query, max, order)

    // Save search to Supabase
    const { data: search, error: searchError } = await supabase
      .from('searches')
      .insert({ query, result_count: videos.length })
      .select()
      .single()

    if (searchError) {
      console.error('Supabase search insert error:', searchError)
    }

    // Save videos to Supabase
    if (search && videos.length > 0) {
      const rows = videos.map((v) => ({ ...v, search_id: search.id }))
      const { error: videoError } = await supabase.from('videos').insert(rows)
      if (videoError) console.error('Supabase video insert error:', videoError)
    }

    return NextResponse.json({ videos, searchId: search?.id })
  } catch (err: any) {
    console.error('Search error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
