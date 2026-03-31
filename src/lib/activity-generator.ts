/**
 * PetalPath Activity Generator
 * 
 * Generates topic-aware activity configs from video tags.
 * Limits to max 2 topics per session, prioritizes weak topics first.
 */

import type { ActivityConfig, SpeechConfig, CameraConfig, VideoWithTags } from './activity-types'

// ─── Phoneme Maps ───
// Each atomic topic maps to acceptable phonemes a child might say
const PHONEME_MAP: Record<string, string[]> = {
    // Letters
    A: ['a', 'ay', 'eh', 'aa', 'aah'],
    B: ['b', 'bee', 'buh', 'bih'],
    C: ['c', 'see', 'ss', 'kuh', 'cee'],
    D: ['d', 'dee', 'duh', 'dih'],
    E: ['e', 'ee', 'eh', 'eee'],
    F: ['f', 'ef', 'fuh', 'ff'],
    G: ['g', 'jee', 'gee', 'guh'],
    H: ['h', 'aych', 'huh', 'hah'],
    I: ['i', 'eye', 'ih', 'ai'],
    J: ['j', 'jay', 'juh', 'jey'],
    K: ['k', 'kay', 'kuh', 'keh'],
    L: ['l', 'el', 'luh', 'lah'],
    M: ['m', 'em', 'muh', 'mm'],
    N: ['n', 'en', 'nuh', 'nn'],
    O: ['o', 'oh', 'ow', 'oo'],
    P: ['p', 'pee', 'puh', 'pp'],
    Q: ['q', 'kyu', 'kyoo', 'cue'],
    R: ['r', 'ar', 'ruh', 'ah'],
    S: ['s', 'es', 'ss', 'suh'],
    T: ['t', 'tee', 'tuh', 'tt'],
    U: ['u', 'yoo', 'uh', 'oo'],
    V: ['v', 'vee', 'vuh', 'vv'],
    W: ['w', 'double u', 'wuh', 'dub'],
    X: ['x', 'eks', 'ex', 'ks'],
    Y: ['y', 'why', 'yuh', 'wai'],
    Z: ['z', 'zee', 'zed', 'zuh'],
    // Numbers
    '1': ['1', 'one', 'won', 'wan'],
    '2': ['2', 'two', 'too', 'tu'],
    '3': ['3', 'three', 'tree', 'free', 'fee'],
    '4': ['4', 'four', 'for', 'fo'],
    '5': ['5', 'five', 'fai', 'fiv'],
    '6': ['6', 'six', 'sik', 'siks'],
    '7': ['7', 'seven', 'seben', 'sven'],
    '8': ['8', 'eight', 'ate', 'eit'],
    '9': ['9', 'nine', 'nain', 'nin'],
    '10': ['10', 'ten', 'tin'],
    // Shapes
    circle: ['circle', 'sircle', 'cirkle', 'round'],
    square: ['square', 'skware', 'box'],
    triangle: ['triangle', 'trangle', 'triango'],
    rectangle: ['rectangle', 'rektangle', 'long box'],
    star: ['star', 'stah', 'staar'],
    heart: ['heart', 'haht', 'hart'],
    oval: ['oval', 'egg', 'ovel'],
    diamond: ['diamond', 'daimond', 'kite'],
}

// ─── Category-based prompt templates ───
function getSpeechPrompt(topic: string, category: string): string {
    const upper = topic.toUpperCase()
    switch (category) {
        case 'language':
            if (topic.length === 1) return `Say the sound of ${upper}!`
            return `Say "${topic}"!`
        case 'math':
            if (/^\d+$/.test(topic)) return `Say the number ${topic}!`
            return `Say "${topic}"!`
        default:
            return `Can you say "${topic}"?`
    }
}

