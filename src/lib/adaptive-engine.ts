import type { AdaptiveLearningSignal, DifficultyLevel, Video } from './types'

/**
 * Adaptive Learning Engine
 * Analyzes child performance signals and recommends personalized content.
 */

interface EngagementProfile {
    averageVideoCompletion: number
    averageAccuracy: number
    averageEngagement: number
    preferredDifficulty: DifficultyLevel
    strongActivities: string[]
    weakActivities: string[]
    totalSessions: number
}

/**
 * Calculate engagement profile from learning signals
 */
export function calculateEngagementProfile(signals: AdaptiveLearningSignal[]): EngagementProfile {
    if (signals.length === 0) {
        return {
            averageVideoCompletion: 0,
            averageAccuracy: 0,
            averageEngagement: 0,
            preferredDifficulty: 'easy',
            strongActivities: [],
            weakActivities: [],
            totalSessions: 0,
        }
    }

    const avgCompletion = signals.reduce((sum, s) => sum + Number(s.video_completion), 0) / signals.length
    const avgAccuracy = signals.reduce((sum, s) => sum + Number(s.accuracy), 0) / signals.length
    const avgEngagement = signals.reduce((sum, s) => sum + Number(s.engagement_score), 0) / signals.length

    // Determine preferred difficulty based on accuracy
    let preferredDifficulty: DifficultyLevel = 'easy'
    if (avgAccuracy >= 80) preferredDifficulty = 'hard'
    else if (avgAccuracy >= 50) preferredDifficulty = 'medium'

    // Find strong/weak activities
    const activityScores: Record<string, number[]> = {}
    signals.forEach(s => {
        if (!activityScores[s.activity_type]) activityScores[s.activity_type] = []
        activityScores[s.activity_type].push(Number(s.engagement_score))
    })

    const activityAverages = Object.entries(activityScores).map(([type, scores]) => ({
        type,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))

    activityAverages.sort((a, b) => b.avg - a.avg)

    return {
        averageVideoCompletion: avgCompletion,
        averageAccuracy: avgAccuracy,
        averageEngagement: avgEngagement,
        preferredDifficulty,
        strongActivities: activityAverages.filter(a => a.avg >= 70).map(a => a.type),
        weakActivities: activityAverages.filter(a => a.avg < 50).map(a => a.type),
        totalSessions: signals.length,
    }
}

/**
 * Recommend next difficulty based on recent performance
 */
export function recommendDifficulty(signals: AdaptiveLearningSignal[]): DifficultyLevel {
    if (signals.length < 3) return 'easy'

    // Look at last 5 signals
    const recent = signals.slice(-5)
    const avgAccuracy = recent.reduce((sum, s) => sum + Number(s.accuracy), 0) / recent.length
    const avgEngagement = recent.reduce((sum, s) => sum + Number(s.engagement_score), 0) / recent.length

    // If accuracy is high and engagement is good → harder
    if (avgAccuracy >= 80 && avgEngagement >= 70) return 'hard'
    if (avgAccuracy >= 50 && avgEngagement >= 50) return 'medium'
    return 'easy'
}

/**
 * Reorder videos based on child's engagement profile
 * Prioritizes:
 * 1. Videos matching recommended difficulty
 * 2. Categories the child is weak in (to improve)
 * 3. New content (not recently viewed)
 */
export function reorderContent(
    videos: Video[],
    profile: EngagementProfile,
    viewedVideoIds: string[] = []
): Video[] {
    const scored = videos.map(video => {
        let score = 0

        // Prefer recommended difficulty
        if (video.difficulty === profile.preferredDifficulty) score += 30

        // Adjacent difficulties are okay
        const difficultyOrder: DifficultyLevel[] = ['easy', 'medium', 'hard']
        const recIdx = difficultyOrder.indexOf(profile.preferredDifficulty)
        const vidIdx = difficultyOrder.indexOf(video.difficulty)
        if (Math.abs(recIdx - vidIdx) === 1) score += 15

        // Boost categories where child is weak
        if (profile.weakActivities.includes(video.category)) score += 20

        // Prefer unseen content
        if (!viewedVideoIds.includes(video.id)) score += 25

        // Small random factor for variety
        score += Math.random() * 10

        return { video, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.map(s => s.video)
}

/**
 * Calculate overall readiness score (0-100) for content advancement
 */
export function calculateReadinessScore(signals: AdaptiveLearningSignal[]): number {
    if (signals.length === 0) return 0

    const recent = signals.slice(-10)
    const avgAccuracy = recent.reduce((sum, s) => sum + Number(s.accuracy), 0) / recent.length
    const avgCompletion = recent.reduce((sum, s) => sum + Number(s.video_completion), 0) / recent.length
    const avgEngagement = recent.reduce((sum, s) => sum + Number(s.engagement_score), 0) / recent.length

    // Weighted score
    return Math.round(avgAccuracy * 0.4 + avgCompletion * 0.3 + avgEngagement * 0.3)
}
