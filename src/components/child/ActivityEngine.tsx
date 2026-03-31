'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type {
    VideoWithTags,
    ActivityConfig,
    SpeechResult,
    CameraResult,
    TopicResult,
    EnginePhase,
    DecisionResult,
    ActivityResultPayload,
} from '@/lib/activity-types'
import { generateActivities, reduceActivityDifficulty } from '@/lib/activity-generator'
import { evaluate, getTopicStatus, getMascotEmotionForPhase } from '@/lib/decision-engine'
import SpeakingActivity from './SpeakingActivity'
import CameraActivity from './CameraActivity'
import MascotGuide from './MascotGuide'
import CelebrationOverlay from './CelebrationOverlay'

interface ActivityEngineProps {
    video: VideoWithTags
    childId: string
    weakTopics?: string[]
    onComplete: (results: TopicResult[]) => void
    onReplayVideo?: () => void
}

export default function ActivityEngine({
    video,
    childId,
    weakTopics = [],
    onComplete,
    onReplayVideo,
}: ActivityEngineProps) {
    // ─── Engine State ───
    const [phase, setPhase] = useState<EnginePhase>('generating')
    const [activities, setActivities] = useState<ActivityConfig[]>([])
    const [currentTopicIdx, setCurrentTopicIdx] = useState(0)
    const [retryCount, setRetryCount] = useState(0)
    const [results, setResults] = useState<TopicResult[]>([])

    // ─── Current round state ───
    const [currentSpeechResult, setCurrentSpeechResult] = useState<SpeechResult | null>(null)
    const [currentCameraResult, setCurrentCameraResult] = useState<CameraResult | null>(null)
    const [currentDecision, setCurrentDecision] = useState<DecisionResult | null>(null)
    const [showCelebration, setShowCelebration] = useState(false)

    // ─── Attempt counters ───
    const speechAttemptCount = useRef(0)
    const cameraAttemptCount = useRef(0)

    // ─── Mascot ───
    const mascotEmotion = getMascotEmotionForPhase(phase)
    const [mascotMessage, setMascotMessage] = useState('Let me prepare your activities! 🌸')

    const currentActivity = activities[currentTopicIdx] || null

    // ═══ Phase 1: Generate activities ═══
    useEffect(() => {
        if (phase !== 'generating') return

        const generated = generateActivities(video, weakTopics, 2)

        if (generated.length === 0) {
            // No topics to process — skip to complete
            setMascotMessage('All done! Great watching! 🌟')
            setPhase('complete')
            onComplete([])
            return
        }

        setActivities(generated)
        setMascotMessage(`Let's practice "${generated[0].topic.toUpperCase()}"! 🎵`)

        // Brief pause then start speech
        setTimeout(() => {
            setPhase('speech')
            speechAttemptCount.current = 1
        }, 1500)
    }, [phase === 'generating'])

    // ═══ Handle Speech Complete ═══
    const handleSpeechComplete = useCallback((result: SpeechResult) => {
        setCurrentSpeechResult(result)
        setMascotMessage(result.passed
            ? 'Great speaking! Now let\'s draw! ✏️'
            : 'Good try! Now let\'s draw! ✏️'
        )

        // Move to camera phase
        setTimeout(() => {
            setPhase('camera')
            cameraAttemptCount.current += 1
        }, 1000)
    }, [])

    // ═══ Handle Camera Complete ═══
    const handleCameraComplete = useCallback((result: CameraResult) => {
        setCurrentCameraResult(result)
        setPhase('evaluating')
        setMascotMessage('Let me check your work... 🤔')

        // Evaluate after brief thinking animation
        setTimeout(() => {
            if (!currentSpeechResult) return

            const decision = evaluate(currentSpeechResult, result, retryCount)
            setCurrentDecision(decision)
            setMascotMessage(decision.message)
            setPhase('decision')
        }, 1500)
    }, [currentSpeechResult, retryCount])

    // ═══ Handle Decision Actions ═══
    const processDecision = useCallback(async (decision: DecisionResult) => {
        const activity = currentActivity
        if (!activity) return

        switch (decision.decision) {
            case 'SUCCESS': {
                // Save result
                const topicResult: TopicResult = {
                    topic: activity.topic,
                    speech: currentSpeechResult!,
                    camera: currentCameraResult!,
                    decision,
                    speechAttemptCount: speechAttemptCount.current,
                    cameraAttemptCount: cameraAttemptCount.current,
                    status: 'strong',
                }
                const newResults = [...results, topicResult]
                setResults(newResults)

                // Save to API
                saveResult(topicResult)

                // Celebration!
                setShowCelebration(true)

                // Move to next topic or complete
                setTimeout(() => {
                    setShowCelebration(false)
                    moveToNextTopic(newResults)
                }, 3000)
                break
            }

            case 'RETRY_SPEECH': {
                setRetryCount(prev => prev + 1)
                speechAttemptCount.current += 1

                // Reduce difficulty on retry
                if (retryCount === 0) {
                    const reduced = reduceActivityDifficulty(activity)
                    const newActivities = [...activities]
                    newActivities[currentTopicIdx] = reduced
                    setActivities(newActivities)
                }

                // Context-aware replay message
                setMascotMessage('Let\'s practice the sound once more! You can do it! 🗣️')

                setTimeout(() => {
                    setCurrentSpeechResult(null)
                    setCurrentCameraResult(null)
                    setCurrentDecision(null)
                    setPhase('speech')
                }, 2000)
                break
            }

            case 'RETRY_DRAW': {
                setRetryCount(prev => prev + 1)
                cameraAttemptCount.current += 1

                setMascotMessage('Let\'s try drawing again! Look at the shape carefully! ✏️')

                setTimeout(() => {
                    setCurrentCameraResult(null)
                    setCurrentDecision(null)
                    setPhase('camera')
                }, 2000)
                break
            }

            case 'FAILSAFE_SKIP': {
                const topicResult: TopicResult = {
                    topic: activity.topic,
                    speech: currentSpeechResult!,
                    camera: currentCameraResult!,
                    decision,
                    speechAttemptCount: speechAttemptCount.current,
                    cameraAttemptCount: cameraAttemptCount.current,
                    status: 'weak',
                }
                const newResults = [...results, topicResult]
                setResults(newResults)

                // Save to API
                saveResult(topicResult)

                setPhase('skip_message')

                setTimeout(() => {
                    moveToNextTopic(newResults)
                }, 3000)
                break
            }
        }
    }, [currentActivity, currentSpeechResult, currentCameraResult, results, retryCount, activities, currentTopicIdx])

    // ═══ Move to Next Topic ═══
    const moveToNextTopic = useCallback((currentResults: TopicResult[]) => {
        const nextIdx = currentTopicIdx + 1
        if (nextIdx >= activities.length) {
            // All topics done
            setPhase('complete')
            setMascotMessage('You did amazing today! 🌟')
            onComplete(currentResults)
        } else {
            // Reset for next topic
            setCurrentTopicIdx(nextIdx)
            setRetryCount(0)
            speechAttemptCount.current = 0
            cameraAttemptCount.current = 0
            setCurrentSpeechResult(null)
            setCurrentCameraResult(null)
            setCurrentDecision(null)
            setMascotMessage(`Now let's learn "${activities[nextIdx].topic.toUpperCase()}"! 🌈`)

            setTimeout(() => {
                setPhase('speech')
                speechAttemptCount.current = 1
            }, 1500)
        }
    }, [currentTopicIdx, activities, onComplete])

    // ═══ Save Result to API ═══
    const saveResult = useCallback(async (topicResult: TopicResult) => {
        try {
            const payload: ActivityResultPayload = {
                child_id: childId,
                video_id: video.id,
                topic: topicResult.topic,
                speech_score: topicResult.speech.accuracy,
                camera_score: topicResult.camera.confidence,
                final_score: topicResult.decision.finalScore,
                priority_score: topicResult.decision.priorityScore,
                speech_attempts: topicResult.speechAttemptCount,
                camera_attempts: topicResult.cameraAttemptCount,
                status: topicResult.status,
                decision: topicResult.decision.decision,
            }

            await fetch('/api/activity-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
        } catch (err) {
            console.error('Failed to save activity result:', err)
        }
    }, [childId, video.id])

    // ═══ Skip handler (for frustrated children) ═══
    const handleSkip = useCallback(() => {
        if (!currentActivity) return

        const skipResult: TopicResult = {
            topic: currentActivity.topic,
            speech: currentSpeechResult || { attempts: [], correctCount: 0, totalRounds: 0, accuracy: 0, passed: false },
            camera: currentCameraResult || { label: '', confidence: 0, passed: false, method: 'fallback-quiz' },
            decision: {
                decision: 'FAILSAFE_SKIP',
                message: 'We\'ll learn this tomorrow 😊',
                mascotEmotion: 'encouraging',
                finalScore: 0,
                priorityScore: 1,
                shouldReplay: false,
            },
            speechAttemptCount: speechAttemptCount.current,
            cameraAttemptCount: cameraAttemptCount.current,
            status: 'skipped',
        }

        const newResults = [...results, skipResult]
        setResults(newResults)
        saveResult(skipResult)
        moveToNextTopic(newResults)
    }, [currentActivity, currentSpeechResult, currentCameraResult, results])

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════

    return (
        <div className="flex flex-col items-center w-full">
            <CelebrationOverlay
                show={showCelebration}
                onComplete={() => setShowCelebration(false)}
                message="Topic mastered! ⭐"
            />

            {/* Topic Progress Bar */}
            {activities.length > 0 && phase !== 'complete' && (
                <div className="w-full mb-6">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-sm font-bold text-slate-500">
                            Topic {currentTopicIdx + 1} of {activities.length}
                        </span>
                        {currentActivity && (
                            <span className="text-sm font-bold text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
                                {currentActivity.topic.toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
                            animate={{
                                width: `${((currentTopicIdx + (phase === 'camera' || phase === 'evaluating' || phase === 'decision' ? 0.5 : 0)) / activities.length) * 100}%`,
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            )}

            {/* Phase Indicator Pills */}
            {phase !== 'complete' && phase !== 'generating' && phase !== 'skip_message' && (
                <div className="flex gap-2 mb-5">
                    {[
                        { label: '🗣️ Speak', active: phase === 'speech' || phase === 'retry_speech', done: !!currentSpeechResult },
                        { label: '📷 Show', active: phase === 'camera' || phase === 'retry_camera', done: !!currentCameraResult },
                        { label: '✨ Check', active: phase === 'evaluating' || phase === 'decision', done: phase === 'decision' && !!currentDecision },
                    ].map((pill, i) => (
                        <div
                            key={i}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
                                pill.done
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : pill.active
                                        ? 'bg-purple-100 text-purple-600 shadow-sm'
                                        : 'bg-gray-50 text-gray-400'
                            }`}
                        >
                            {pill.done ? '✅' : ''} {pill.label}
                        </div>
                    ))}
                </div>
            )}

            {/* Main Activity Content */}
            <div className="w-full card-premium min-h-[340px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {/* Generating */}
                    {phase === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                className="text-5xl"
                            >
                                🌸
                            </motion.div>
                            <p className="text-lg font-bold text-slate-500">Preparing activities...</p>
                        </motion.div>
                    )}

                    {/* Speech Phase */}
                    {(phase === 'speech' || phase === 'retry_speech') && currentActivity && (
                        <motion.div
                            key={`speech-${currentTopicIdx}-${retryCount}`}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="w-full"
                        >
                            <SpeakingActivity
                                config={currentActivity.speech}
                                onComplete={handleSpeechComplete}
                            />
                        </motion.div>
                    )}

                    {/* Camera Phase */}
                    {(phase === 'camera' || phase === 'retry_camera') && currentActivity && (
                        <motion.div
                            key={`camera-${currentTopicIdx}-${retryCount}`}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="w-full"
                        >
                            <CameraActivity
                                config={currentActivity.camera}
                                onComplete={handleCameraComplete}
                            />
                        </motion.div>
                    )}

                    {/* Evaluating */}
                    {phase === 'evaluating' && (
                        <motion.div
                            key="evaluating"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="text-6xl"
                            >
                                🤔
                            </motion.div>
                            <p className="text-lg font-bold text-slate-500">Checking your work...</p>
                        </motion.div>
                    )}

                    {/* Decision */}
                    {phase === 'decision' && currentDecision && (
                        <motion.div
                            key="decision"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.6 }}
                                className="text-6xl"
                            >
                                {currentDecision.decision === 'SUCCESS' ? '🌟' :
                                 currentDecision.decision === 'FAILSAFE_SKIP' ? '🌸' : '💪'}
                            </motion.div>
                            <p className="text-xl font-bold text-slate-700 text-center">
                                {currentDecision.message}
                            </p>

                            {/* Score display (gentle, star-based) */}
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                            i < Math.round(currentDecision.finalScore * 5)
                                                ? 'bg-gradient-to-br from-yellow-300 to-amber-400'
                                                : 'bg-gray-100'
                                        }`}
                                    >
                                        {i < Math.round(currentDecision.finalScore * 5) ? '⭐' : ''}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Action button for retries */}
                            {currentDecision.decision !== 'SUCCESS' && currentDecision.decision !== 'FAILSAFE_SKIP' && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => processDecision(currentDecision)}
                                    className="px-8 py-3 rounded-2xl text-white font-bold shadow-xl cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                                        boxShadow: '0 8px 24px rgba(139,92,246,0.25)',
                                    }}
                                >
                                    Let&apos;s try again! 💪
                                </motion.button>
                            )}

                            {/* Auto-process SUCCESS and FAILSAFE */}
                            {(currentDecision.decision === 'SUCCESS' || currentDecision.decision === 'FAILSAFE_SKIP') && (
                                <AutoProcessor decision={currentDecision} onProcess={processDecision} />
                            )}
                        </motion.div>
                    )}

                    {/* Skip Message */}
                    {phase === 'skip_message' && (
                        <motion.div
                            key="skip"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-7xl"
                            >
                                🌸
                            </motion.div>
                            <p className="text-xl font-bold text-slate-600 text-center">
                                We&apos;ll learn this tomorrow 😊
                            </p>
                            <p className="text-sm text-slate-400 font-medium text-center">
                                Great try! Every practice makes you better! 💛
                            </p>
                        </motion.div>
                    )}

                    {/* Complete */}
                    {phase === 'complete' && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-5"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 1 }}
                                className="text-7xl"
                            >
                                🏆
                            </motion.div>
                            <p className="text-2xl font-black text-slate-700">Activities Done!</p>

                            {/* Results summary */}
                            <div className="flex gap-3 flex-wrap justify-center">
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                                            r.status === 'strong'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : r.status === 'weak'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-gray-50 text-gray-500'
                                        }`}
                                    >
                                        {r.status === 'strong' ? '⭐' : r.status === 'weak' ? '🌸' : '⏭️'}
                                        {r.topic.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            {phase !== 'complete' && phase !== 'generating' && (
                <div className="flex items-center justify-center gap-3 mt-5">
                    {/* Replay button */}
                    {onReplayVideo && (
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={onReplayVideo}
                            className="px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur text-slate-500 font-semibold text-sm border border-gray-200 cursor-pointer flex items-center gap-2 hover:bg-white transition-all"
                        >
                            🔁 Replay Video
                        </motion.button>
                    )}

                    {/* Skip button (subtle) */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSkip}
                        className="px-5 py-2.5 rounded-xl text-slate-400 font-medium text-sm cursor-pointer hover:text-slate-500 hover:bg-gray-50 transition-all"
                    >
                        Skip ➡
                    </motion.button>
                </div>
            )}

            {/* Mascot */}
            {phase !== 'complete' && (
                <div className="mt-5">
                    <MascotGuide
                        size="sm"
                        emotion={currentDecision?.mascotEmotion || mascotEmotion}
                        message={mascotMessage}
                    />
                </div>
            )}
        </div>
    )
}

/**
 * AutoProcessor: triggers decision processing after a display delay.
 */
function AutoProcessor({
    decision,
    onProcess,
}: {
    decision: DecisionResult
    onProcess: (d: DecisionResult) => void
}) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onProcess(decision)
        }, 2000)
        return () => clearTimeout(timer)
    }, [decision, onProcess])

    return null
}
