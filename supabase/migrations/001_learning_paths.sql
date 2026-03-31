-- ==========================================
-- LEARNING PATHS (Explore Map / Curriculum)
-- Migration: 001_learning_paths.sql
-- ==========================================

-- Learning path chapters (e.g. "Number Forest", "Alphabet Mountain")
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  age_group TEXT DEFAULT '2-4',           -- future: filter by age
  is_published BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: ordered videos within a learning path
CREATE TABLE IF NOT EXISTS learning_path_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate video entries inside the same path
  UNIQUE(path_id, video_id)
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_learning_paths_order ON learning_paths(order_index);
CREATE INDEX IF NOT EXISTS idx_learning_paths_published ON learning_paths(is_published);
CREATE INDEX IF NOT EXISTS idx_lpv_path ON learning_path_videos(path_id);
CREATE INDEX IF NOT EXISTS idx_lpv_video ON learning_path_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_lpv_order ON learning_path_videos(path_id, order_index);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Learning Paths
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read published paths" ON learning_paths;
CREATE POLICY "Anyone authenticated can read published paths"
  ON learning_paths FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all learning paths" ON learning_paths;
CREATE POLICY "Admins can manage all learning paths"
  ON learning_paths FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Learning Path Videos (junction)
ALTER TABLE learning_path_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read path videos" ON learning_path_videos;
CREATE POLICY "Anyone authenticated can read path videos"
  ON learning_path_videos FOR SELECT
  USING (
    path_id IN (SELECT id FROM learning_paths WHERE is_published = true)
  );

DROP POLICY IF EXISTS "Admins can manage path videos" ON learning_path_videos;
CREATE POLICY "Admins can manage path videos"
  ON learning_path_videos FOR ALL
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ==========================================
-- TRIGGER: auto-update updated_at
-- ==========================================
DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
