/**
 * PetalPath Activity Engine — Type Definitions
 * All types used by the activity engine, speech/camera evaluators, and decision engine.
 */

// ─── Mascot States ───
export type MascotEmotion = 'happy' | 'encouraging' | 'thinking' | 'celebrating'

// ─── Speech Types ───
export interface SpeechAttempt {
    round: number
    transcript: string
    normalizedTranscript: string
    matchedPhoneme: string | null
    score: number           // 0 or 1 (matched or not)
    timestamp: number
}

export interface SpeechResult {
    attempts: SpeechAttempt[]
    correctCount: number
    totalRounds: number
    accuracy: number        // correctCount / totalRounds (0–1)
    passed: boolean         // accuracy >= 0.6
}

export interface SpeechConfig {
    topic: string           // e.g. "A"
    prompt: string          // e.g. "Say the sound of A"
    targetPhonemes: string[] // e.g. ["a", "ay", "eh", "aa"]
    repetitions: number     // 5 (or 3 on retry)
}

// ─── Camera Types ───
export interface CameraResult {
    label: string
    confidence: number      // 0–1
    passed: boolean         // confidence >= 0.6
    method: 'emnist' | 'coco-ssd' | 'fallback-quiz'
}

export interface CameraConfig {
    topic: string           // e.g. "A"
    prompt: string          // e.g. "Draw the letter A on paper"
    targetLabel: string     // e.g. "A"
    activityType: 'draw' | 'find' | 'quiz'  // draw letter, find object, or tap quiz
}

// ─── Fallback Quiz Types ───
export interface QuizOption {
    label: string
    emoji: string
    isCorrect: boolean
}

// ─── Activity Config ───
export interface ActivityConfig {
    topic: string
    category: string
    speech: SpeechConfig
    camera: CameraConfig
}

// ─── Decision Engine Types ───
export type Decision = 'SUCCESS' | 'RETRY_SPEECH' | 'RETRY_DRAW' | 'FAILSAFE_SKIP'

export interface DecisionResult {
    decision: Decision
    message: string             // child-friendly message
    mascotEmotion: MascotEmotion
    finalScore: number          // weighted: speech*0.6 + camera*0.4
    priorityScore: number       // 1 - finalScore
    shouldReplay: boolean
    replayType?: 'speech_segment' | 'visual_instruction' | 'full_video'
}

// ─── Topic Result (one per topic processed) ───
export interface TopicResult {
    topic: string
    speech: SpeechResult
    camera: CameraResult
    decision: DecisionResult
    speechAttemptCount: number
    cameraAttemptCount: number
    status: 'strong' | 'weak' | 'skipped'
}

// ─── Activity Engine State ───
export type EnginePhase =
    | 'idle'
    | 'generating'
    | 'speech'
    | 'camera'
    | 'evaluating'
    | 'decision'
    | 'retry_speech'
    | 'retry_camera'
    | 'replay'
    | 'skip_message'
    | 'next_topic'
    | 'complete'

export interface EngineState {
    phase: EnginePhase
    currentTopicIndex: number
    topics: ActivityConfig[]
    results: TopicResult[]
    retryCount: number
    maxRetries: number          // 2
}

// ─── Activity Result (for API/storage) ───
export interface ActivityResultPayload {
    child_id: string
    video_id: string
    topic: string
    speech_score: number
    camera_score: number
    final_score: number
    priority_score: number
    speech_attempts: number
    camera_attempts: number
    status: 'strong' | 'weak' | 'skipped'
    decision: Decision
}

// ─── Video with Tags (extended from base Video type) ───
export interface VideoWithTags {
    id: string
    title: string
    video_url?: string
    thumbnail_url?: string
    category: string
    difficulty: string
    tags: string[]
    duration?: number
    // Curriculum fields
    domain?: string
    stage?: string
    learning_order?: number
}
