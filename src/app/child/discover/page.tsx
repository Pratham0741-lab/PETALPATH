'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowBackIcon, StarIcon, ExploreIcon, SparkleIcon, ButterflyIcon, PetalFlower } from '@/components/ui/PetalIcons'

interface DomainProgress {
    domain: string
    stage: string
    title: string
    icon: string
    color: string
    emoji: string
    total: number
    completed: number
    percentage: number
    unlocked: boolean
    next_video_title: string | null
    next_video_id: string | null
    prerequisite: {
        domain: string
        title: string
        min_percent: number
    } | null
}

// Visual positioning for each domain to follow a winding roadmap
const MAP_POSITIONS: Record<string, { x: number; y: number }> = {
    numbers: { x: 15, y: 65 },
    alphabet: { x: 40, y: 35 },
    phonics: { x: 65, y: 70 },
    shapes: { x: 88, y: 40 },
}

// Zone theme gradients for each domain
const ZONE_THEMES: Record<string, { bg: string; glow: string }> = {
    numbers:  { bg: 'radial-gradient(circle at 15% 65%, rgba(52,211,153,0.15) 0%, transparent 40%)', glow: 'rgba(52,211,153,0.3)' },
    alphabet: { bg: 'radial-gradient(circle at 40% 35%, rgba(96,165,250,0.15) 0%, transparent 40%)', glow: 'rgba(96,165,250,0.3)' },
    phonics:  { bg: 'radial-gradient(circle at 65% 70%, rgba(244,114,182,0.15) 0%, transparent 40%)', glow: 'rgba(244,114,182,0.3)' },
    shapes:   { bg: 'radial-gradient(circle at 88% 40%, rgba(251,191,36,0.15) 0%, transparent 40%)', glow: 'rgba(251,191,36,0.3)' },
}

// Milestone thresholds (shown as markers on each domain)
const MILESTONES = [25, 50, 75, 100]

// Unified winding path for the roadmap
const ROADMAP_PATH = "M -10 65 L 15 65 C 28 65, 25 35, 40 35 C 55 35, 50 70, 65 70 C 80 70, 75 40, 88 40 L 110 40"

