-- =====================================================================
-- PetalPath: Structured Curriculum Engine v2
-- Migration: 005_curriculum_engine_v2.sql
--
-- WHAT THIS DOES:
--   1. Adds domain/stage/learning_order to videos
--   2. Adds domain/stage to learning_paths
--   3. Creates child_video_history for watch tracking
--   4. Auto-classification trigger for new videos
--   5. Backfills all existing videos with correct domain/stage/order
--   6. Updates existing learning paths with domain/stage metadata
-- =====================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- STEP 1: Extend 'videos' table
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE videos ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS learning_order INTEGER DEFAULT 0;

-- Index for fast domain/stage lookups
CREATE INDEX IF NOT EXISTS idx_videos_domain_stage ON videos(domain, stage, learning_order);
CREATE INDEX IF NOT EXISTS idx_videos_domain_order ON videos(domain, learning_order);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 2: Extend 'learning_paths' table
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE learning_paths ADD COLUMN IF NOT EXISTS stage TEXT;

CREATE INDEX IF NOT EXISTS idx_learning_paths_domain ON learning_paths(domain);

-- ═══════════════════════════════════════════════════════════════════
-- STEP 3: Create 'child_video_history' table
-- Tracks which videos each child has completed, in order
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS child_video_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    stage TEXT NOT NULL,
    learning_order INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Each child can only complete a video once
    UNIQUE(child_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_cvh_child_domain ON child_video_history(child_id, domain, learning_order);
CREATE INDEX IF NOT EXISTS idx_cvh_child_completed ON child_video_history(child_id, completed_at DESC);

-- RLS for child_video_history
ALTER TABLE child_video_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view child video history" ON child_video_history;
CREATE POLICY "Parents can view child video history"
    ON child_video_history FOR SELECT
    USING (
        child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
    );

DROP POLICY IF EXISTS "Video history can be created for own children" ON child_video_history;
CREATE POLICY "Video history can be created for own children"
    ON child_video_history FOR INSERT
    WITH CHECK (
        child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
    );

-- ═══════════════════════════════════════════════════════════════════
-- STEP 4: Auto-classification function
-- Runs on INSERT/UPDATE to auto-populate domain, stage, learning_order
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_classify_video_curriculum()
RETURNS TRIGGER AS $$
DECLARE
    v_domain TEXT;
    v_stage TEXT;
    v_order INTEGER := 0;
    v_letter TEXT;
    v_number TEXT;
BEGIN
    -- Skip if not published
    IF NOT NEW.is_published THEN
        RETURN NEW;
    END IF;

    -- ─── NUMBERS (foundation) ─────────────────────────────
    IF (NEW.category = 'math'
        AND NEW.title ~* '(number|count|digit|one|two|three|four|five|six|seven|eight|nine|ten|\d+)'
        AND NOT NEW.title ~* '(shape|circle|square|triangle|rectangle|oval)')
    THEN
        v_domain := 'numbers';
        v_stage := 'foundation';

        -- Extract numeric order from title
        v_number := (regexp_match(NEW.title, '(\d+)'))[1];
        IF v_number IS NOT NULL THEN
            v_order := v_number::INTEGER;
        ELSE
            v_order := CASE
                WHEN NEW.title ~* '\bone\b'   THEN 1
                WHEN NEW.title ~* '\btwo\b'   THEN 2
                WHEN NEW.title ~* '\bthree\b' THEN 3
                WHEN NEW.title ~* '\bfour\b'  THEN 4
                WHEN NEW.title ~* '\bfive\b'  THEN 5
                WHEN NEW.title ~* '\bsix\b'   THEN 6
                WHEN NEW.title ~* '\bseven\b' THEN 7
                WHEN NEW.title ~* '\beight\b' THEN 8
                WHEN NEW.title ~* '\bnine\b'  THEN 9
                WHEN NEW.title ~* '\bten\b'   THEN 10
                ELSE 99
            END;
        END IF;

    -- ─── ALPHABET (foundation) ────────────────────────────
    ELSIF (NEW.category = 'language'
        AND (
            NEW.title ~* '(alphabet|letter|ABC|A-Z|a to z)'
            OR NEW.title ~* '^\s*(letter\s+)?[A-Z]\s'
            OR NEW.title ~* '\b[A-Z]\s+(is\s+for|for)\b'
        )
        AND NOT NEW.title ~* '(phonic|sound|blend|rhyme)')
    THEN
        v_domain := 'alphabet';
        v_stage := 'foundation';

        -- Extract letter for A-Z ordering (A=1, B=2 ... Z=26)
        v_letter := UPPER((regexp_match(NEW.title, '(?:letter\s+)?([A-Z])', 'i'))[1]);
        IF v_letter IS NOT NULL THEN
            v_order := ASCII(v_letter) - ASCII('A') + 1;
        ELSE
            v_order := 99;
        END IF;

    -- ─── PHONICS (understanding) ──────────────────────────
    ELSIF (NEW.category = 'language'
        AND NEW.title ~* '(phonic|sound|blend|rhyme|pronunciation|syllable)')
    THEN
        v_domain := 'phonics';
        v_stage := 'understanding';

        -- Extract letter for A-Z ordering
        v_letter := UPPER((regexp_match(NEW.title, '([A-Z])', 'i'))[1]);
        IF v_letter IS NOT NULL THEN
            v_order := ASCII(v_letter) - ASCII('A') + 1;
        ELSE
            v_order := 99;
        END IF;

    -- ─── SHAPES (application) ─────────────────────────────
    ELSIF (NEW.category = 'math'
        AND NEW.title ~* '(shape|circle|square|triangle|rectangle|oval|diamond|star|heart|hexagon|pentagon|geometry)')
    THEN
        v_domain := 'shapes';
        v_stage := 'application';

        v_order := CASE
            WHEN NEW.title ~* 'circle'    THEN 1
            WHEN NEW.title ~* 'square'    THEN 2
            WHEN NEW.title ~* 'triangle'  THEN 3
            WHEN NEW.title ~* 'rectangle' THEN 4
            WHEN NEW.title ~* 'oval'      THEN 5
            WHEN NEW.title ~* 'star'      THEN 6
            WHEN NEW.title ~* 'diamond'   THEN 7
            WHEN NEW.title ~* 'heart'     THEN 8
            WHEN NEW.title ~* 'hexagon'   THEN 9
            WHEN NEW.title ~* 'pentagon'  THEN 10
            ELSE 99
        END;

    -- ─── FALLBACK: category-based domain ──────────────────
    ELSE
        v_domain := CASE NEW.category::TEXT
            WHEN 'math' THEN 'numbers'
            WHEN 'language' THEN 'alphabet'
            ELSE 'general'
        END;
        v_stage := 'foundation';
        v_order := 99;
    END IF;

    -- Set the fields
    NEW.domain := v_domain;
    NEW.stage := v_stage;
    NEW.learning_order := v_order;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: auto-classify on INSERT
DROP TRIGGER IF EXISTS trg_auto_classify_video_insert ON videos;
CREATE TRIGGER trg_auto_classify_video_insert
    BEFORE INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION auto_classify_video_curriculum();

-- Trigger: auto-classify on UPDATE (when title or category changes)
DROP TRIGGER IF EXISTS trg_auto_classify_video_update ON videos;
CREATE TRIGGER trg_auto_classify_video_update
    BEFORE UPDATE OF title, category, is_published ON videos
    FOR EACH ROW
    EXECUTE FUNCTION auto_classify_video_curriculum();


-- ═══════════════════════════════════════════════════════════════════
-- STEP 5: Backfill existing videos
-- ═══════════════════════════════════════════════════════════════════

-- Numbers
UPDATE videos SET
    domain = 'numbers',
    stage = 'foundation',
    learning_order = COALESCE(
        (regexp_match(title, '(\d+)'))[1]::INTEGER,
        CASE
            WHEN title ~* '\bone\b'   THEN 1
            WHEN title ~* '\btwo\b'   THEN 2
            WHEN title ~* '\bthree\b' THEN 3
            WHEN title ~* '\bfour\b'  THEN 4
            WHEN title ~* '\bfive\b'  THEN 5
            WHEN title ~* '\bsix\b'   THEN 6
            WHEN title ~* '\bseven\b' THEN 7
            WHEN title ~* '\beight\b' THEN 8
            WHEN title ~* '\bnine\b'  THEN 9
            WHEN title ~* '\bten\b'   THEN 10
            ELSE 99
        END
    )
WHERE is_published = true
  AND category = 'math'
  AND title ~* '(number|count|digit|one|two|three|four|five|six|seven|eight|nine|ten|\d+)'
  AND NOT title ~* '(shape|circle|square|triangle|rectangle|oval)'
  AND domain IS NULL;

-- Alphabet
UPDATE videos SET
    domain = 'alphabet',
    stage = 'foundation',
    learning_order = COALESCE(
        ASCII(UPPER((regexp_match(title, '(?:letter\s+)?([A-Z])', 'i'))[1])) - ASCII('A') + 1,
        99
    )
WHERE is_published = true
  AND category = 'language'
  AND (
      title ~* '(alphabet|letter|ABC|A-Z|a to z)'
      OR title ~* '^\s*(letter\s+)?[A-Z]\s'
      OR title ~* '\b[A-Z]\s+(is\s+for|for)\b'
  )
  AND NOT title ~* '(phonic|sound|blend|rhyme)'
  AND domain IS NULL;

-- Phonics
UPDATE videos SET
    domain = 'phonics',
    stage = 'understanding',
    learning_order = COALESCE(
        ASCII(UPPER((regexp_match(title, '([A-Z])', 'i'))[1])) - ASCII('A') + 1,
        99
    )
WHERE is_published = true
  AND category = 'language'
  AND title ~* '(phonic|sound|blend|rhyme|pronunciation|syllable)'
  AND domain IS NULL;

-- Shapes
UPDATE videos SET
    domain = 'shapes',
    stage = 'application',
    learning_order = CASE
        WHEN title ~* 'circle'    THEN 1
        WHEN title ~* 'square'    THEN 2
        WHEN title ~* 'triangle'  THEN 3
        WHEN title ~* 'rectangle' THEN 4
        WHEN title ~* 'oval'      THEN 5
        WHEN title ~* 'star'      THEN 6
        WHEN title ~* 'diamond'   THEN 7
        WHEN title ~* 'heart'     THEN 8
        WHEN title ~* 'hexagon'   THEN 9
        WHEN title ~* 'pentagon'  THEN 10
        ELSE 99
    END
WHERE is_published = true
  AND category = 'math'
  AND title ~* '(shape|circle|square|triangle|rectangle|oval|diamond|star|heart|hexagon|pentagon|geometry)'
  AND domain IS NULL;

-- Catch-all: remaining math → numbers, remaining language → alphabet
UPDATE videos SET
    domain = 'numbers', stage = 'foundation', learning_order = 99
WHERE is_published = true AND category = 'math' AND domain IS NULL;

UPDATE videos SET
    domain = 'alphabet', stage = 'foundation', learning_order = 99
WHERE is_published = true AND category = 'language' AND domain IS NULL;

-- General fallback for other categories
UPDATE videos SET
    domain = 'general', stage = 'foundation', learning_order = 99
WHERE is_published = true AND domain IS NULL;


-- ═══════════════════════════════════════════════════════════════════
-- STEP 6: Update existing learning_paths with domain/stage metadata
-- ═══════════════════════════════════════════════════════════════════

UPDATE learning_paths SET domain = 'numbers',  stage = 'foundation'    WHERE title = 'Number Forest';
UPDATE learning_paths SET domain = 'alphabet', stage = 'foundation'    WHERE title = 'Alphabet Mountain';
UPDATE learning_paths SET domain = 'phonics',  stage = 'understanding' WHERE title = 'Phonics Valley';
UPDATE learning_paths SET domain = 'shapes',   stage = 'application'   WHERE title = 'Shape Island';


-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════

-- Check video classification
SELECT
    domain,
    stage,
    COUNT(*) AS video_count,
    STRING_AGG(
        learning_order || '. ' || title,
        E'\n'
        ORDER BY learning_order
    ) AS videos_ordered
FROM videos
WHERE is_published = true AND domain IS NOT NULL
GROUP BY domain, stage
ORDER BY domain, stage;

-- Check learning path metadata
SELECT title, domain, stage, order_index
FROM learning_paths
WHERE is_published = true
ORDER BY order_index;

COMMIT;
