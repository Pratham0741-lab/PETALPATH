export type UserRole = 'parent' | 'child' | 'admin'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type ActivityType = 'video' | 'speaking' | 'camera' | 'physical'
export type VideoCategory = 'language' | 'math' | 'science' | 'art' | 'music' | 'social' | 'motor_skills'

export interface Profile {
    id: string
    email: string
    full_name: string
    role: UserRole
    avatar_url?: string
    created_at: string
    updated_at: string
}

export interface Child {
    id: string
    parent_id: string
    name: string
    age: number
    avatar: string
    pin_code: string
    learning_profile: {
        preferred_difficulty: DifficultyLevel
        interests: string[]
        learning_pace: string
    }
    created_at: string
    updated_at: string
}

export interface Video {
    id: string
    title: string
    description?: string
    category: VideoCategory
    difficulty: DifficultyLevel
    language: string
    video_url?: string
    thumbnail_url?: string
    duration: number
    tags: string[]
    is_published: boolean
    created_by?: string
    created_at: string
    updated_at: string
}

export interface Activity {
    id: string
    type: ActivityType
    title: string
    instructions?: string
    visual_instructions: unknown[]
    video_id?: string
    difficulty: DifficultyLevel
    duration_seconds: number
    created_at: string
}

export interface Session {
    id: string
    child_id: string
    session_date: string
    activities: unknown[]
    completion_rate: number
    total_duration: number
    started_at: string
    completed_at?: string
    created_at: string
}

export interface Progress {
    id: string
    child_id: string
    session_id?: string
    activity_type: ActivityType
    performance_score: number
    engagement_time: number
    completed: boolean
    metadata: Record<string, unknown>
    timestamp: string
}

export interface AdaptiveLearningSignal {
    id: string
    child_id: string
    video_completion: number
    accuracy: number
    engagement_score: number
    activity_type: ActivityType
    difficulty: DifficultyLevel
    response_time: number
    timestamp: string
}

export interface DiscoveryView {
    id: string
    child_id: string
    video_id: string
    viewed_at: string
    created_at: string
}
