-- =====================================================================
-- PetalPath: Autonomous Curriculum Engine
-- Migration: 003_auto_curriculum_engine.sql
--
-- WHAT THIS DOES:
--   When ANY video is inserted or published, the system automatically:
--   1. Detects which learning path it belongs to
--   2. Creates the path if it doesn't exist
--   3. Maps the video with correct ordering
--   Zero manual work. Zero seeding. Self-evolving curriculum.
--
-- DETECTION PRIORITY:
--   Phase 1 → Known path rules (category + title regex)
--   Phase 2 → Topic extraction from title (auto-creates "<Topic> World")
--   Phase 3 → Category fallback (guaranteed match)
--
-- TRIGGERS ON:
--   AFTER INSERT  → maps if video is published on creation
--   AFTER UPDATE  → maps when is_published flips to true
-- =====================================================================


-- ═══════════════════════════════════════════════════════════════════
-- CORE ENGINE: auto_map_video_to_learning_path()
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_map_video_to_learning_path()
RETURNS TRIGGER AS $$
DECLARE
    v_path_id        UUID;
    v_path_title     TEXT;
    v_max_path_order INTEGER;
    v_max_vid_order  INTEGER;
    v_detected_topic TEXT;
    v_category       TEXT;
BEGIN
    -- ─── Guard: only process published videos ───────────────
    IF NOT NEW.is_published THEN
        RETURN NEW;
    END IF;

    -- On UPDATE, only fire when is_published just flipped to true
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_published = true THEN
            -- Already published, skip re-mapping
            RETURN NEW;
        END IF;
    END IF;

    -- Safe category cast
    v_category := NEW.category::TEXT;

    -- ═════════════════════════════════════════════════════════
    -- PHASE 1: Known Path Detection (hard rules)
    -- These are your established curriculum chapters.
    -- ═════════════════════════════════════════════════════════

    v_path_title := CASE

        -- ┌─────────────────────────────────────────────────┐
        -- │ NUMBER FOREST                                    │
        -- │ math + number/counting keywords                  │
        -- └─────────────────────────────────────────────────┘
        WHEN v_category = 'math'
             AND NEW.title ~* '(number|count|digit|one|two|three|four|five|six|seven|eight|nine|ten|\d+)'
             AND NOT NEW.title ~* '(shape|circle|square|triangle)'
        THEN 'Number Forest'

        -- ┌─────────────────────────────────────────────────┐
        -- │ SHAPE ISLAND                                     │
        -- │ math + geometry/shape keywords                   │
        -- └─────────────────────────────────────────────────┘
        WHEN v_category = 'math'
             AND NEW.title ~* '(shape|circle|square|triangle|rectangle|oval|diamond|star|heart|hexagon|pentagon|geometry)'
        THEN 'Shape Island'

        -- ┌─────────────────────────────────────────────────┐
        -- │ PHONICS VALLEY (checked BEFORE alphabet)         │
        -- │ language + phonics/sound keywords                │
        -- └─────────────────────────────────────────────────┘
        WHEN v_category = 'language'
             AND NEW.title ~* '(phonic|sound|blend|rhyme|pronunciation|syllable)'
        THEN 'Phonics Valley'

        -- ┌─────────────────────────────────────────────────┐
        -- │ ALPHABET MOUNTAIN                                │
        -- │ language + letter/alphabet keywords              │
        -- └─────────────────────────────────────────────────┘
        WHEN v_category = 'language'
             AND (
                 NEW.title ~* '(alphabet|letter|ABC|A-Z|a to z)'
                 OR NEW.title ~* '^\s*(letter\s+)?[A-Z]\s'
                 OR NEW.title ~* '\b[A-Z]\s+(is\s+for|for)\b'
             )
        THEN 'Alphabet Mountain'

        ELSE NULL
    END;


    -- ═════════════════════════════════════════════════════════
    -- PHASE 2: Topic Extraction (auto-create new paths)
    -- If no known path matched, scan the title for topic clues.
    -- Generates paths like "Colors World", "Animals World".
    -- ═════════════════════════════════════════════════════════

    IF v_path_title IS NULL THEN
        v_detected_topic := CASE
            -- Colors & visual
            WHEN NEW.title ~* '\m(color|colour|red|blue|green|yellow|purple|pink|orange|brown|black|white)\M'
            THEN 'Colors'

            -- Animals
            WHEN NEW.title ~* '\m(animal|dog|cat|lion|elephant|tiger|bird|fish|monkey|bear|rabbit|giraffe|zebra|cow|horse|duck|frog)\M'
            THEN 'Animals'

            -- Fruits
            WHEN NEW.title ~* '\m(fruit|apple|banana|mango|grape|strawberry|watermelon|cherry|peach|pear)\M'
            THEN 'Fruits'

            -- Vegetables
            WHEN NEW.title ~* '\m(vegetable|carrot|potato|tomato|onion|broccoli|pea|corn|cucumber)\M'
            THEN 'Vegetables'

            -- Body parts
            WHEN NEW.title ~* '\m(body\s+part|hand|foot|feet|head|eye|ear|nose|mouth|finger|toe|arm|leg|knee)\M'
            THEN 'Body Parts'

            -- Vehicles & transport
            WHEN NEW.title ~* '\m(vehicle|car|bus|train|truck|airplane|plane|boat|bicycle|bike|helicopter|rocket)\M'
            THEN 'Vehicles'

            -- Weather
            WHEN NEW.title ~* '\m(weather|rain|sunny|cloud|snow|wind|storm|rainbow|thunder)\M'
            THEN 'Weather'

            -- Seasons
            WHEN NEW.title ~* '\m(season|spring|summer|autumn|fall|winter)\M'
            THEN 'Seasons'

            -- Family & people
            WHEN NEW.title ~* '\m(family|mother|father|mom|dad|sister|brother|baby|grandma|grandpa)\M'
            THEN 'Family'

            -- Emotions & feelings
            WHEN NEW.title ~* '\m(emotion|feeling|happy|sad|angry|scared|surprise|excited|calm|brave)\M'
            THEN 'Emotions'

            -- Food & meals
            WHEN NEW.title ~* '\m(food|eat|cook|meal|breakfast|lunch|dinner|snack|recipe|kitchen)\M'
            THEN 'Food'

            -- Nature & environment
            WHEN NEW.title ~* '\m(nature|tree|flower|plant|garden|forest|leaf|seed|grow|river|ocean|mountain)\M'
            THEN 'Nature'

            -- Space & astronomy
            WHEN NEW.title ~* '\m(space|planet|star|moon|sun|rocket|astronaut|galaxy|earth|mars)\M'
            THEN 'Space'

            -- Music & rhythm
            WHEN NEW.title ~* '\m(music|song|sing|dance|rhythm|instrument|drum|piano|guitar|melody)\M'
            THEN 'Music'

            -- Time & days
            WHEN NEW.title ~* '\m(time|clock|hour|minute|day|week|month|morning|evening|night|today|tomorrow)\M'
            THEN 'Time'

            -- Manners & social skills
            WHEN NEW.title ~* '\m(manner|please|thank|sorry|share|help|friend|kind|polite|greeting|hello)\M'
            THEN 'Good Manners'

            ELSE NULL
        END;

        IF v_detected_topic IS NOT NULL THEN
            v_path_title := v_detected_topic || ' World';
        END IF;
    END IF;


    -- ═════════════════════════════════════════════════════════
    -- PHASE 3: Category Fallback (guaranteed catch-all)
    -- Every video lands somewhere. No orphans.
    -- ═════════════════════════════════════════════════════════

    IF v_path_title IS NULL THEN
        v_path_title := CASE v_category
            WHEN 'math'         THEN 'Number Forest'
            WHEN 'language'     THEN 'Alphabet Mountain'
            WHEN 'science'      THEN 'Science World'
            WHEN 'art'          THEN 'Art World'
            WHEN 'music'        THEN 'Music World'
            WHEN 'social'       THEN 'Social World'
            WHEN 'motor_skills' THEN 'Motor Skills World'
            ELSE 'Discovery World'
        END;
    END IF;


    -- ═════════════════════════════════════════════════════════
    -- PHASE 4: Ensure the learning path exists (create if not)
    -- ═════════════════════════════════════════════════════════

    SELECT id INTO v_path_id
    FROM learning_paths
    WHERE title = v_path_title;

    IF v_path_id IS NULL THEN
        -- Next order_index
        SELECT COALESCE(MAX(order_index), 0) + 1
        INTO v_max_path_order
        FROM learning_paths;

        INSERT INTO learning_paths (
            title,
            description,
            order_index,
            age_group,
            is_published
        ) VALUES (
            v_path_title,
            'Explore the wonderful world of ' || v_path_title || '! Auto-curated learning adventures.',
            v_max_path_order,
            '2-4',
            true
        )
        RETURNING id INTO v_path_id;

        RAISE NOTICE '[PetalPath Engine] Created new learning path: "%" (order: %)', v_path_title, v_max_path_order;
    END IF;


    -- ═════════════════════════════════════════════════════════
    -- PHASE 5: Map video → path with sequential ordering
    -- ═════════════════════════════════════════════════════════

    SELECT COALESCE(MAX(order_index), 0) + 1
    INTO v_max_vid_order
    FROM learning_path_videos
    WHERE path_id = v_path_id;

    INSERT INTO learning_path_videos (path_id, video_id, order_index)
    VALUES (v_path_id, NEW.id, v_max_vid_order)
    ON CONFLICT (path_id, video_id) DO NOTHING;

    RAISE NOTICE '[PetalPath Engine] Mapped video "%" → "%" (position: %)', NEW.title, v_path_title, v_max_vid_order;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Fire on new video insert (if published immediately)
