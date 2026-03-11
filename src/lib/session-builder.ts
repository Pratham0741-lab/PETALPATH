import type { Video, DifficultyLevel, ActivityType } from './types'

/**
 * Session Builder
 * Constructs personalized 10–20 minute learning sessions
 */

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
 * Build a learning session from available videos and recommended difficulty
 */
export function buildSession(
    videos: Video[],
    difficulty: DifficultyLevel = 'easy',
    targetDuration: number = 900 // 15 minutes in seconds
): SessionPlan {
    // Pick a video matching difficulty
    const matchingVideos = videos.filter(v => v.difficulty === difficulty && v.is_published)
    const video = matchingVideos.length > 0
        ? matchingVideos[Math.floor(Math.random() * matchingVideos.length)]
        : videos.find(v => v.is_published) || null

    const videoDuration = video ? Math.min(video.duration || 180, 300) : 180 // max 5 minutes

    const activities: SessionActivity[] = [
        {
            type: 'video',
            title: video ? video.title : 'Learning Video',
            instructions: 'Watch the video carefully!',
            duration: videoDuration,
            videoId: video?.id,
            order: 1,
        },
        {
            type: 'speaking',
            title: 'Speaking Time',
            instructions: 'Repeat the sounds and words!',
            duration: Math.min(180, targetDuration * 0.2), // 20% of session
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

    const estimatedDuration = activities.reduce((sum, a) => sum + a.duration, 0)

    return {
        activities,
        estimatedDuration,
        difficulty,
    }
}
