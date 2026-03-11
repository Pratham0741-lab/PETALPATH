-- PetalPath Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CLEAN SLATE (Drop existing tables to prevent errors)
-- ==========================================
DROP TABLE IF EXISTS discovery_views CASCADE;
DROP TABLE IF EXISTS adaptive_learning_signals CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS children CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions/triggers to prevent conflicts
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.check_discovery_limit(UUID) CASCADE;

-- ==========================================
-- ENUM TYPES (Indempotent)
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('parent', 'child', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('video', 'speaking', 'camera', 'physical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE video_category AS ENUM ('language', 'math', 'science', 'art', 'music', 'social', 'motor_skills');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- PROFILES TABLE (extends Supabase Auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'parent',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- CHILDREN TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 10),
  avatar TEXT NOT NULL DEFAULT '🧒',
  pin_code TEXT DEFAULT '0000',
  learning_profile JSONB DEFAULT '{"preferred_difficulty": "easy", "interests": [], "learning_pace": "normal"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- VIDEOS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category video_category NOT NULL DEFAULT 'language',
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  language TEXT NOT NULL DEFAULT 'en',
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0, -- seconds
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ACTIVITIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  visual_instructions JSONB DEFAULT '[]'::jsonb,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  duration_seconds INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities JSONB DEFAULT '[]'::jsonb,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  total_duration INTEGER DEFAULT 0, -- seconds
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- PROGRESS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL,
  performance_score DECIMAL(5,2) DEFAULT 0.00,
  engagement_time INTEGER DEFAULT 0, -- seconds
  completed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ADAPTIVE LEARNING SIGNALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS adaptive_learning_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  video_completion DECIMAL(5,2) DEFAULT 0.00,
  accuracy DECIMAL(5,2) DEFAULT 0.00,
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  activity_type activity_type NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  response_time INTEGER DEFAULT 0, -- milliseconds
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- DISCOVERY VIEWS TABLE (5/day limit)
-- ==========================================
CREATE TABLE IF NOT EXISTS discovery_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_progress_child ON progress(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_timestamp ON progress(timestamp);
CREATE INDEX IF NOT EXISTS idx_adaptive_child ON adaptive_learning_signals(child_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_timestamp ON adaptive_learning_signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_discovery_child_date ON discovery_views(child_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_difficulty ON videos(difficulty);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can manage their children" ON children;
CREATE POLICY "Parents can manage their children"
  ON children FOR ALL
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all children" ON children;
CREATE POLICY "Admins can read all children"
  ON children FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read published videos" ON videos;
CREATE POLICY "Anyone authenticated can read published videos"
  ON videos FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all videos" ON videos;
CREATE POLICY "Admins can manage all videos"
  ON videos FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read activities" ON activities;
CREATE POLICY "Anyone authenticated can read activities"
  ON activities FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage activities" ON activities;
CREATE POLICY "Admins can manage activities"
  ON activities FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children sessions" ON sessions;
CREATE POLICY "Parents can view their children sessions"
  ON sessions FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sessions can be created for own children" ON sessions;
CREATE POLICY "Sessions can be created for own children"
  ON sessions FOR INSERT
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Sessions can be updated for own children" ON sessions;
CREATE POLICY "Sessions can be updated for own children"
  ON sessions FOR UPDATE
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

-- Progress
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children progress" ON progress;
CREATE POLICY "Parents can view their children progress"
  ON progress FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Progress can be created for own children" ON progress;
CREATE POLICY "Progress can be created for own children"
  ON progress FOR INSERT
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

-- Adaptive Learning Signals
ALTER TABLE adaptive_learning_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children signals" ON adaptive_learning_signals;
CREATE POLICY "Parents can view their children signals"
  ON adaptive_learning_signals FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Signals can be created for own children" ON adaptive_learning_signals;
CREATE POLICY "Signals can be created for own children"
  ON adaptive_learning_signals FOR INSERT
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

-- Discovery Views
ALTER TABLE discovery_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view their children discovery" ON discovery_views;
CREATE POLICY "Parents can view their children discovery"
  ON discovery_views FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Discovery views can be created for own children" ON discovery_views;
CREATE POLICY "Discovery views can be created for own children"
  ON discovery_views FOR INSERT
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_full_name TEXT;
BEGIN
  -- Extract and cast role safely
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'parent'::public.user_role; -- Fallback to parent
  END;

  -- Extract full name
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    v_full_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check discovery view limit
CREATE OR REPLACE FUNCTION check_discovery_limit(p_child_id UUID)
RETURNS INTEGER AS $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM discovery_views
  WHERE child_id = p_child_id AND viewed_at = CURRENT_DATE;
  RETURN view_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Allow public read access to videos
DROP POLICY IF EXISTS "Public videos are viewable by everyone." ON storage.objects;
CREATE POLICY "Public videos are viewable by everyone."
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- Allow admins to insert/upload videos
DROP POLICY IF EXISTS "Admins can upload videos." ON storage.objects;
CREATE POLICY "Admins can upload videos."
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
