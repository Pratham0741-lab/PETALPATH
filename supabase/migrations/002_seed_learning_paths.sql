-- =====================================================================
-- PetalPath: Seed Learning Paths + Map Videos
-- Migration: 002_seed_learning_paths.sql
-- 
-- SAFE TO RE-RUN: Uses ON CONFLICT / NOT EXISTS guards throughout.
--
-- Mapping strategy:
--   Your video_category enum: language, math, science, art, music, social, motor_skills
--   We map to learning paths using category + title pattern matching:
--     Number Forest   → category = 'math'     + title hints at numbers/counting
--     Alphabet Mountain → category = 'language' + title hints at alphabet/letters
--     Phonics Valley  → category = 'language'  + title hints at phonics/sounds
--     Shape Island    → category = 'math'      + title hints at shapes
-- =====================================================================

BEGIN;

-- =========================================
-- STEP 1: Insert Learning Paths
-- =========================================
-- Using a CTE with ON CONFLICT to make this idempotent.
-- The title is used as the natural key for conflict detection.

-- First, add a unique constraint on title if it doesn't exist
-- (prevents duplicate paths on re-run)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'learning_paths_title_key'
    ) THEN
        ALTER TABLE learning_paths ADD CONSTRAINT learning_paths_title_key UNIQUE (title);
    END IF;
END $$;

INSERT INTO learning_paths (title, description, order_index, age_group, is_published)
VALUES
    (
        'Number Forest',
        'Explore the magical forest where every tree teaches a new number! Learn counting from 1 to 10 through fun adventures.',
        1,
        '2-4',
        true
    ),
    (
        'Alphabet Mountain',
        'Climb the mountain of letters! Discover A through Z with colorful characters and catchy songs.',
        2,
        '2-4',
        true
    ),
    (
        'Phonics Valley',
        'Journey through the valley of sounds! Learn how letters sound and start building your first words.',
        3,
        '2-4',
        true
    ),
    (
        'Shape Island',
        'Sail to the island of shapes! Circles, squares, triangles and more — find them everywhere around you.',
        4,
        '2-4',
        true
    )
ON CONFLICT (title) DO UPDATE SET
    description = EXCLUDED.description,
    order_index = EXCLUDED.order_index,
    age_group   = EXCLUDED.age_group,
    is_published = EXCLUDED.is_published;


-- =========================================
-- STEP 2: Map Videos → Learning Paths
-- =========================================
-- Strategy: Match videos to paths by category + title patterns.
-- ROW_NUMBER() enforces logical ordering within each path.
-- ON CONFLICT (path_id, video_id) DO NOTHING prevents duplicates.
--
-- NOTE: If your DB has no videos yet, these inserts will simply
-- insert zero rows — no errors. Upload videos first, then re-run.

-- ─────────────────────────────────────────
-- 2A. NUMBER FOREST
-- Math-category videos related to numbers/counting
-- Ordered by: extracting the leading number from title, then alphabetically
-- ─────────────────────────────────────────
INSERT INTO learning_path_videos (path_id, video_id, order_index)
SELECT
    (SELECT id FROM learning_paths WHERE title = 'Number Forest'),
    v.id,
    ROW_NUMBER() OVER (
        ORDER BY
            -- Try to extract a leading number from the title for natural sort
            CASE 
                WHEN v.title ~* '^\s*\d+' THEN LPAD(
                    (regexp_match(v.title, '(\d+)'))[1], 
                    5, '0'
                )
                ELSE v.title
            END,
            v.title
    )
FROM videos v
WHERE v.is_published = true
  AND v.category = 'math'
  AND v.title ~* '(number|count|digit|one|two|three|four|five|six|seven|eight|nine|ten|\d)'
ON CONFLICT (path_id, video_id) DO NOTHING;


-- ─────────────────────────────────────────
-- 2B. ALPHABET MOUNTAIN
-- Language-category videos related to the alphabet
-- Ordered by: letter extraction from title, then alphabetically
-- ─────────────────────────────────────────
INSERT INTO learning_path_videos (path_id, video_id, order_index)
SELECT
    (SELECT id FROM learning_paths WHERE title = 'Alphabet Mountain'),
    v.id,
    ROW_NUMBER() OVER (
        ORDER BY
            -- Try to extract a single letter for A-Z sort
            CASE
                WHEN v.title ~* '\b(letter\s+)?[A-Z]\b' THEN
                    UPPER((regexp_match(v.title, '(?:letter\s+)?([A-Z])', 'i'))[1])
                ELSE v.title
            END,
            v.title
    )
FROM videos v
WHERE v.is_published = true
  AND v.category = 'language'
  AND (
      -- Match by title keywords
      v.title ~* '(alphabet|letter|ABC|A-Z|a to z)'
      -- OR individual letter titles like "Letter A", "A is for Apple"
      OR v.title ~* '^\s*(letter\s+)?[A-Z]\s'
      OR v.title ~* '\b[A-Z]\s+(is\s+for|for)\b'
  )
  -- Exclude phonics-specific videos (will go in Phonics Valley)
  AND NOT v.title ~* '(phonic|sound|blend|rhyme)'
