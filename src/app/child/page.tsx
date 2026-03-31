'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MascotGuide from '@/components/child/MascotGuide'
import CelebrationOverlay from '@/components/child/CelebrationOverlay'
import LearningPlayground from '@/components/child/LearningPlayground'
import { VideoIcon, MicIcon, CameraIcon, RunIcon, ExploreIcon, StarIcon, PetalFlower, ArrowBackIcon, SparkleIcon, ButterflyIcon } from '@/components/ui/PetalIcons'

const MENU_ITEMS = [
    { id: 'session', Icon: VideoIcon, label: 'Watch & Learn', gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)', shadow: 'rgba(59,130,246,0.4)', href: '/child/session' },
    { id: 'speak', Icon: MicIcon, label: 'Speak Words', gradient: 'linear-gradient(135deg, #EC4899, #F43F5E)', shadow: 'rgba(236,72,153,0.4)', href: '/child/session?focus=speaking' },
    { id: 'camera', Icon: CameraIcon, label: 'Show & Tell', gradient: 'linear-gradient(135deg, #10B981, #14B8A6)', shadow: 'rgba(16,185,129,0.4)', href: '/child/session?focus=camera' },
    { id: 'move', Icon: RunIcon, label: 'Move Body', gradient: 'linear-gradient(135deg, #F59E0B, #EA580C)', shadow: 'rgba(245,158,11,0.4)', href: '/child/session?focus=physical' },
    { id: 'discover', Icon: ExploreIcon, label: 'Explore Map', gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)', shadow: 'rgba(139,92,246,0.4)', href: '/child/discover' },
    { id: 'reward', Icon: StarIcon, label: 'My Rewards', gradient: 'linear-gradient(135deg, #EAB308, #F59E0B)', shadow: 'rgba(234,179,8,0.4)', href: '#' },
]

export default function ChildDashboard() {
    const router = useRouter()
    const { signOut } = useAuth()
    const [childName, setChildName] = useState('Friend')
    const [childAvatar, setChildAvatar] = useState('🧒')
    const [showCelebration, setShowCelebration] = useState(false)
    const [stars, setStars] = useState(0)

    useEffect(() => {
        const name = sessionStorage.getItem('activeChildName')
        const avatar = sessionStorage.getItem('activeChildAvatar')
        if (name) setChildName(name)
        if (avatar) setChildAvatar(avatar)

        const childId = sessionStorage.getItem('activeChildId')
        if (childId) {
            const savedStars = localStorage.getItem(`stars_${childId}`)
            if (savedStars) setStars(parseInt(savedStars))
        }
    }, [])

    const handleMenuClick = (item: typeof MENU_ITEMS[0]) => {
        if (item.id === 'reward') {
            setShowCelebration(true)
            return
        }
        router.push(item.href)
    }

    return (
        <main className="min-h-screen safe-area flex flex-col relative overflow-hidden bg-transparent">
            {/* 3D Interactive Background */}
            <LearningPlayground />

            {/* UI Layer */}
            <div className="relative z-10 w-full h-full flex flex-col">
                <CelebrationOverlay
                    show={showCelebration}
                    onComplete={() => setShowCelebration(false)}
                    message={`You have ${stars} stars!`}
                />

            {/* High-contrast vibrant ambient particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden xl:block hidden">
                {[
                    { Icon: SparkleIcon, color: '#3B82F6', x: 10, y: 20 },
                    { Icon: StarIcon, color: '#F59E0B', x: 80, y: 15 },
                    { Icon: SparkleIcon, color: '#EC4899', x: 20, y: 80 },
                    { Icon: ButterflyIcon, color: '#8B5CF6', x: 90, y: 70 },
                    { Icon: SparkleIcon, color: '#10B981', x: 50, y: 10 },
                    { Icon: ButterflyIcon, color: '#F59E0B', x: 50, y: 90 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.15, 0.4, 0.15],
                            rotate: [0, 15, -15, 0],
                        }}
                        transition={{
                            duration: 6 + i,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.5,
                        }}
                    >
                        <item.Icon size={32} color={item.color} />
                    </motion.div>
                ))}
            </div>

            {/* Top Navigation Bar - Full Width Desktop */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                        await signOut()
                        window.location.href = '/login'
                    }}
                    className="h-14 px-5 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center gap-3 shadow-lg border border-white/50 cursor-pointer group transition-all hover:bg-white"
                >
                    <ArrowBackIcon size={24} color="#64748B" />
                    <span className="font-bold text-slate-600 hidden sm:block">Exit</span>
                </motion.button>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="flex items-center gap-3 bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-white/50"
                >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-100">
                        <StarIcon size={20} color="#F59E0B" />
                    </div>
                    <span className="font-black text-slate-700 text-2xl">{stars}</span>
                </motion.div>
            </div>

            {/* Main Content Area - Desktop Optimized layout */}
            <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 pb-12 flex flex-col items-center">
                
                {/* Hero / Welcome Section */}
                <div className="flex flex-col items-center mb-12 mt-4 text-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                        className="mb-6 drop-shadow-xl"
                    >
                        <div className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #ffffff, #f1f5f9)' }}>
                            <span className="text-6xl absolute z-10" style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.15))' }}>{childAvatar}</span>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 animate-shimmer pointer-events-none" style={{ backgroundSize: '200% 100%' }} />
                        </div>
                    </motion.div>
                    
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight"
                    >
                        Hi, <span style={{ background: 'linear-gradient(90deg, #F472B6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{childName}</span>!
                    </motion.h1>
                    <motion.p
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl text-slate-500 mt-4 font-semibold"
                    >
                        Are you ready to play and learn today?
                    </motion.p>
                </div>

                {/* Activity Grid - Wide Website Layout (3 columns on desktop) */}
                <div className="w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {MENU_ITEMS.map((item, i) => (
                            <motion.button
                                key={item.id}
                                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                transition={{
                                    delay: 0.5 + i * 0.1,
                                    type: 'spring',
                                    stiffness: 250,
                                    damping: 20,
                                }}
                                whileHover={{ scale: 1.03, y: -8, boxShadow: `0 20px 40px ${item.shadow}` }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleMenuClick(item)}
                                className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-6 cursor-pointer shadow-xl border border-white transition-all group overflow-hidden relative"
                            >
                                {/* High-contrast Gradient Icon container */}
                                <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-inner relative z-10 transition-transform duration-300 group-hover:scale-110" style={{ background: item.gradient }}>
                                    <item.Icon size={56} color="white" />
                                    {/* Shimmer inside icon */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </div>
                                
                                <h3 className="text-2xl md:text-3xl font-black text-slate-800 relative z-10">
                                    {item.label}
                                </h3>

                                {/* Card Background Hover Glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[2.5rem]" style={{ background: item.gradient }} />
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Bottom Mascot Tip - Desktop style */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-16 max-w-2xl bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-lg border border-white flex items-center gap-6"
                >
                    <div className="animate-float flex-shrink-0 bg-blue-50 w-16 h-16 rounded-full flex justify-center items-center shadow-sm">
                        <PetalFlower size={36} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-700 text-lg mb-1">Tip from Petal!</h4>
                        <p className="text-base text-slate-600 font-medium">
                            Click any large block above to start your adventure. Every activity gives you shining stars!
                        </p>
                    </div>
                </motion.div>
            </div>
            </div>
        </main>
    )
}
