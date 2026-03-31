-- =====================================================================
-- PetalPath: Activity Results Table
-- Migration: 004_activity_results.sql
--
-- Stores per-topic activity outcomes (speech + camera scores) with
-- weighted final scores and priority_score for adaptive learning.
-- =====================================================================

BEGIN;

-- ==========================================
-- ACTIVITY RESULTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activity_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  speech_score DECIMAL(5,2) DEFAULT 0.00,
  camera_score DECIMAL(5,2) DEFAULT 0.00,
  final_score DECIMAL(5,2) DEFAULT 0.00,       -- weighted: speech*0.6 + camera*0.4
  priority_score DECIMAL(5,2) DEFAULT 1.00,     -- 1 - final_score, for adaptive engine
  speech_attempts INTEGER DEFAULT 0,
  camera_attempts INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',        -- 'strong', 'weak', 'pending', 'skipped'
  decision TEXT,                                 -- 'SUCCESS','RETRY_SPEECH','RETRY_DRAW','FAILSAFE_SKIP'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_activity_results_child_topic
  ON activity_results(child_id, topic, status);

CREATE INDEX IF NOT EXISTS idx_activity_results_priority
  ON activity_results(child_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_activity_results_weak
  ON activity_results(child_id, status)
  WHERE status = 'weak';

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE activity_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view children activity results" ON activity_results;
CREATE POLICY "Parents can view children activity results"
  ON activity_results FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Activity results can be created for own children" ON activity_results;
CREATE POLICY "Activity results can be created for own children"
  ON activity_results FOR INSERT
  WITH CHECK (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Activity results can be updated for own children" ON activity_results;
CREATE POLICY "Activity results can be updated for own children"
  ON activity_results FOR UPDATE
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

COMMIT;
