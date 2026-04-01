/**
 * PetalPath — Curriculum Validator
 *
 * Standalone validation module for enforcing structured learning rules.
 * ALL pathways through the system MUST use these validators to prevent
 * randomness from leaking into the learning journey.
 *
 * RULE 1: Domain Progression — alphabet → phonics, numbers → shapes
 * RULE 2: Topic Continuity — if learning "A", next is phonics of "A"
 * RULE 3: No Random Jumps — only ordered progression allowed
 * RULE 4: Reinforcement every 3 videos
 */

import type { CurriculumDomain, CurriculumStage } from './types'

// ─── Allowed Domain Transitions ─────────────────────────────────
// Key = current domain, Value = allowed next domains (in priority order)
// This is the SINGLE SOURCE OF TRUTH for what transitions are legal.

const ALLOWED_TRANSITIONS: Record<CurriculumDomain, CurriculumDomain[]> = {
    numbers:  ['numbers', 'shapes'],         // numbers → stay or shapes
    alphabet: ['alphabet', 'phonics'],       // alphabet → stay or phonics
    phonics:  ['phonics', 'alphabet'],       // phonics → stay or back to alphabet
    shapes:   ['shapes', 'numbers'],         // shapes → stay or back to numbers
    general:  ['numbers', 'alphabet'],       // general → start from foundation
}

// ─── Domain Prerequisite Map ────────────────────────────────────

interface PrerequisiteRule {
    domain: CurriculumDomain
    requires?: {
        domain: CurriculumDomain
        minCompletionPercent: number
    }
}

const PREREQUISITE_RULES: PrerequisiteRule[] = [
    { domain: 'numbers' },   // Always unlocked
    { domain: 'alphabet' },  // Always unlocked
    { domain: 'phonics', requires: { domain: 'alphabet', minCompletionPercent: 50 } },
    { domain: 'shapes',  requires: { domain: 'numbers',  minCompletionPercent: 50 } },
]

// ─── Stage Progression ──────────────────────────────────────────

const STAGE_ORDER: CurriculumStage[] = ['foundation', 'understanding', 'application']

const DOMAIN_STAGE_MAP: Record<CurriculumDomain, CurriculumStage> = {
    numbers:  'foundation',
    alphabet: 'foundation',
    phonics:  'understanding',
    shapes:   'application',
    general:  'foundation',
}

// ─── Core Validation Functions ──────────────────────────────────

/**
 * Check if a domain transition is valid.
 * Returns true if moving from `from` to `to` is allowed by curriculum rules.
 */
export function isValidDomainTransition(
    from: CurriculumDomain,
    to: CurriculumDomain
): boolean {
    const allowed = ALLOWED_TRANSITIONS[from]
    if (!allowed) return false
    return allowed.includes(to)
}

/**
 * Check if a transition constitutes a random jump (RULE 3 violation).
 * A random jump is an invalid cross-domain transition that doesn't
 * follow the prerequisite chain.
 */
export function isRandomJump(
    from: CurriculumDomain,
    to: CurriculumDomain
): boolean {
    if (from === to) return false  // Same domain is never random
    return !isValidDomainTransition(from, to)
}

/**
 * Get the expected stage for a domain.
 */
export function getStageForDomain(domain: CurriculumDomain): CurriculumStage {
    return DOMAIN_STAGE_MAP[domain] || 'foundation'
}

/**
 * Get the stage progression index (0 = foundation, 1 = understanding, 2 = application).
 */
export function getStageIndex(stage: CurriculumStage): number {
    return STAGE_ORDER.indexOf(stage)
}

/**
 * Check if a domain is unlocked based on completion history.
 */
export function isDomainUnlocked(
    domain: CurriculumDomain,
    completionStats: Record<CurriculumDomain, { total: number; completed: number }>
): boolean {
    const rule = PREREQUISITE_RULES.find(r => r.domain === domain)
    if (!rule) return false
    if (!rule.requires) return true // No prerequisite = always unlocked

    const prereqStats = completionStats[rule.requires.domain]
    if (!prereqStats || prereqStats.total === 0) return false

    const completionPercent = (prereqStats.completed / prereqStats.total) * 100
    return completionPercent >= rule.requires.minCompletionPercent
}

/**
 * Get all currently unlocked domains for a child.
 */
export function getUnlockedDomains(
    completionStats: Record<CurriculumDomain, { total: number; completed: number }>
): CurriculumDomain[] {
    return PREREQUISITE_RULES
        .filter(rule => isDomainUnlocked(rule.domain, completionStats))
        .map(rule => rule.domain)
}

/**
 * Validate and potentially correct a proposed next video.
 * If the proposed video would cause a random jump, return the corrected domain.
 *
 * @returns null if the transition is valid, or the corrected domain if invalid
 */
export function validateNextVideoDomain(
    currentDomain: CurriculumDomain,
    proposedDomain: CurriculumDomain,
    completionStats: Record<CurriculumDomain, { total: number; completed: number }>
): CurriculumDomain | null {
    // Same domain is always valid
    if (currentDomain === proposedDomain) return null

    // Check if the transition is allowed
    if (!isValidDomainTransition(currentDomain, proposedDomain)) {
        // Return the first valid transition target that's unlocked
        const allowedTargets = ALLOWED_TRANSITIONS[currentDomain] || []
        for (const target of allowedTargets) {
            if (target !== currentDomain && isDomainUnlocked(target, completionStats)) {
                return target
            }
        }
        // Stay in current domain if nothing else is valid
        return currentDomain
    }

    // Check if the target domain is actually unlocked
    if (!isDomainUnlocked(proposedDomain, completionStats)) {
        return currentDomain // Stay in current domain
    }

    return null // Transition is valid
}

/**
 * Get domain completion statistics from raw data.
 */
export function buildCompletionStats(
    allVideos: Array<{ domain: CurriculumDomain }>,
    history: Array<{ domain: CurriculumDomain }>
): Record<CurriculumDomain, { total: number; completed: number }> {
    const stats: Record<string, { total: number; completed: number }> = {}

    // Count total videos per domain
    for (const v of allVideos) {
        if (!stats[v.domain]) stats[v.domain] = { total: 0, completed: 0 }
        stats[v.domain].total++
    }

    // Count completed per domain
    for (const h of history) {
        if (!stats[h.domain]) stats[h.domain] = { total: 0, completed: 0 }
        stats[h.domain].completed++
    }

    return stats as Record<CurriculumDomain, { total: number; completed: number }>
}

/**
 * Check if reinforcement is due (RULE 4).
 */
export function isReinforcementDue(videosWatchedInSession: number): boolean {
    return videosWatchedInSession > 0 && videosWatchedInSession % 3 === 0
}

/**
 * Get human-readable explanation for why a domain is locked.
 */
export function getLockReason(domain: CurriculumDomain): string | null {
    const rule = PREREQUISITE_RULES.find(r => r.domain === domain)
    if (!rule?.requires) return null

    const prereqName = {
        numbers: 'Number Forest',
        alphabet: 'Alphabet Mountain',
        phonics: 'Phonics Valley',
        shapes: 'Shape Island',
        general: 'General',
    }[rule.requires.domain]

    return `Complete ${rule.requires.minCompletionPercent}% of ${prereqName} to unlock!`
}

// ─── Exports for use by other modules ───────────────────────────

export {
    ALLOWED_TRANSITIONS,
    PREREQUISITE_RULES,
    STAGE_ORDER,
    DOMAIN_STAGE_MAP,
}