export default function DiscoveryMapPage() {
    const router = useRouter()
    const [domains, setDomains] = useState<DomainProgress[]>([])
    const [overall, setOverall] = useState({ total_videos: 0, total_completed: 0, percentage: 0 })
    const [selectedDomain, setSelectedDomain] = useState<DomainProgress | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch real curriculum progress
    useEffect(() => {
        async function loadProgress() {
            const childId = sessionStorage.getItem('activeChildId')

            // ─── Try fetching with child_id if available ───
            if (childId) {
                try {
                    const res = await fetch(`/api/curriculum-progress?child_id=${childId}`)
                    const data = await res.json()
                    if (data.domains && data.domains.length > 0) {
                        setDomains(data.domains)
                        if (data.overall) setOverall(data.overall)
                        setLoading(false)
                        return
                    }
                } catch (err) {
                    console.error('Failed to load curriculum progress:', err)
                }
            }

            // ─── Fallback: Build domain data from /api/curriculum ───
            // Works even without a child login — shows all domains with 0 progress
            try {
                const res = await fetch('/api/curriculum')
                const json = await res.json()

                if (json.success && json.data) {
                    // API returns flat array: [{ stage, domain, video: { id, title, ... } }]
                    const items = Array.isArray(json.data) ? json.data : []
                    // Count videos per domain from the curriculum data
                    const domainCounts: Record<string, { total: number; firstVideoId: string | null; firstVideoTitle: string | null }> = {}

                    for (const item of items) {
                        const d = item.domain || 'general'
                        if (!domainCounts[d]) {
                            domainCounts[d] = { total: 0, firstVideoId: null, firstVideoTitle: null }
                        }
                        domainCounts[d].total++
                        if (!domainCounts[d].firstVideoId && item.video) {
                            domainCounts[d].firstVideoId = item.video.id
                            domainCounts[d].firstVideoTitle = item.video.title
                        }
                    }

                    // Build domain progress from static config
                    const DOMAIN_CONFIG: Record<string, { title: string; stage: string; color: string; emoji: string; icon: string; unlocked: boolean; prerequisite: DomainProgress['prerequisite'] }> = {
                        numbers: { title: 'Number Forest', stage: 'foundation', color: '#34D399', emoji: '1️⃣', icon: '🌲', unlocked: true, prerequisite: null },
                        alphabet: { title: 'Alphabet Mountain', stage: 'foundation', color: '#60A5FA', emoji: '🔤', icon: '🏔', unlocked: true, prerequisite: null },
                        phonics: { title: 'Phonics Valley', stage: 'understanding', color: '#F472B6', emoji: '🗣', icon: '🔊', unlocked: true, prerequisite: { domain: 'alphabet', title: 'Alphabet Mountain', min_percent: 50 } },
                        shapes: { title: 'Shape Island', stage: 'application', color: '#FBBF24', emoji: '🟡', icon: '🔺', unlocked: true, prerequisite: { domain: 'numbers', title: 'Number Forest', min_percent: 50 } },
                    }

                    const builtDomains: DomainProgress[] = Object.entries(DOMAIN_CONFIG).map(([key, cfg]) => {
                        const counts = domainCounts[key] || { total: 0, firstVideoId: null, firstVideoTitle: null }
                        return {
                            domain: key,
                            stage: cfg.stage,
                            title: cfg.title,
                            icon: cfg.icon,
                            color: cfg.color,
                            emoji: cfg.emoji,
                            total: counts.total,
                            completed: 0,
                            percentage: 0,
                            unlocked: cfg.unlocked,
                            next_video_title: counts.firstVideoTitle,
                            next_video_id: counts.firstVideoId,
                            prerequisite: cfg.prerequisite,
                        }
                    })

                    setDomains(builtDomains)
                    const totalVideos = builtDomains.reduce((sum, d) => sum + d.total, 0)
                    setOverall({ total_videos: totalVideos, total_completed: 0, percentage: 0 })
                }
            } catch (err) {
                console.error('Failed to load curriculum fallback:', err)
            }

            setLoading(false)
        }
        loadProgress()
    }, [])

    const handleStartDomain = (domain: DomainProgress) => {
        if (!domain.unlocked) return

        // Navigate to session with domain param — engine picks the right video
        if (domain.next_video_id) {
            router.push(`/child/session?domain=${domain.domain}&video_id=${domain.next_video_id}`)
        } else {
            router.push(`/child/session?domain=${domain.domain}`)
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 50%, #F3E8FF 100%)' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                    <PetalFlower size={56} />
                </motion.div>
            </main>
        )
    }

    return (
        <main className="min-h-screen safe-area relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 50%, #F3E8FF 100%)' }}>

            {/* Top bar */}
            <div className="relative z-30 flex items-center justify-between p-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/child')}
                    className="h-14 px-5 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center gap-3 shadow-lg border border-white/50 cursor-pointer text-slate-600 font-bold hover:bg-white"
                >
                    <ArrowBackIcon size={24} color="#64748B" />
                    <span className="hidden sm:block">Back</span>
                </motion.button>

                <div className="flex items-center gap-4">
                    {/* Overall progress */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-5 py-3 shadow-lg border border-white/50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100">
                            <StarIcon size={20} color="#8B5CF6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400">Overall Progress</p>
                            <p className="text-sm font-black text-slate-700">{overall.total_completed}/{overall.total_videos} videos ({overall.percentage}%)</p>
                        </div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-white/50 flex items-center gap-2">
                        <ExploreIcon size={24} color="#8B5CF6" />
                        <span className="font-black text-slate-700 text-xl hidden sm:block">Explore Map</span>
                    </div>
                </div>
            </div>

            {/* The Map Layout */}
            <div className="absolute inset-0 z-10 pt-28 pb-12 px-6 flex justify-center items-center">
                <div className="relative w-full max-w-5xl aspect-video max-h-[70vh] bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden mt-8">

                    {/* Zone theme backgrounds */}
                    {domains.map(domain => {
                        const theme = ZONE_THEMES[domain.domain]
                        if (!theme || !domain.unlocked) return null
                        return (
                            <div
                                key={`zone-${domain.domain}`}
                                className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
                                style={{ background: theme.bg, opacity: domain.unlocked ? 1 : 0 }}
                            />
                        )
                    })}

                    {/* Decorative map elements */}
                    <div className="absolute top-10 left-10 opacity-50"><PetalFlower size={64} /></div>
                    <div className="absolute bottom-10 right-10 opacity-50"><ButterflyIcon size={48} color="#A78BFA" /></div>
                    <div className="absolute top-1/2 left-1/2 opacity-20"><SparkleIcon size={40} color="#FCD34D" /></div>

                    {/* Unified Winding Roadmap Path */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                                <stop offset="33%" stopColor="#3B82F6" stopOpacity="0.8" />
                                <stop offset="66%" stopColor="#EC4899" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
                            </linearGradient>
                            <filter id="shadow">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1"/>
                            </filter>
                        </defs>
                        
                        {/* Thick white road base */}
                        <path
                            d={ROADMAP_PATH}
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#shadow)"
                        />
                        {/* Colored gradient track */}
                        <path
                            d={ROADMAP_PATH}
                            fill="none"
                            stroke="url(#roadGradient)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        {/* Inner dashed line for journey effect */}
                        <path
                            d={ROADMAP_PATH}
                            fill="none"
                            stroke="#FFFFFF"
                            strokeWidth="0.8"
                            strokeDasharray="2 3"
                        />
                        
                        {/* Animated traveling dots along the path */}
                        <circle r="1" fill="#FFFFFF" filter="url(#shadow)">
                            <animateMotion dur="8s" repeatCount="indefinite" path={ROADMAP_PATH} />
                        </circle>
                        <circle r="1.5" fill="#FCD34D" filter="url(#shadow)">
                            <animateMotion dur="8s" begin="2.6s" repeatCount="indefinite" path={ROADMAP_PATH} />
                        </circle>
                        <circle r="1" fill="#FFFFFF" filter="url(#shadow)">
                            <animateMotion dur="8s" begin="5.2s" repeatCount="indefinite" path={ROADMAP_PATH} />
                        </circle>
                    </svg>

                    {/* Domain locations */}
                    {domains.map((domain, i) => {
                        const pos = MAP_POSITIONS[domain.domain] || { x: 50, y: 50 }
                        const theme = ZONE_THEMES[domain.domain]
                        const isInProgress = domain.unlocked && domain.completed > 0 && domain.percentage < 100

                        return (
                            <motion.button
                                key={domain.domain}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200 }}
                                whileHover={domain.unlocked ? { scale: 1.12, zIndex: 20 } : {}}
                                whileTap={domain.unlocked ? { scale: 0.95 } : {}}
                                onClick={() => setSelectedDomain(domain)}
                                className="absolute flex flex-col items-center justify-center cursor-pointer group"
                                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                            >
                                {/* Active domain pulsing glow */}
                                {isInProgress && theme && (
                                    <motion.div
                                        className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full"
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ background: theme.glow, filter: 'blur(12px)' }}
                                    />
                                )}

                                {/* Node circle */}
                                <div
                                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl border-4 relative transition-all ${
                                        domain.unlocked ? 'border-white' : 'border-white/50 opacity-50 grayscale'
                                    }`}
                                    style={{ background: domain.color }}
                                >
                                    <span className="text-3xl sm:text-4xl drop-shadow-md">
                                        {domain.unlocked ? domain.emoji : '🔒'}
                                    </span>

                                    {/* Progress ring */}
                                    {domain.unlocked && domain.percentage > 0 && (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="4" opacity="0.3" />
                                            <circle
                                                cx="50" cy="50" r="46" fill="none"
                                                stroke="white" strokeWidth="4"
                                                strokeDasharray={`${domain.percentage * 2.89} ${289 - domain.percentage * 2.89}`}
                                                strokeLinecap="round"
                                            />
                                            {/* Milestone markers */}
                                            {MILESTONES.map(ms => {
                                                if (domain.percentage < ms) return null
                                                const angle = (ms / 100) * 360 - 90
                                                const rad = (angle * Math.PI) / 180
                                                const cx = 50 + 46 * Math.cos(rad)
                                                const cy = 50 + 46 * Math.sin(rad)
                                                return (
                                                    <circle
                                                        key={ms}
                                                        cx={cx} cy={cy} r="3"
                                                        fill="#FCD34D" stroke="white" strokeWidth="1.5"
                                                    />
                                                )
                                            })}
                                        </svg>
                                    )}
                                </div>

                                {/* Label */}
                                <div className={`mt-3 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-white font-bold text-sm sm:text-base whitespace-nowrap relative ${
                                    domain.unlocked ? 'bg-white/90 text-slate-700' : 'bg-white/60 text-slate-400'
                                }`}>
                                    {domain.title}
                                    {domain.unlocked && domain.completed > 0 && (
                                        <span className="ml-2 text-xs font-medium text-slate-400">
                                            {domain.completed}/{domain.total}
                                        </span>
                                    )}
                                    {/* Locked tooltip */}
                                    {!domain.unlocked && domain.prerequisite && (
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/90 text-white text-[10px] px-3 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {domain.prerequisite.min_percent}% of {domain.prerequisite.title} needed
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>

            {/* Domain Detail Modal */}
            <AnimatePresence>
                {selectedDomain && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedDomain(null)}
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 grid gap-5 text-center relative overflow-hidden"
                            style={{ borderColor: selectedDomain.color }}
                        >
                            {/* Gradient header */}
                            <div className="absolute top-0 inset-x-0 h-28 opacity-15" style={{ background: `linear-gradient(to bottom, ${selectedDomain.color}, transparent)` }} />

                            {/* Icon */}
                            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl shadow-lg relative z-10" style={{ background: selectedDomain.color }}>
                                {selectedDomain.unlocked ? selectedDomain.emoji : '🔒'}
                            </div>

                            {/* Title & Stage */}
                            <div className="relative z-10">
                                <h2 className="text-2xl font-black text-slate-800">{selectedDomain.title}</h2>
                                <p className="text-sm font-bold text-slate-400 capitalize mt-1">
                                    Stage: {selectedDomain.stage}
                                </p>
                            </div>

                            {/* Progress bar */}
                            {selectedDomain.unlocked && (
                                <div className="relative z-10">
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                        <span>{selectedDomain.completed} completed</span>
                                        <span>{selectedDomain.total} total</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${selectedDomain.percentage}%` }}
                                            transition={{ delay: 0.3, duration: 0.8 }}
                                            className="h-full rounded-full"
                                            style={{ background: selectedDomain.color }}
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500 mt-2">{selectedDomain.percentage}% complete</p>
                                </div>
                            )}

                            {/* Status message */}
                            {selectedDomain.unlocked ? (
                                <div className="relative z-10">
                                    {selectedDomain.next_video_title ? (
                                        <p className="text-slate-600 font-medium">
                                            <span className="font-bold">Next:</span> {selectedDomain.next_video_title}
                                        </p>
                                    ) : (
                                        <p className="text-emerald-600 font-bold">✅ All videos completed!</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-slate-500 font-medium relative z-10">
                                    🔒 Complete {selectedDomain.prerequisite?.min_percent}% of{' '}
                                    <span className="font-bold">{selectedDomain.prerequisite?.title}</span>{' '}
                                    to unlock!
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 relative z-10">
                                <button
                                    onClick={() => setSelectedDomain(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                                {selectedDomain.unlocked && selectedDomain.next_video_title && (
                                    <button
                                        onClick={() => handleStartDomain(selectedDomain)}
                                        className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
                                        style={{ background: selectedDomain.color }}
                                    >
                                        Let&apos;s Go! ✨
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
