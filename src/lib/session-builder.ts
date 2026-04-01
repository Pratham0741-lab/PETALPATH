/**
 * @deprecated — This module is DEPRECATED.
 *
 * The session page now uses the curriculum engine directly via `/api/next-video`.
 * DO NOT use buildSession() for new code — it previously used Math.random()
 * which violates the structured curriculum rules.
 *
 * For video selection: use getNextVideo() from '@/lib/curriculum-engine'
 * For session flow: see /child/session/page.tsx which implements the full
 *   Video → Activities → Reinforcement → Next Video pipeline.
 *
 * This file is kept only for backward compatibility. All exports re-route
 * to the curriculum engine.
 */

import type { DifficultyLevel, ActivityType } from './types'

export interface SessionPlan {
    activities: SessionActivity[]
    estimatedDuration: number // seconds
    difficulty: DifficultyLevel
}

export interface SessionActivity {
    type: ActivityType
    title: string
    instructions: string
    duration: number // seconds
    videoId?: string
    order: number
}

/**
 * @deprecated Use getNextVideo() from curriculum-engine.ts instead.
 * This function no longer selects videos randomly — it returns a
 * fixed activity skeleton without video selection.
 */
export function buildSession(
    _videos: unknown[] = [],
    difficulty: DifficultyLevel = 'easy',
    targetDuration: number = 900
): SessionPlan {
    console.warn(
        '[session-builder] DEPRECATED: buildSession() called. ' +
        'Use getNextVideo() from curriculum-engine.ts instead.'
    )

    // Return activity skeleton only — video selection must come from curriculum engine
    const activities: SessionActivity[] = [
        {
            type: 'video',
            title: 'Learning Video',
            instructions: 'Watch the video carefully!',
            duration: Math.min(300, targetDuration * 0.4),
            order: 1,
        },
        {
            type: 'speaking',
            title: 'Speaking Time',
            instructions: 'Repeat the sounds and words!',
            duration: Math.min(180, targetDuration * 0.2),
            order: 2,
        },
        {
            type: 'camera',
            title: 'Show & Tell',
            instructions: 'Find and show something from the video!',
            duration: Math.min(180, targetDuration * 0.2),
            order: 3,
        },
        {
            type: 'physical',
            title: 'Move Around',
            instructions: 'Time to get active!',
            duration: Math.min(120, targetDuration * 0.15),
            order: 4,
        },
    ]

    return {
        activities,
        estimatedDuration: activities.reduce((sum, a) => sum + a.duration, 0),
        difficulty,
    }
}
