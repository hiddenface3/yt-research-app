import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Search = {
  id: string
  query: string
  result_count: number
  created_at: string
}

export type Video = {
  id: string
  search_id: string
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
  niche: string | null
  saved_at: string
}

export type Bookmark = {
  id: string
  video_id: string
  title: string
  channel_name: string
  thumbnail_url: string
  view_count: number
  niche: string | null
  notes: string | null
  saved_at: string
}
