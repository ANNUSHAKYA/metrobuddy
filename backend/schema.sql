-- ─── Metro Buddy Supabase Database Schema ───────────────────
-- Execute this SQL script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lohcbdstvuqwcttzkzqf/sql

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  anonymous_handle TEXT,
  verification_tier INTEGER DEFAULT 1,
  trust_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OTPs Table
CREATE TABLE IF NOT EXISTS public.otps (
  phone TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Journeys Table
CREATE TABLE IF NOT EXISTS public.journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  departure_station TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  departure_time_window JSONB NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user1_handle TEXT,
  user2_id TEXT NOT NULL,
  user2_handle TEXT,
  journey1_id TEXT,
  journey2_id TEXT,
  departure_station TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  meetup_spot TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  view_once BOOLEAN DEFAULT FALSE,
  is_opened BOOLEAN DEFAULT FALSE,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) policies / public access for service role & anon
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow full service role access
CREATE POLICY "Allow service role full access users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow service role full access otps" ON public.otps FOR ALL USING (true);
CREATE POLICY "Allow service role full access journeys" ON public.journeys FOR ALL USING (true);
CREATE POLICY "Allow service role full access matches" ON public.matches FOR ALL USING (true);
CREATE POLICY "Allow service role full access messages" ON public.messages FOR ALL USING (true);
