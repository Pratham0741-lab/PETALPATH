/**
 * PetalPath Decision Engine
 * 
 * Core failsafe + retry logic with weighted scoring.
 * Handles all pass/fail combinations and produces child-friendly outcomes.
 */

import type {
    Decision,
    DecisionResult,
    SpeechResult,
    CameraResult,
    MascotEmotion,
} from './activity-types'

// ─── Constants ───
const SPEECH_WEIGHT = 0.6
const CAMERA_WEIGHT = 0.4
const PASS_THRESHOLD = 0.6
const MAX_RETRIES = 2

// ─── Encouraging Messages ───
const SUCCESS_MESSAGES = [
    'Amazing job! 🌟',
    'You are a superstar! ⭐',
    'Wonderful! You did it! 🎉',
    'So proud of you! 💖',
    'Brilliant work! 🌈',
]

const PARTIAL_MESSAGES = [
    'Almost there! Let\'s try once more 💪',
    'You\'re doing great! One more try! 🌸',
    'So close! Let\'s give it another go! ✨',
    'Good effort! Let\'s try again! 🌻',
]

const FAILSAFE_MESSAGES = [
    'We\'ll learn this tomorrow 😊',
    'Great try! We\'ll practice more next time 🌸',
    'You did your best! Let\'s come back to this 🌻',
]

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Evaluate speech + camera results and produce a decision.
 * 
 * @param speechResult - Result from speech evaluation
 * @param cameraResult - Result from camera evaluation
 * @param retryCount - How many retries have been attempted so far
 * @returns DecisionResult with action, message, and scores
 */
export function evaluate(
    speechResult: SpeechResult,
    cameraResult: CameraResult,
    retryCount: number = 0
): DecisionResult {
    const speechScore = speechResult.accuracy
    const cameraScore = cameraResult.confidence

    const finalScore = speechScore * SPEECH_WEIGHT + cameraScore * CAMERA_WEIGHT
    const priorityScore = Math.max(0, Math.min(1, 1 - finalScore))

    const speechPassed = speechScore >= PASS_THRESHOLD
    const cameraPassed = cameraScore >= PASS_THRESHOLD

    // ─── Both Pass → SUCCESS ───
    if (speechPassed && cameraPassed) {
        return {
            decision: 'SUCCESS',
            message: randomFrom(SUCCESS_MESSAGES),
            mascotEmotion: 'celebrating',
            finalScore,
            priorityScore,
            shouldReplay: false,
        }
    }

    // ─── Retries exhausted → FAILSAFE ───
    if (retryCount >= MAX_RETRIES) {
        return {
            decision: 'FAILSAFE_SKIP',
            message: randomFrom(FAILSAFE_MESSAGES),
            mascotEmotion: 'encouraging',
            finalScore,
            priorityScore,
            shouldReplay: false,
        }
    }

    // ─── Both Fail → FAILSAFE or retry if first attempt ───
    if (!speechPassed && !cameraPassed) {
        if (retryCount === 0) {
            // First time both fail → give one more chance with reduced difficulty
            return {
                decision: 'RETRY_SPEECH',
                message: randomFrom(PARTIAL_MESSAGES),
                mascotEmotion: 'encouraging',
                finalScore,
                priorityScore,
                shouldReplay: true,
                replayType: 'full_video',
            }
        }
        // Already retried → failsafe
        return {
            decision: 'FAILSAFE_SKIP',
            message: randomFrom(FAILSAFE_MESSAGES),
            mascotEmotion: 'encouraging',
            finalScore,
            priorityScore,
            shouldReplay: false,
        }
    }

    // ─── Speech failed, Camera passed → RETRY_SPEECH ───
    if (!speechPassed && cameraPassed) {
        return {
            decision: 'RETRY_SPEECH',
            message: 'Let\'s practice the sound once more! 🗣️',
            mascotEmotion: 'encouraging',
            finalScore,
            priorityScore,
            shouldReplay: true,
            replayType: 'speech_segment',
        }
    }

    // ─── Speech passed, Camera failed → RETRY_DRAW ───
    return {
        decision: 'RETRY_DRAW',
        message: 'Let\'s try drawing again! ✏️',
        mascotEmotion: 'encouraging',
        finalScore,
        priorityScore,
        shouldReplay: true,
        replayType: 'visual_instruction',
    }
}

/**
 * Determine the topic status based on the decision.
 */
export function getTopicStatus(decision: Decision): 'strong' | 'weak' | 'skipped' {
    switch (decision) {
        case 'SUCCESS':
            return 'strong'
        case 'FAILSAFE_SKIP':
            return 'weak'
        default:
            return 'weak'
    }
}

/**
 * Check if we should auto-replay based on struggle count.
 * If child struggles twice → auto replay.
 */
export function shouldAutoReplay(retryCount: number): boolean {
    return retryCount >= 2
}

/**
 * Get the recommended number of repetitions based on retry context.
 * First attempt = 5, retry = 3.
 */
export function getRepetitions(retryCount: number): number {
    return retryCount === 0 ? 5 : 3
}

/**
 * Get appropriate mascot emotion for a given engine phase.
 */
export function getMascotEmotionForPhase(phase: string): MascotEmotion {
    switch (phase) {
        case 'speech':
        case 'camera':
            return 'happy'
        case 'evaluating':
        case 'generating':
            return 'thinking'
        case 'retry_speech':
        case 'retry_camera':
        case 'skip_message':
            return 'encouraging'
        case 'complete':
            return 'celebrating'
        default:
            return 'happy'
    }
}
