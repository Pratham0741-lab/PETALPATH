'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/child/VideoPlayer'
import ActivityEngine from '@/components/child/ActivityEngine'
import PhysicalActivity from '@/components/child/PhysicalActivity'
import MascotGuide from '@/components/child/MascotGuide'
import CelebrationOverlay from '@/components/child/CelebrationOverlay'
import LearningPlayground from '@/components/child/LearningPlayground'
import type { VideoWithTags, TopicResult } from '@/lib/activity-types'
import { VideoIcon, TrophyIcon, StarIcon, PetalFlower, ArrowBackIcon, SparkleIcon } from '@/components/ui/PetalIcons'

type SessionPhase = 'loading' | 'video' | 'activities' | 'bonus' | 'complete'

function SessionContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [sessionPhase, setSessionPhase] = useState<SessionPhase>('loading')
    const [video, setVideo] = useState<VideoWithTags | null>(null)
    const [weakTopics, setWeakTopics] = useState<string[]>([])
    const [activityResults, setActivityResults] = useState<TopicResult[]>([])
    const [showCelebration, setShowCelebration] = useState(false)
    const [childId, setChildId] = useState<string>('')

    // Load video and child data
    useEffect(() => {
        const id = sessionStorage.getItem('activeChildId') || ''
        setChildId(id)

        async function load() {
            try {
                // Fetch video with tags
                const videoRes = await fetch('/api/videos')
                const videoJson = await videoRes.json()

                if (videoJson.videos && videoJson.videos.length > 0) {
                    // Pick a random published video
                    const vids = videoJson.videos.filter((v: any) => v.tags && v.tags.length > 0)
                    const selected = vids.length > 0
                        ? vids[Math.floor(Math.random() * vids.length)]
                        : videoJson.videos[Math.floor(Math.random() * videoJson.videos.length)]

                    setVideo({
                        id: selected.id,
                        title: selected.title,
                        video_url: selected.video_url,
                        thumbnail_url: selected.thumbnail_url,
                        category: selected.category,
                        difficulty: selected.difficulty,
                        tags: selected.tags || [],
                        duration: selected.duration,
                    })
                }

                // Fetch weak topics for this child
                if (id) {
                    const weakRes = await fetch(`/api/activity-results?child_id=${id}&status=weak`)
                    const weakJson = await weakRes.json()
                    if (weakJson.weakTopics) {
                        setWeakTopics(weakJson.weakTopics)
                    }
                }

                setSessionPhase('video')
            } catch (err) {
                console.error('Failed to load session data:', err)
                setSessionPhase('video')
            }
        }

        load()
    }, [])

    // Handle video completion → start activity engine
    const handleVideoComplete = useCallback(() => {
        if (video && video.tags && video.tags.length > 0) {
            setSessionPhase('activities')
        } else {
            // No tags → skip to bonus activity
            setSessionPhase('bonus')
        }
    }, [video])

    // Handle activity engine completion
    const handleActivitiesComplete = useCallback((results: TopicResult[]) => {
        setActivityResults(results)

        // Also save progress record
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
                    },
                }),
            }).catch(console.error)
        }

        // Move to bonus round
        setSessionPhase('bonus')
    }, [childId])

    // Handle replay video
    const handleReplayVideo = useCallback(() => {
        setSessionPhase('video')
    }, [])

    // Handle bonus/physical complete
    const handleBonusComplete = useCallback(() => {
        // Award stars
        if (childId) {
            const strongCount = activityResults.filter(r => r.status === 'strong').length
            const stars = 3 + strongCount * 2 // Base 3 + bonus per topic
            const current = parseInt(localStorage.getItem(`stars_${childId}`) || '0')
            localStorage.setItem(`stars_${childId}`, (current + stars).toString())
        }

        setShowCelebration(true)
        setTimeout(() => {
            setShowCelebration(false)
            setSessionPhase('complete')
        }, 3500)
    }, [childId, activityResults])

    // ─── Loading ───
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
                    <p className="text-lg font-bold text-slate-500">Preparing your session...</p>
                </div>
            </main>
        )
    }

    // ─── Complete ───
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
                    All Done!
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-slate-500 text-center mb-4 font-medium z-20"
                >
                    <span>You earned {totalStars} stars!</span>
                    <StarIcon size={22} />
                </motion.div>

                {/* Results summary */}
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

                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/child')}
                    className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl cursor-pointer relative overflow-hidden z-20"
                    style={{
                        background: 'linear-gradient(135deg, #FDA4AF, #C4B5FD)',
                        boxShadow: '0 10px 30px rgba(253, 164, 175, 0.2)',
                    }}
                >
                    <div className="absolute inset-0 animate-shimmer pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }}
                    />
                    <span className="relative flex items-center gap-2">
                        Back to Home
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M3 9.5L7 5V8H15V11H7V14L3 9.5Z" fill="white" />
                        </svg>
                    </span>
                </motion.button>
            </main>
        )
    }

    // ─── Active Session ───
    return (
        <main className="min-h-screen safe-area flex flex-col relative overflow-hidden bg-transparent">
            <LearningPlayground />

            <CelebrationOverlay
                show={showCelebration}
                onComplete={() => setShowCelebration(false)}
                message="Session complete! 🌟"
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

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between p-5">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push('/child')}
                    className="w-11 h-11 rounded-xl glass flex items-center justify-center shadow-md cursor-pointer"
                >
                    <ArrowBackIcon size={20} />
                </motion.button>

                <div className="flex items-center gap-3">
                    {/* Phase indicator */}
                    <div className="flex gap-2">
                        {[
                            { phase: 'video', label: '📺', active: sessionPhase === 'video' },
                            { phase: 'activities', label: '🧠', active: sessionPhase === 'activities' },
                            { phase: 'bonus', label: '🏃', active: sessionPhase === 'bonus' },
                        ].map((p, i) => (
                            <div
                                key={i}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                                    p.active
                                        ? 'bg-purple-100 shadow-sm scale-110'
                                        : sessionPhase === 'complete' || (sessionPhase === 'activities' && p.phase === 'video') || (sessionPhase === 'bonus' && p.phase !== 'bonus')
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

            {/* Main content */}
            <div className="relative z-10 flex-1 px-5 pb-6 max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {/* Video Phase */}
                    {sessionPhase === 'video' && (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #60A5FA, #22D3EE)' }}
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

                            {/* Tags preview */}
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

                            {/* Skip to activities (for testing) */}
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleVideoComplete}
                                className="mt-4 w-full py-3 rounded-2xl glass text-slate-500 font-semibold text-sm hover:glass-strong transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                Skip to activities ➡
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Activities Phase */}
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

                            <ActivityEngine
                                video={video}
                                childId={childId}
                                weakTopics={weakTopics}
                                onComplete={handleActivitiesComplete}
                                onReplayVideo={handleReplayVideo}
                            />
                        </motion.div>
                    )}

                    {/* Bonus Physical Activity */}
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