ON CONFLICT (path_id, video_id) DO NOTHING;


-- ─────────────────────────────────────────
-- 2C. PHONICS VALLEY
-- Language-category videos related to phonics/sounds
-- Ordered alphabetically by title
-- ─────────────────────────────────────────
INSERT INTO learning_path_videos (path_id, video_id, order_index)
SELECT
    (SELECT id FROM learning_paths WHERE title = 'Phonics Valley'),
    v.id,
    ROW_NUMBER() OVER (
        ORDER BY
            -- Extract letter for A-Z phonics ordering
            CASE
                WHEN v.title ~* '\b[A-Z]\b' THEN
                    UPPER((regexp_match(v.title, '([A-Z])', 'i'))[1])
                ELSE v.title
            END,
            v.title
    )
FROM videos v
WHERE v.is_published = true
  AND v.category = 'language'
  AND v.title ~* '(phonic|sound|blend|rhyme|pronunciation|syllable)'
ON CONFLICT (path_id, video_id) DO NOTHING;


-- ─────────────────────────────────────────
-- 2D. SHAPE ISLAND
-- Math-category videos related to shapes/geometry
-- Ordered by: logical shape progression (basic → complex)
-- ─────────────────────────────────────────
INSERT INTO learning_path_videos (path_id, video_id, order_index)
SELECT
    (SELECT id FROM learning_paths WHERE title = 'Shape Island'),
    v.id,
    ROW_NUMBER() OVER (
        ORDER BY
            -- Logical shape ordering: basic → complex
            CASE
                WHEN v.title ~* 'circle'    THEN 1
                WHEN v.title ~* 'square'    THEN 2
                WHEN v.title ~* 'triangle'  THEN 3
                WHEN v.title ~* 'rectangle' THEN 4
                WHEN v.title ~* 'oval'      THEN 5
                WHEN v.title ~* 'diamond'   THEN 6
                WHEN v.title ~* 'star'      THEN 7
                WHEN v.title ~* 'heart'     THEN 8
                WHEN v.title ~* 'hexagon'   THEN 9
                WHEN v.title ~* 'pentagon'  THEN 10
                ELSE 99
            END,
            v.title
    )
FROM videos v
WHERE v.is_published = true
  AND v.category = 'math'
  AND v.title ~* '(shape|circle|square|triangle|rectangle|oval|diamond|star|heart|hexagon|pentagon|geometry)'
  -- Exclude anything already claimed by Number Forest
  AND NOT (
      v.title ~* '(number|count|digit|\b\d+\b)'
      AND NOT v.title ~* '(shape|circle|square|triangle)'
  )
ON CONFLICT (path_id, video_id) DO NOTHING;


-- =========================================
-- STEP 3: FALLBACK — Catch uncategorized videos
-- =========================================
-- If a math video didn't match numbers OR shapes specifically,
-- put it in Number Forest as a fallback (better than orphaned).
-- Same logic for language → Alphabet Mountain.

-- Math fallback → Number Forest
INSERT INTO learning_path_videos (path_id, video_id, order_index)
SELECT
    (SELECT id FROM learning_paths WHERE title = 'Number Forest'),
    v.id,
    1000 + ROW_NUMBER() OVER (ORDER BY v.title)  -- append after explicit entries
FROM videos v
WHERE v.is_published = true
  AND v.category = 'math'
  AND v.id NOT IN (SELECT video_id FROM learning_path_videos)
ON CONFLICT (path_id, video_id) DO NOTHING;

-- Language fallback → Alphabet Mountain
INSERT INTO learning_path_videos (path_id, video_id, order_index)
SELECT
    (SELECT id FROM learning_paths WHERE title = 'Alphabet Mountain'),
    v.id,
    1000 + ROW_NUMBER() OVER (ORDER BY v.title)
FROM videos v
WHERE v.is_published = true
  AND v.category = 'language'
  AND v.id NOT IN (SELECT video_id FROM learning_path_videos)
ON CONFLICT (path_id, video_id) DO NOTHING;

COMMIT;


-- =========================================
-- STEP 4: VERIFICATION
-- =========================================
-- Run this after the above to confirm everything is wired correctly.

SELECT
    lp.title AS "Learning Path",
    lp.order_index AS "Path Order",
    COUNT(lpv.id) AS "Total Videos",
    STRING_AGG(
        '  ' || lpv.order_index || '. ' || v.title,
        E'\n'
        ORDER BY lpv.order_index
    ) AS "Videos (ordered)"
FROM learning_paths lp
LEFT JOIN learning_path_videos lpv ON lpv.path_id = lp.id
LEFT JOIN videos v ON v.id = lpv.video_id
WHERE lp.is_published = true
GROUP BY lp.id, lp.title, lp.order_index
ORDER BY lp.order_index;
