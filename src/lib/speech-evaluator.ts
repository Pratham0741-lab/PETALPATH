/**
 * PetalPath Speech Evaluator
 * 
 * Phonetic matching for child speech evaluation.
 * Maps topics to acceptable phonemes and normalizes child pronunciation patterns.
 */

import type { SpeechAttempt, SpeechResult, SpeechConfig } from './activity-types'

// ─── Phonetic Normalization Rules ───
// Common child pronunciation substitutions
const PHONETIC_RULES: [RegExp, string][] = [
    [/th/gi, 'f'],       // "three" → "free"
    [/\br/g, 'w'],       // "red" → "wed"
    [/\bl/g, 'w'],       // "love" → "wove"
    [/str/gi, 'sr'],     // "string" → "sring"
    [/sp/gi, 'p'],       // "spin" → "pin"
    [/sk/gi, 'k'],       // "skip" → "kip"
    [/sl/gi, 'l'],       // "slip" → "lip"
    [/\bsm/gi, 'm'],     // "small" → "mall"
    [/ng$/gi, 'n'],      // "sing" → "sin"
    [/ck$/gi, 'k'],      // "duck" → "duk"
]

/**
 * Normalize speech input for phonetic matching.
 * Applies child-typical pronunciation transformations.
 */
export function normalizeForPhonetics(input: string): string {
    let normalized = input.toLowerCase().trim()

    // Remove non-alphanumeric (keep spaces)
    normalized = normalized.replace(/[^a-z0-9\s]/g, '')

    // Apply phonetic rules
    for (const [pattern, replacement] of PHONETIC_RULES) {
        normalized = normalized.replace(pattern, replacement)
    }

    // Collapse whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim()

    return normalized
}

/**
 * Check if a transcript matches any of the acceptable phonemes.
 * Returns the matched phoneme or null.
 */
export function matchPhoneme(transcript: string, targetPhonemes: string[]): string | null {
    const normalized = normalizeForPhonetics(transcript)

    // Direct match
    for (const phoneme of targetPhonemes) {
        const normalizedPhoneme = normalizeForPhonetics(phoneme)

        // Exact match
        if (normalized === normalizedPhoneme) return phoneme

        // Contains match (child might say "the letter a" when target is "a")
        if (normalized.includes(normalizedPhoneme)) return phoneme

        // Phoneme is in transcript words
        const words = normalized.split(' ')
        if (words.some(w => w === normalizedPhoneme)) return phoneme
    }

    // Fuzzy: check if any word starts with target sound
    const words = normalized.split(' ')
    for (const phoneme of targetPhonemes) {
        const normalizedPhoneme = normalizeForPhonetics(phoneme)
        if (normalizedPhoneme.length <= 2) {
            // Short phonemes (single sounds like "a", "b")
            if (words.some(w => w.startsWith(normalizedPhoneme) || w === normalizedPhoneme)) {
                return phoneme
            }
        }
    }

    return null
}

/**
 * Evaluate a single speech attempt against the target phonemes.
 */
export function evaluateAttempt(
    transcript: string,
    config: SpeechConfig,
    round: number
): SpeechAttempt {
    const normalizedTranscript = normalizeForPhonetics(transcript)
    const matchedPhoneme = matchPhoneme(transcript, config.targetPhonemes)

    return {
        round,
        transcript,
        normalizedTranscript,
        matchedPhoneme,
        score: matchedPhoneme ? 1 : 0,
        timestamp: Date.now(),
    }
}

/**
 * Compute the final speech result from all attempts.
 */
export function computeSpeechResult(attempts: SpeechAttempt[], totalRounds: number): SpeechResult {
    const correctCount = attempts.filter(a => a.score === 1).length
    const accuracy = totalRounds > 0 ? correctCount / totalRounds : 0

    return {
        attempts,
        correctCount,
        totalRounds,
        accuracy,
        passed: accuracy >= 0.6,    // ≥ 3/5 (or ≥ 2/3 on retry)
    }
}

/**
 * Check if enough silence time has passed to trigger timeout.
 * Returns true if the child has been inactive for >= timeoutMs.
 */
export function shouldTimeout(lastActivityTimestamp: number, timeoutMs: number = 15000): boolean {
    return Date.now() - lastActivityTimestamp >= timeoutMs
}