DROP TRIGGER IF EXISTS trg_auto_map_video_insert ON videos;
CREATE TRIGGER trg_auto_map_video_insert
    AFTER INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION auto_map_video_to_learning_path();

-- Fire when existing video is published (is_published flipped to true)
DROP TRIGGER IF EXISTS trg_auto_map_video_publish ON videos;
CREATE TRIGGER trg_auto_map_video_publish
    AFTER UPDATE OF is_published ON videos
    FOR EACH ROW
    WHEN (NEW.is_published = true AND OLD.is_published = false)
    EXECUTE FUNCTION auto_map_video_to_learning_path();


-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION: Test the engine without inserting real data
-- ═══════════════════════════════════════════════════════════════════

-- Check that triggers are registered
SELECT
    tgname AS "Trigger Name",
    tgtype AS "Type",
    proname AS "Function"
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'videos'::regclass
  AND tgname LIKE 'trg_auto_map%';

-- Show current path → video map
SELECT
    lp.title AS "Learning Path",
    lp.order_index AS "Path #",
    COUNT(lpv.id) AS "Videos",
    STRING_AGG(
        lpv.order_index || '. ' || v.title,
        E'\n'
        ORDER BY lpv.order_index
    ) AS "Video List"
FROM learning_paths lp
LEFT JOIN learning_path_videos lpv ON lpv.path_id = lp.id
LEFT JOIN videos v ON v.id = lpv.video_id
WHERE lp.is_published = true
GROUP BY lp.id, lp.title, lp.order_index
ORDER BY lp.order_index;