function getCameraConfig(topic: string, category: string): CameraConfig {
    const upper = topic.toUpperCase()
    const isLetter = /^[A-Za-z]$/.test(topic)
    const isNumber = /^\d+$/.test(topic)

    if (isLetter) {
        return {
            topic,
            prompt: `Draw the letter ${upper} on paper! ✏️`,
            targetLabel: upper,
            activityType: 'draw',
        }
    }

    if (isNumber) {
        return {
            topic,
            prompt: `Draw the number ${topic} on paper! ✏️`,
            targetLabel: topic,
            activityType: 'draw',
        }
    }

    // Shapes and objects → find mode
    return {
        topic,
        prompt: `Can you show me a ${topic}? 📷`,
        targetLabel: topic.toLowerCase(),
        activityType: 'find',
    }
}

/**
 * Generate activity configs from a video's tags.
 * 
 * @param video - Video with tags
 * @param weakTopics - Topics this child is weak at (from activity_results)
 * @param maxTopics - Max topics to process (default 2)
 * @returns Array of ActivityConfigs, weak-first, max 2
 */
export function generateActivities(
    video: VideoWithTags,
    weakTopics: string[] = [],
    maxTopics: number = 2
): ActivityConfig[] {
    const tags = video.tags || []

    if (tags.length === 0) {
        // Fallback: extract topic from title
        const titleTopic = extractTopicFromTitle(video.title, video.category)
        if (titleTopic) tags.push(titleTopic)
    }

    if (tags.length === 0) return []

    // Sort: weak topics first
    const sorted = [...tags].sort((a, b) => {
        const aWeak = weakTopics.includes(a.toUpperCase()) || weakTopics.includes(a.toLowerCase())
        const bWeak = weakTopics.includes(b.toUpperCase()) || weakTopics.includes(b.toLowerCase())
        if (aWeak && !bWeak) return -1
        if (!aWeak && bWeak) return 1
        return 0
    })

    // Limit to maxTopics
    const selected = sorted.slice(0, maxTopics)

    return selected.map(topic => {
        const normalizedTopic = topic.trim()
        const key = normalizedTopic.toUpperCase()
        const phonemes = PHONEME_MAP[key] || PHONEME_MAP[normalizedTopic.toLowerCase()] || [normalizedTopic.toLowerCase()]

        const speech: SpeechConfig = {
            topic: normalizedTopic,
            prompt: getSpeechPrompt(normalizedTopic, video.category),
            targetPhonemes: phonemes,
            repetitions: 5,
        }

        const camera = getCameraConfig(normalizedTopic, video.category)

        return {
            topic: normalizedTopic,
            category: video.category,
            speech,
            camera,
        }
    })
}

/**
 * Extract an atomic topic from a video title (fallback when no tags).
 */
function extractTopicFromTitle(title: string, category: string): string | null {
    // "Phonics Sound of A" → "A"
    const phonicsMatch = title.match(/(?:sound|letter|phonics)\s+(?:of\s+)?([A-Za-z])\b/i)
    if (phonicsMatch) return phonicsMatch[1].toUpperCase()

    // "Number 3" or "Learn Number 5" → "3"
    const numberMatch = title.match(/number\s+(\d+)/i)
    if (numberMatch) return numberMatch[1]

    // "Learn about Circles" → "circle"
    const shapeMatch = title.match(/(circle|square|triangle|rectangle|star|heart|oval|diamond)/i)
    if (shapeMatch) return shapeMatch[1].toLowerCase()

    // Single letter at start: "A is for Apple" → "A"
    const letterMatch = title.match(/^([A-Z])\s+(?:is|for)\b/i)
    if (letterMatch) return letterMatch[1].toUpperCase()

    return null
}

/**
 * Reduce difficulty for retry: lower repetitions from 5 to 3.
 */
export function reduceActivityDifficulty(config: ActivityConfig): ActivityConfig {
    return {
        ...config,
        speech: {
            ...config.speech,
            repetitions: Math.max(3, config.speech.repetitions - 2),
        },
    }
}
