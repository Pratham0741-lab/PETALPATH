'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import VideoPlayer from '@/components/child/VideoPlayer'
import SpeakingActivity from '@/components/child/SpeakingActivity'
import CameraActivity from '@/components/child/CameraActivity'
import PhysicalActivity from '@/components/child/PhysicalActivity'
import MascotGuide from '@/components/child/MascotGuide'
import { ActivityType } from '@/lib/types'
import { VideoIcon, MicIcon, CameraIcon, RunIcon, TrophyIcon, StarIcon, PetalFlower, ArrowBackIcon, SparkleIcon } from '@/components/ui/PetalIcons'
import LearningPlayground from '@/components/child/LearningPlayground'

const SESSION_STEPS: { type: ActivityType; Icon: React.ComponentType<{ size?: number }>; label: string; gradient: string; shadow: string }[] = [
    { type: 'video', Icon: VideoIcon, label: 'Watch', gradient: 'linear-gradient(135deg, #60A5FA, #22D3EE)', shadow: '0 6px 20px rgba(96,165,250,0.3)' },
    { type: 'speaking', Icon: MicIcon, label: 'Speak', gradient: 'linear-gradient(135deg, #F472B6, #FB7185)', shadow: '0 6px 20px rgba(244,114,182,0.3)' },
    { type: 'camera', Icon: CameraIcon, label: 'Show', gradient: 'linear-gradient(135deg, #34D399, #2DD4BF)', shadow: '0 6px 20px rgba(52,211,153,0.3)' },
    { type: 'physical', Icon: RunIcon, label: 'Move', gradient: 'linear-gradient(135deg, #FBBF24, #F97316)', shadow: '0 6px 20px rgba(251,191,36,0.3)' },
]

const MASCOT_MESSAGES: Record<ActivityType, string> = {
    video: 'Watch the video!',
    speaking: 'Use your voice!',
    camera: 'Show me something!',
    physical: 'Time to move!',
}

function SessionContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [currentStep, setCurrentStep] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false])
    const [sessionComplete, setSessionComplete] = useState(false)
    const [sessionVideo, setSessionVideo] = useState<{ url: string; title: string } | null>(null)
    const isAdvancing = useRef(false)

    useEffect(() => {
        async function fetchVideo() {
            try {
                const res = await fetch('/api/videos')
                const json = await res.json()
                if (json.videos && json.videos.length > 0) {
                    const video = json.videos[Math.floor(Math.random() * json.videos.length)]
                    setSessionVideo({ url: video.video_url, title: video.title })
                }
            } catch (err) {
                console.error('Failed to fetch video:', err)
            }
        }
        fetchVideo()
    }, [])

    useEffect(() => {
        const focus = searchParams.get('focus')
        if (focus) {
            const idx = SESSION_STEPS.findIndex(s => s.type === focus)
            if (idx >= 0) setCurrentStep(idx)
        }
    }, [searchParams])

    const advanceStep = useCallback(() => {
        if (isAdvancing.current) return
        isAdvancing.current = true

        setCompletedSteps(prev => {
            const next = [...prev]
            next[currentStep] = true
            return next
        })

        if (currentStep < SESSION_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            const childId = sessionStorage.getItem('activeChildId')
            if (childId) {
                const current = parseInt(localStorage.getItem(`stars_${childId}`) || '0')
                localStorage.setItem(`stars_${childId}`, (current + 5).toString())
            }
            setSessionComplete(true)
        }

        setTimeout(() => {
            isAdvancing.current = false
        }, 500)
    }, [currentStep])

    const step = SESSION_STEPS[currentStep]

    if (sessionComplete) {
        return (
            <main className="min-h-screen bg-aurora-mesh safe-area flex flex-col items-center justify-center px-6 relative overflow-hidden bg-transparent">
                <LearningPlayground />
                {/* Background glow */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'rgba(250,204,21,0.15)' }} />
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
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-500 text-center mb-8 font-medium flex items-center gap-2 z-20"
                >
                    You earned 5 stars! <StarIcon size={22} />
                </motion.p>
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/child')}
                    className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl cursor-pointer relative overflow-hidden z-20"
                    style={{
                        background: 'linear-gradient(135deg, #FDA4AF, #C4B5FD)',
                        boxShadow: '0 10px 30px rgba(253, 164, 175, 0.2)',
                    }}
                >
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
                    <span className="relative flex items-center gap-2">
                        Back to Home
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9.5L7 5V8H15V11H7V14L3 9.5Z" fill="white" /></svg>
                    </span>
                </motion.button>
            </main>
        )
    }

    return (
        <main className="min-h-screen safe-area flex flex-col relative overflow-hidden bg-transparent">
            {/* 3D Interactive Background */}
            <LearningPlayground />
            {/* Ambient SVG particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[
                    { color: '#C4B5FD' },
                    { color: '#7DD3FC' },
                    { color: '#6EE7B7' },
                ].map((item, i) => (
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

                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-400">
                        {currentStep + 1}/{SESSION_STEPS.length}
                    </span>
                </div>
            </div>

            {/* Progress dots */}
            <div className="relative z-10 flex justify-center gap-3 mb-6 px-6">
                {SESSION_STEPS.map((s, i) => (
                    <motion.div
                        key={i}
                        animate={{ scale: i === currentStep ? 1.15 : 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${
                            completedSteps[i]
                                ? 'shadow-emerald-400/30'
                                : i === currentStep
                                    ? 'text-white ring-4 ring-white shadow-lg'
                                    : 'glass text-slate-400'
                        }`}
                        style={
                            completedSteps[i]
                                ? { background: '#34D399' }
                                : i === currentStep
                                    ? { background: s.gradient, boxShadow: s.shadow }
                                    : {}
                        }
                    >
                        {completedSteps[i] ? (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M4 9L7.5 12.5L14 5.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <s.Icon size={22} />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Activity content */}
            <div className="relative z-10 flex-1 px-5">
                <motion.div
                    key={`header-${currentStep}`}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                        style={{ background: step.gradient, boxShadow: step.shadow }}
                    >
                        <step.Icon size={26} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-700">{step.label}</h2>
                        <p className="text-sm text-slate-400 font-medium">Step {currentStep + 1} of {SESSION_STEPS.length}</p>
                    </div>
                </motion.div>

                <div className="card-premium" key={currentStep}>
                    {step.type === 'video' && (
                        <VideoPlayer
                            videoUrl={sessionVideo?.url}
                            title={sessionVideo?.title || 'Learning Video'}
                            onComplete={advanceStep}
                        />
                    )}
                    {step.type === 'speaking' && (
                        <SpeakingActivity
                            prompt="Can you say 'Hello'?"
                            onComplete={advanceStep}
                        />
                    )}
                    {step.type === 'camera' && (
                        <CameraActivity
                            prompt="Show me something blue!"
                            onComplete={advanceStep}
                        />
                    )}
                    {step.type === 'physical' && (
                        <PhysicalActivity
                            onComplete={advanceStep}
                        />
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={advanceStep}
                    className="mt-4 w-full py-3 rounded-2xl glass text-slate-500 font-semibold text-sm hover:glass-strong transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                    Skip
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 3L10 7L5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.button>
            </div>

            {/* Bottom mascot */}
            <div className="relative z-10 p-5 flex justify-center">
                <MascotGuide
                    size="sm"
                    message={MASCOT_MESSAGES[step.type]}
                />
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
