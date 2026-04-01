/**
 * PetalPath — Structured Curriculum Engine
 *
 * Core rule engine that determines the next video in a child's learning journey.
 * Implements 4 strict rules:
 *   RULE 1: Domain Progression (alphabet → phonics, numbers → shapes)
 *   RULE 2: Topic Continuity (if learning "A", next is phonics of "A")
 *   RULE 3: No Random Jumps (only ordered progression)
 *   RULE 4: Reinforcement every 3 videos
 */

import type { CurriculumDomain, CurriculumStage, NextVideoReason } from './types'
import { generateReinforcement, type ReinforcementActivity } from './reinforcement-engine'
import {
    isValidDomainTransition,
    isRandomJump,
    buildCompletionStats,
    isDomainUnlocked as isValidatorDomainUnlocked,
    ALLOWED_TRANSITIONS,
} from './curriculum-validator'

// ─── Types ───────────────────────────────────────────────────────

export interface CurriculumVideo {
    id: string
    title: string
    domain: CurriculumDomain
    stage: CurriculumStage
    learning_order: number
    video_url?: string
    thumbnail_url?: string
    tags: string[]
    category?: string
    difficulty?: string
    duration?: number
}

export interface NextVideoResult {
    next_video: CurriculumVideo | null
    reason: NextVideoReason
    reinforcement?: ReinforcementActivity | null
    progress: DomainProgress
}

export interface DomainProgress {
    current_domain: CurriculumDomain
    videos_in_domain: number
    completed_in_domain: number
    current_topic: string
    percentage: number
}

export interface WatchHistoryEntry {
    video_id: string
    domain: CurriculumDomain
    stage: CurriculumStage
    learning_order: number
}

// ─── Domain Progression Map ──────────────────────────────────────
// Defines the prerequisite chain: after completing X% of domain A,
// domain B unlocks.

interface DomainRule {
    domain: CurriculumDomain
    stage: CurriculumStage
    unlockedByDefault: boolean
    prerequisite?: {
        domain: CurriculumDomain
        minCompletionPercent: number  // 0–100
    }
    // After completing this domain's current topic, which domain continues?
    continuesWith?: CurriculumDomain
}

export const DOMAIN_PROGRESSION: DomainRule[] = [
    {
        domain: 'numbers',
        stage: 'foundation',
        unlockedByDefault: true,
    },
    {
        domain: 'alphabet',
        stage: 'foundation',
        unlockedByDefault: true,
        continuesWith: 'phonics',  // alphabet A → phonics A
    },
    {
        domain: 'phonics',
        stage: 'understanding',
        unlockedByDefault: false,
        prerequisite: { domain: 'alphabet', minCompletionPercent: 50 },
    },
    {
        domain: 'shapes',
        stage: 'application',
        unlockedByDefault: false,
        prerequisite: { domain: 'numbers', minCompletionPercent: 50 },
    },
]

// ─── Domain Display Metadata ─────────────────────────────────────

export const DOMAIN_META: Record<string, { title: string; icon: string; color: string; emoji: string }> = {
    numbers:  { title: 'Number Forest',      icon: '🌲', color: '#34D399', emoji: '1️⃣' },
    alphabet: { title: 'Alphabet Mountain',  icon: '🏔',  color: '#60A5FA', emoji: '🔤' },
    phonics:  { title: 'Phonics Valley',     icon: '🔊', color: '#F472B6', emoji: '🗣' },
    shapes:   { title: 'Shape Island',       icon: '🔺', color: '#FBBF24', emoji: '🟡' },
}

// ─── REINFORCEMENT INTERVAL ─────────────────────────────────────
const REINFORCEMENT_EVERY_N = 3

// ─── Helper: Extract topic letter from video ────────────────────

export function extractTopicFromVideo(video: CurriculumVideo): string {
    // Try to get the primary letter from tags
    if (video.tags && video.tags.length > 0) {
        // Look for single-letter tags (A, B, C...)
        const letterTag = video.tags.find(t => /^[A-Z]$/i.test(t.trim()))
        if (letterTag) return letterTag.trim().toUpperCase()
    }

    // Fallback: extract from title
    const letterMatch = video.title.match(/(?:letter\s+)?([A-Z])\b/i)
    if (letterMatch) return letterMatch[1].toUpperCase()

    // Number extraction
    const numMatch = video.title.match(/(\d+)/)
    if (numMatch) return numMatch[1]

    return video.title
}

