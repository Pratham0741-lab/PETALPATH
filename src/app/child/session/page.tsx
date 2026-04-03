'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/child/VideoPlayer'
import ActivityEngine from '@/components/child/ActivityEngine'
import PhysicalActivity from '@/components/child/PhysicalActivity'
import CelebrationOverlay from '@/components/child/CelebrationOverlay'
import LearningPlayground from '@/components/child/LearningPlayground'
import type { VideoWithTags, TopicResult } from '@/lib/activity-types'
import type { ReinforcementActivity } from '@/lib/reinforcement-engine'
import { VideoIcon, TrophyIcon, StarIcon, PetalFlower, ArrowBackIcon, SparkleIcon } from '@/components/ui/PetalIcons'

// ─── Session State Machine ──────────────────────────────────────
// VIDEO → ACTIVITY → DECISION → NEXT VIDEO → REPEAT
type SessionMode = 'video' | 'activity'
type SessionPhase = 'loading' | 'video' | 'activities' | 'reinforcement' | 'bonus' | 'complete'

// ─── Video shape from the new clean GET APIs ────────────────────
interface APIVideo {
    id: string
    title: string
    video_url?: string
    thumbnail_url?: string
    topics?: string[]
    domain?: string
    stage?: string
    sequence_order?: number
    duration?: number
    category?: string
    difficulty?: string
}

interface CurriculumMeta {
    reason: string
    progress: {
        current_domain: string
        videos_in_domain: number
        completed_in_domain: number
        current_topic: string
        current_learning_topic?: string
        stage?: string
        percentage: number
    }
    reinforcement?: ReinforcementActivity | null
}

const DOMAIN_LABELS: Record<string, { name: string; emoji: string; color: string }> = {
    numbers: { name: 'Number Forest', emoji: '🌲', color: '#34D399' },
    alphabet: { name: 'Alphabet Mountain', emoji: '🏔', color: '#60A5FA' },
    phonics: { name: 'Phonics Valley', emoji: '🔊', color: '#F472B6' },
    shapes: { name: 'Shape Island', emoji: '🔺', color: '#FBBF24' },
}

const STAGE_LABELS: Record<string, { name: string; emoji: string; color: string }> = {
    foundation: { name: 'Foundation', emoji: '🌱', color: '#34D399' },
    understanding: { name: 'Understanding', emoji: '🧠', color: '#60A5FA' },
    application: { name: 'Application', emoji: '🚀', color: '#F472B6' },
}

const REASON_LABELS: Record<string, string> = {
    first_video: 'Starting your journey!',
    next_in_path: 'Up next in your path',
    phonics_continuation: 'Now learn the sound!',
    reinforcement_session: 'Quick review time!',
    domain_progression: 'New adventure ahead!',
    weak_topic_reinforcement: 'Let\'s practice this again!',
    domain_locked: 'Keep learning to unlock!',
}

// ─── Convert API response video → internal VideoWithTags ────────
function apiVideoToInternal(apiVideo: APIVideo): VideoWithTags {
    return {
        id: apiVideo.id,
        title: apiVideo.title,
        video_url: apiVideo.video_url,
        thumbnail_url: apiVideo.thumbnail_url,
        category: apiVideo.category || '',
        difficulty: apiVideo.difficulty || 'easy',
        tags: apiVideo.topics || [],
        duration: apiVideo.duration,
        domain: apiVideo.domain,
        stage: apiVideo.stage,
        learning_order: apiVideo.sequence_order,
    }
}

function SessionContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // ─── Core State Machine ─────────────────────────────────
    const [mode, setMode] = useState<SessionMode>('video')
    const [sessionPhase, setSessionPhase] = useState<SessionPhase>('loading')
    const [video, setVideo] = useState<VideoWithTags | null>(null)
    const [weakTopics, setWeakTopics] = useState<string[]>([])
    const [activityResults, setActivityResults] = useState<TopicResult[]>([])
    const [showCelebration, setShowCelebration] = useState(false)
    const [childId, setChildId] = useState<string>('')
    const [curriculumMeta, setCurriculumMeta] = useState<CurriculumMeta | null>(null)
    const [reinforcement, setReinforcement] = useState<ReinforcementActivity | null>(null)
    const [videosWatchedInSession, setVideosWatchedInSession] = useState(0)

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Start Session — Fetch first video
    // ═══════════════════════════════════════════════════════════
    useEffect(() => {
        const id = sessionStorage.getItem('activeChildId') || ''
        setChildId(id)

        async function startSession() {
            try {
                const videoId = searchParams?.get('video_id') || undefined
                const domain = searchParams?.get('domain') || undefined

                // Case A: Specific video_id passed (from Explore Map click)
                if (videoId) {
                    const res = await fetch(`/api/video/${videoId}`)
                    const json = await res.json()
                    if (json.success && json.data) {
                        setVideo(apiVideoToInternal(json.data))
                        setMode('video')
                        setSessionPhase('video')

                        // Fetch weak topics in background
                        fetchWeakTopics(id)
                        return
                    }
                }

                // Case B: Domain specified — use old curriculum engine for domain start
                if (domain && id) {
                    const res = await fetch('/api/next-video', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            child_id: id,
                            domain: domain,
                        }),
                    })
                    const data = await res.json()
                    if (data.next_video) {
                        setVideo({
                            id: data.next_video.id,
                            title: data.next_video.title,
                            video_url: data.next_video.video_url,
                            thumbnail_url: data.next_video.thumbnail_url,
                            category: data.next_video.category || '',
                            difficulty: data.next_video.difficulty || 'easy',
                            tags: data.next_video.tags || [],
                            duration: data.next_video.duration,
                            domain: data.next_video.domain,
                            stage: data.next_video.stage,
                            learning_order: data.next_video.learning_order,
                        })
                        setCurriculumMeta({
                            reason: data.reason,
                            progress: data.progress,
                            reinforcement: data.reinforcement,
                        })
                        setMode('video')
                        setSessionPhase('video')
                        fetchWeakTopics(id)
                        return
                    }
                }

                // Case C: Fresh start — GET /api/start
                const startRes = await fetch('/api/start')
                const startJson = await startRes.json()

                if (startJson.success && startJson.data) {
                    setVideo(apiVideoToInternal(startJson.data))
                    setMode('video')
                    setSessionPhase('video')
                } else {
                    // No videos available at all
                    setSessionPhase('complete')
                }

                // Fetch weak topics in background
                fetchWeakTopics(id)
            } catch (err) {
                console.error('[session] Failed to start:', err)
                setSessionPhase('video')
            }
        }

        startSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─── Fetch weak topics helper ───────────────────────────
    async function fetchWeakTopics(cid: string) {
        if (!cid) return
        try {
            const res = await fetch(`/api/activity-results?child_id=${cid}&status=weak`)
            const json = await res.json()
            if (json.weakTopics) setWeakTopics(json.weakTopics)
        } catch { /* non-critical */ }
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 7: Load NEXT video using clean GET API
    // ═══════════════════════════════════════════════════════════
    const loadNextVideo = useCallback(async () => {
        if (!video) return

        try {
            // Use the new GET /api/next-video?video_id=<uuid>
            const res = await fetch(`/api/next-video?video_id=${video.id}`)
            const json = await res.json()

            if (!json.success) {
                console.error('[session] Next-video API error:', json.error)
                setSessionPhase('complete')
                return
            }

            // Check if curriculum is done
            if (json.data.done) {
                setSessionPhase('complete')
                return
            }

            // Set new video
            const nextVideo = apiVideoToInternal(json.data.video)
            setVideo(nextVideo)
            setMode('video')
            setSessionPhase('video')
            setVideosWatchedInSession(prev => prev + 1)
        } catch (err) {
            console.error('[session] Failed to load next video:', err)
            setSessionPhase('complete')
        }
    }, [video])

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Video ends → Trigger Activity Engine
    // ═══════════════════════════════════════════════════════════
    const handleVideoComplete = useCallback(() => {
        if (video && video.tags && video.tags.length > 0) {
            // Switch to activity mode
            setMode('activity')
            setSessionPhase('activities')
        } else {
            // No topics to practice — skip to bonus
            setMode('activity')
            setSessionPhase('bonus')
        }
    }, [video])

    // ═══════════════════════════════════════════════════════════
    // STEP 5 & 6: Handle activity completion + save results
    // ═══════════════════════════════════════════════════════════
    const handleActivitiesComplete = useCallback((results: TopicResult[]) => {
        setActivityResults(results)

        // Save aggregate progress to API (fire-and-forget)
        if (childId) {
            const avgScore = results.length > 0
                ? results.reduce((sum, r) => sum + r.decision.finalScore, 0) / results.length
                : 0

            fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    child_id: childId,
                    activity_type: 'speaking',
                    performance_score: Math.round(avgScore * 100),
                    engagement_time: 120,
                    completed: true,
                    metadata: {
                        topics: results.map(r => r.topic),
                        decisions: results.map(r => r.decision.decision),
                        domain: video?.domain,
                        stage: video?.stage,
                    },
                }),
            }).catch(console.error)
        }

        // Move to bonus round
        setSessionPhase('bonus')
    }, [childId, video])

    // ═══════════════════════════════════════════════════════════
    // STEP 8: Replay — re-show video without changing state
    // ═══════════════════════════════════════════════════════════
    const handleReplayVideo = useCallback(() => {
        setMode('video')
        setSessionPhase('video')
    }, [])

    // ─── Bonus/Physical complete → celebration → next video ──
    const handleBonusComplete = useCallback(() => {
        // Award stars
        if (childId) {
            const strongCount = activityResults.filter(r => r.status === 'strong').length
            const stars = 3 + strongCount * 2
            const current = parseInt(localStorage.getItem(`stars_${childId}`) || '0')
            localStorage.setItem(`stars_${childId}`, (current + stars).toString())
        }

        // Show celebration, then load next video
        setShowCelebration(true)
        setTimeout(() => {
            setShowCelebration(false)
            loadNextVideo()
        }, 3500)
    }, [childId, activityResults, loadNextVideo])

    // ─── Reinforcement activity complete ─────────────────────
    const handleReinforcementComplete = useCallback(() => {
        setReinforcement(null)
        setMode('video')
        setSessionPhase('video')
    }, [])

    // ─── Derived UI state ────────────────────────────────────
    const domainInfo = video?.domain ? DOMAIN_LABELS[video.domain] : null
    const reasonLabel = curriculumMeta?.reason ? REASON_LABELS[curriculumMeta.reason] || '' : ''

    // ═══════════════════════════════════════════════════════════
    // RENDER: Loading
    // ═══════════════════════════════════════════════════════════
    if (sessionPhase === 'loading') {
        return (
            <main className="min-h-screen flex items-center justify-center bg-transparent relative">
                <LearningPlayground />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                        <PetalFlower size={56} />
                    </motion.div>
                    <p className="text-lg font-bold text-slate-500">Preparing your learning journey...</p>
                </div>
            </main>
        )
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER: Complete (all videos done)
    // ═══════════════════════════════════════════════════════════
    if (sessionPhase === 'complete') {
        const strongCount = activityResults.filter(r => r.status === 'strong').length
        const totalStars = 3 + strongCount * 2

        return (
            <main className="min-h-screen safe-area flex flex-col items-center justify-center px-6 relative overflow-hidden bg-transparent">
                <LearningPlayground />
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
                        style={{ background: 'rgba(250,204,21,0.15)' }}
                    />
                </div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-6 z-20"
                >
                    <TrophyIcon size={96} />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-black text-slate-800 mb-3 z-20"
                >
                    Amazing Journey! 🌟
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-slate-500 text-center mb-2 font-medium z-20"
                >
                    <span>You watched {videosWatchedInSession} videos and earned {totalStars} stars!</span>
                    <StarIcon size={22} />
                </motion.div>

                {/* Progress Summary */}
                {curriculumMeta?.progress && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-white/50 mb-6 z-20"
                    >
                        <p className="text-sm font-bold text-slate-600">
                            {domainInfo?.emoji} {domainInfo?.name}: {curriculumMeta.progress.completed_in_domain}/{curriculumMeta.progress.videos_in_domain} completed ({curriculumMeta.progress.percentage}%)
                        </p>
                    </motion.div>
                )}

                {activityResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex flex-wrap gap-2 justify-center mb-8 z-20"
                    >
                        {activityResults.map((r, i) => (
                            <div
                                key={i}
                                className={`px-4 py-2 rounded-full text-sm font-bold ${
                                    r.status === 'strong'
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : r.status === 'weak'
                                            ? 'bg-amber-100 text-amber-600'
                                            : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                {r.status === 'strong' ? '⭐' : '🌸'} {r.topic.toUpperCase()}
                            </div>
                        ))}
                    </motion.div>
                )}

                <div className="flex gap-4 z-20">
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push('/child/discover')}
                        className="px-6 py-4 rounded-2xl font-bold text-lg shadow-xl cursor-pointer relative overflow-hidden text-white"
                        style={{
                            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.2)',
                        }}
                    >
                        Explore Map 🗺
                    </motion.button>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push('/child')}
                        className="px-6 py-4 rounded-2xl text-slate-600 font-bold text-lg shadow-lg cursor-pointer bg-white/80 backdrop-blur-xl border border-white/50"
                    >
                        Home 🏠
                    </motion.button>
                </div>
            </main>
        )
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER: Active Session (VIDEO ↔ ACTIVITY loop)
    // ═══════════════════════════════════════════════════════════
    return (
        <main className="min-h-screen safe-area flex flex-col relative overflow-hidden bg-transparent">
            <LearningPlayground />

            <CelebrationOverlay
                show={showCelebration}
                onComplete={() => setShowCelebration(false)}
                message="Great job! Loading next lesson... 🌟"
            />

            {/* Ambient particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[{ color: '#C4B5FD' }, { color: '#7DD3FC' }, { color: '#6EE7B7' }].map((item, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: `${10 + i * 35}%`, top: `${15 + (i % 2) * 60}%` }}
                        animate={{ y: [0, -15, 0], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                    >
                        <SparkleIcon size={18} color={item.color} />
                    </motion.div>
                ))}
            </div>

            {/* ─── Top bar with curriculum info + mode indicator ─── */}
            <div className="relative z-10 flex items-center justify-between p-5">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push('/child')}
                    className="w-11 h-11 rounded-xl glass flex items-center justify-center shadow-md cursor-pointer"
                >
                    <ArrowBackIcon size={20} />
                </motion.button>

                <div className="flex items-center gap-3">
                    {/* Domain badge */}
                    {domainInfo && (
                        <div
                            className="px-4 py-2 rounded-full text-white text-sm font-bold shadow-md flex items-center gap-2"
                            style={{ background: domainInfo.color }}
                        >
                            <span>{domainInfo.emoji}</span>
                            <span className="hidden sm:block">{domainInfo.name}</span>
                        </div>
                    )}

                    {/* Mode indicator: VIDEO ↔ ACTIVITY */}
                    <div className="flex gap-2">
                        {[
                            { phase: 'video', label: '📺', active: mode === 'video' && sessionPhase === 'video' },
                            { phase: 'activities', label: '🧠', active: mode === 'activity' && sessionPhase === 'activities' },
                            { phase: 'bonus', label: '🏃', active: sessionPhase === 'bonus' || sessionPhase === 'reinforcement' },
                        ].map((p, i) => (
                            <div
                                key={i}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                                    p.active
                                        ? 'bg-purple-100 shadow-sm scale-110'
                                        : (sessionPhase === 'activities' && p.phase === 'video') || (sessionPhase === 'bonus' && p.phase !== 'bonus') || (sessionPhase === 'reinforcement' && p.phase === 'video')
                                            ? 'bg-emerald-100'
                                            : 'bg-gray-50'
                                }`}
                            >
                                {p.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Curriculum context bar (only during video phase) */}
            {curriculumMeta?.progress && sessionPhase === 'video' && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 mx-5 mb-3"
                >
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-3 shadow-sm border border-white/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{domainInfo?.emoji}</span>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">
                                        {curriculumMeta.reason === 'phonics_continuation'
                                            ? `Learning "${curriculumMeta.progress.current_learning_topic || curriculumMeta.progress.current_topic}" → Now the sound!`
                                            : `You are learning: ${curriculumMeta.progress.current_learning_topic || curriculumMeta.progress.current_topic}`
                                        }
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {reasonLabel}
                                        </p>
                                        {curriculumMeta.progress.stage && STAGE_LABELS[curriculumMeta.progress.stage] && (
                                            <span
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                                style={{ background: STAGE_LABELS[curriculumMeta.progress.stage].color }}
                                            >
                                                {STAGE_LABELS[curriculumMeta.progress.stage].emoji} {STAGE_LABELS[curriculumMeta.progress.stage].name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${curriculumMeta.progress.percentage}%` }}
                                        className="h-full rounded-full"
                                        style={{ background: domainInfo?.color || '#8B5CF6' }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-400">{curriculumMeta.progress.percentage}%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ─── Main Content Area ─── */}
            <div className="relative z-10 flex-1 px-5 pb-6 max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">

                    {/* ═══ VIDEO PHASE ═══ */}
                    {sessionPhase === 'video' && (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                                    style={{ background: domainInfo ? `linear-gradient(135deg, ${domainInfo.color}, ${domainInfo.color}cc)` : 'linear-gradient(135deg, #60A5FA, #22D3EE)' }}
                                >
                                    <VideoIcon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-700">Watch & Learn</h2>
                                    <p className="text-sm text-slate-400 font-medium">Step 1 — Watch the video</p>
                                </div>
                            </div>

                            <div className="card-premium">
                                <VideoPlayer
                                    videoUrl={video?.video_url}
                                    title={video?.title || 'Learning Video'}
                                    onComplete={handleVideoComplete}
                                />
                            </div>

                            {/* Topics preview from video.tags */}
                            {video?.tags && video.tags.length > 0 && (
                                <div className="mt-4 flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-400">Topics:</span>
                                    {video.tags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-purple-50 text-purple-500 text-xs font-bold">
                                            {tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleVideoComplete}
                                className="mt-4 w-full py-3 rounded-2xl glass text-slate-500 font-semibold text-sm hover:glass-strong transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                Skip to activities ➡
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ═══ REINFORCEMENT PHASE ═══ */}
                    {sessionPhase === 'reinforcement' && reinforcement && (
                        <motion.div
                            key="reinforcement"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center min-h-[50vh]"
                        >
                            <div className="flex items-center gap-3 mb-8 self-start">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}
                                >
                                    <span className="text-xl">🧠</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-700">Quick Review!</h2>
                                    <p className="text-sm text-slate-400 font-medium">Let&apos;s remember what we learned</p>
                                </div>
                            </div>

                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="card-premium w-full p-8 flex flex-col items-center gap-6 text-center"
                            >
                                <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-lg"
                                    style={{ background: domainInfo ? `${domainInfo.color}20` : '#F3E8FF' }}
                                >
                                    {reinforcement.emoji}
                                </div>
                                <h3 className="text-2xl font-black text-slate-800">
                                    {reinforcement.prompt}
                                </h3>
                                <p className="text-slate-400 font-medium">
                                    Topic: {reinforcement.topic} • {reinforcement.type === 'speech' ? 'Say it!' : reinforcement.type === 'physical' ? 'Move!' : reinforcement.type === 'find' ? 'Look around!' : 'Think!'}
                                </p>

                                {/* Countdown progress bar */}
                                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 15, ease: 'linear' }}
                                        onAnimationComplete={handleReinforcementComplete}
                                        className="h-full rounded-full"
                                        style={{ background: domainInfo?.color || '#8B5CF6' }}
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleReinforcementComplete}
                                    className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl cursor-pointer"
                                    style={{ background: domainInfo?.color || 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                                >
                                    Done! Continue ➡
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ═══ ACTIVITIES PHASE (Activity Engine) ═══ */}
                    {sessionPhase === 'activities' && video && (
                        <motion.div
                            key="activities"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #F472B6, #8B5CF6)' }}
                                >
                                    <span className="text-xl">🧠</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-700">Practice Time!</h2>
                                    <p className="text-sm text-slate-400 font-medium">Step 2 — Speak & Show</p>
                                </div>
                            </div>

                            {/* ─── ActivityEngine integration ───
                                 Props:
                                   video       → uses video.tags (topics) to generate activities
                                   childId     → for saving results
                                   weakTopics  → prioritize weak areas
                                   onComplete  → handleActivitiesComplete (saves + advances)
                                   onReplayVideo → handleReplayVideo (re-shows video)
                            */}
                            <ActivityEngine
                                video={video}
                                childId={childId}
                                weakTopics={weakTopics}
                                onComplete={handleActivitiesComplete}
                                onReplayVideo={handleReplayVideo}
                            />
                        </motion.div>
                    )}

                    {/* ═══ BONUS PHYSICAL ACTIVITY ═══ */}
                    {sessionPhase === 'bonus' && (
                        <motion.div
                            key="bonus"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #FBBF24, #F97316)' }}
                                >
                                    <span className="text-xl">🏃</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-700">Bonus Round!</h2>
                                    <p className="text-sm text-slate-400 font-medium">Step 3 — Move your body!</p>
                                </div>
                            </div>

                            <div className="card-premium">
                                <PhysicalActivity onComplete={handleBonusComplete} />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleBonusComplete}
                                className="mt-4 w-full py-3 rounded-2xl glass text-slate-500 font-semibold text-sm hover:glass-strong transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                Skip ➡
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}

export default function SessionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-aurora-mesh flex items-center justify-center">
                <div className="animate-float">
                    <PetalFlower size={48} />
                </div>
            </div>
        }>
            <SessionContent />
        </Suspense>
    )
}
