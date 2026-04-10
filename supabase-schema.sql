-- ================================================================
-- YT Research Tool — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ================================================================

CREATE TABLE IF NOT EXISTS searches (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query        text NOT NULL,
  result_count integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id        uuid REFERENCES searches(id) ON DELETE CASCADE,
  video_id         text NOT NULL,
  title            text,
  channel_name     text,
  channel_id       text,
  thumbnail_url    text,
  view_count       bigint DEFAULT 0,
  like_count       bigint DEFAULT 0,
  comment_count    bigint DEFAULT 0,
  duration         text,
  published_at     timestamptz,
  description      text,
  subscriber_count bigint DEFAULT 0,
  niche            text,
  saved_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id      text NOT NULL UNIQUE,
  title         text,
  channel_name  text,
  thumbnail_url text,
  view_count    bigint,
  niche         text,
  notes         text,
  saved_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_search_id ON videos(search_id);
CREATE INDEX IF NOT EXISTS idx_videos_video_id  ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at DESC);

ALTER TABLE searches  ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON searches  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON videos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bookmarks FOR ALL USING (true) WITH CHECK (true);