// ─── CORE ENGINE: getNextVideo ──────────────────────────────────

export function getNextVideo(
    currentVideo: CurriculumVideo,
    history: WatchHistoryEntry[],
    weakTopics: string[],
    allVideos: CurriculumVideo[]
): NextVideoResult {
    const currentDomain = currentVideo.domain
    const currentOrder = currentVideo.learning_order
    const currentTopic = extractTopicFromVideo(currentVideo)

    // Calculate domain progress
    const videosInDomain = allVideos.filter(v => v.domain === currentDomain)
    const completedInDomain = history.filter(h => h.domain === currentDomain)
    const domainProgress: DomainProgress = {
        current_domain: currentDomain,
        videos_in_domain: videosInDomain.length,
        completed_in_domain: completedInDomain.length + 1, // +1 for current
        current_topic: currentTopic,
        percentage: videosInDomain.length > 0
            ? Math.round(((completedInDomain.length + 1) / videosInDomain.length) * 100)
            : 0,
    }

    // ─── RULE 4: Reinforcement every N videos ───────────────
    const totalWatched = history.length + 1 // +1 for current
    if (totalWatched > 0 && totalWatched % REINFORCEMENT_EVERY_N === 0) {
        const recentTopics = history
            .slice(-REINFORCEMENT_EVERY_N)
            .map(h => {
                const vid = allVideos.find(v => v.id === h.video_id)
                return vid ? extractTopicFromVideo(vid) : ''
            })
            .filter(Boolean)

        const reinforcement = generateReinforcement(recentTopics, weakTopics, currentDomain)

        // After reinforcement, continue with the next video in path
        const nextInPath = findNextInPath(currentVideo, allVideos, history)
        return {
            next_video: nextInPath,
            reason: 'reinforcement_session',
            reinforcement,
            progress: domainProgress,
        }
    }

    // ─── RULE 1 & 2: Weak topic reinforcement ──────────────
    if (weakTopics.length > 0) {
        // Find a video that addresses a weak topic
        const weakVideo = findWeakTopicVideo(weakTopics, allVideos, history)
        if (weakVideo) {
            return {
                next_video: weakVideo,
                reason: 'weak_topic_reinforcement',
                progress: domainProgress,
            }
        }
    }

    // ─── RULE 2: Topic Continuity (alphabet → phonics) ──────
    if (currentDomain === 'alphabet') {
        // After an alphabet video, find the phonics video for the same letter
        const phonicsVideo = allVideos.find(v =>
            v.domain === 'phonics' &&
            v.learning_order === currentOrder &&
            !history.some(h => h.video_id === v.id)
        )
        if (phonicsVideo) {
            return {
                next_video: phonicsVideo,
                reason: 'phonics_continuation',
                progress: {
                    ...domainProgress,
                    current_domain: 'phonics',
                    current_topic: extractTopicFromVideo(phonicsVideo),
                },
            }
        }
    }

    // ─── RULE 3: Next video in ordered path ─────────────────
    const nextInPath = findNextInPath(currentVideo, allVideos, history)
    if (nextInPath) {
        // Check if we're crossing domains (domain progression)
        const reason: NextVideoReason = nextInPath.domain !== currentDomain
            ? 'domain_progression'
            : 'next_in_path'

        return {
            next_video: nextInPath,
            reason,
            progress: {
                ...domainProgress,
                current_domain: nextInPath.domain,
                current_topic: extractTopicFromVideo(nextInPath),
            },
        }
    }

    // All videos watched — loop back or return null
    return {
        next_video: null,
        reason: 'next_in_path',
        progress: domainProgress,
    }
}

// ─── Helper: Find next video in ordered path ────────────────────

