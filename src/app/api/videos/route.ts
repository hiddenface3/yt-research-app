import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: fetch videos for a specific search
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const searchId = searchParams.get('searchId')

  if (!searchId) return NextResponse.json({ error: 'Missing searchId' }, { status: 400 })

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('search_id', searchId)
    .order('view_count', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ videos: data })
}

// POST: bookmark a video
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { video_id, title, channel_name, thumbnail_url, view_count } = body

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({ video_id, title, channel_name, thumbnail_url, view_count })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookmark: data })
}