function findNextInPath(
    currentVideo: CurriculumVideo,
    allVideos: CurriculumVideo[],
    history: WatchHistoryEntry[]
): CurriculumVideo | null {
    const watchedIds = new Set(history.map(h => h.video_id))
    watchedIds.add(currentVideo.id) // Also exclude current

    const currentDomain = currentVideo.domain
    const currentOrder = currentVideo.learning_order

    // 1. First try: next video in the SAME domain with higher order
    const sameDomainNext = allVideos
        .filter(v =>
            v.domain === currentDomain &&
            v.learning_order > currentOrder &&
            !watchedIds.has(v.id)
        )
        .sort((a, b) => a.learning_order - b.learning_order)

    if (sameDomainNext.length > 0) {
        return sameDomainNext[0]
    }

    // 2. If domain is complete, check domain progression rules
    const rule = DOMAIN_PROGRESSION.find(r => r.domain === currentDomain)
    if (rule?.continuesWith) {
        // e.g., alphabet → phonics: find first unwatched phonics video
        const continuationVideos = allVideos
            .filter(v =>
                v.domain === rule.continuesWith &&
                !watchedIds.has(v.id)
            )
            .sort((a, b) => a.learning_order - b.learning_order)

        if (continuationVideos.length > 0) {
            return continuationVideos[0]
        }
    }

    // 3. STRICT FALLBACK: Only allow transitions to VALIDATED domains
    //    (RULE 3: No random jumps)
    const allowedTargets = ALLOWED_TRANSITIONS[currentDomain] || []
    const completionStats = buildCompletionStats(allVideos, history)

    for (const targetDomain of allowedTargets) {
        if (targetDomain === currentDomain) continue // Already checked above
        if (!isValidatorDomainUnlocked(targetDomain, completionStats)) continue

        const targetVideos = allVideos
            .filter(v =>
                v.domain === targetDomain &&
                !watchedIds.has(v.id)
            )
            .sort((a, b) => a.learning_order - b.learning_order)

        if (targetVideos.length > 0) {
            return targetVideos[0]
        }
    }

    // 4. Last resort: loop back to first unwatched in current domain
    //    (rewatches are allowed but cross-domain jumps are NOT)
    const anyInCurrentDomain = allVideos
        .filter(v => v.domain === currentDomain && !watchedIds.has(v.id))
        .sort((a, b) => a.learning_order - b.learning_order)

    if (anyInCurrentDomain.length > 0) {
        return anyInCurrentDomain[0]
    }

    // 5. Truly nothing left — return null (session complete)
    return null
}

// ─── Helper: Find video for weak topic ──────────────────────────

function findWeakTopicVideo(
    weakTopics: string[],
    allVideos: CurriculumVideo[],
    history: WatchHistoryEntry[]
): CurriculumVideo | null {
    const watchedIds = new Set(history.map(h => h.video_id))

    for (const topic of weakTopics) {
        // Find an unwatched video that covers this weak topic
        const match = allVideos.find(v => {
            if (watchedIds.has(v.id)) return false
            const videoTopic = extractTopicFromVideo(v)
            return videoTopic.toLowerCase() === topic.toLowerCase()
        })
        if (match) return match
    }

    return null
}

// ─── Utility: Get first video for a domain ──────────────────────

export function getFirstVideoForDomain(
    domain: CurriculumDomain,
    allVideos: CurriculumVideo[],
    history: WatchHistoryEntry[]
): CurriculumVideo | null {
    const watchedIds = new Set(history.map(h => h.video_id))

    const domainVideos = allVideos
        .filter(v => v.domain === domain && !watchedIds.has(v.id))
        .sort((a, b) => a.learning_order - b.learning_order)

    return domainVideos.length > 0 ? domainVideos[0] : null
}

// ─── Utility: Check if a domain is unlocked ─────────────────────

export function isDomainUnlocked(
    domain: CurriculumDomain,
    allVideos: CurriculumVideo[],
    history: WatchHistoryEntry[]
): boolean {
    const rule = DOMAIN_PROGRESSION.find(r => r.domain === domain)
    if (!rule) return false
    if (rule.unlockedByDefault) return true
    if (!rule.prerequisite) return true

    // Check prerequisite completion
    const prereqVideos = allVideos.filter(v => v.domain === rule.prerequisite!.domain)
    const prereqCompleted = history.filter(h => h.domain === rule.prerequisite!.domain)

    if (prereqVideos.length === 0) return false

    const completionPercent = (prereqCompleted.length / prereqVideos.length) * 100
    return completionPercent >= rule.prerequisite.minCompletionPercent
}
