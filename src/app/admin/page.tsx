'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { VideoIcon, ChildIcon, ShieldIcon, ChartIcon } from '@/components/ui/PetalIcons'

interface Stats {
    totalVideos: number
    publishedVideos: number
    totalChildren: number
    totalSessions: number
}

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<Stats>({
        totalVideos: 0,
        publishedVideos: 0,
        totalChildren: 0,
        totalSessions: 0,
    })

    const supabase = createClient()

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats')
                if (!res.ok) throw new Error('Failed to fetch stats')
                const data = await res.json()
                setStats(data)
            } catch (err) {
                console.error('Error fetching admin stats:', err)
            }
        }
        fetchStats()
    }, [])

    const statCards = [
        { label: 'Total Videos', value: stats.totalVideos, Icon: VideoIcon, gradient: 'linear-gradient(135deg, #60A5FA, #3B82F6)', shadow: '0 8px 25px rgba(96,165,250,0.3)' },
        { label: 'Published', value: stats.publishedVideos, icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" fill="rgba(255,255,255,0.2)" /><path d="M9 14L12.5 17.5L19 10.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>, gradient: 'linear-gradient(135deg, #34D399, #059669)', shadow: '0 8px 25px rgba(52,211,153,0.3)' },
        { label: 'Children', value: stats.totalChildren, Icon: ChildIcon, gradient: 'linear-gradient(135deg, #F472B6, #EC4899)', shadow: '0 8px 25px rgba(244,114,182,0.3)' },
        { label: 'Sessions', value: stats.totalSessions, Icon: ChartIcon, gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)', shadow: '0 8px 25px rgba(167,139,250,0.3)' },
    ]

    return (
        <div className="max-w-6xl mx-auto">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-8"
            >
                <ShieldIcon size={32} />
                <h1 className="text-3xl font-black text-slate-800">Admin Dashboard</h1>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-2xl p-5 shadow-xl text-white relative overflow-hidden"
                        style={{ background: card.gradient, boxShadow: card.shadow }}
                    >
                        {/* Shimmer */}
                        <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)', backgroundSize: '200% 100%' }} />

                        <div className="relative">
                            {'Icon' in card && card.Icon ? <card.Icon size={32} /> : card.icon}
                            <p className="text-3xl font-black mt-2">{card.value}</p>
                            <p className="text-sm text-white/70 mt-1 font-medium">{card.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick actions */}
            <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/admin/upload')}
                    className="card-premium flex items-center gap-4 cursor-pointer text-left card-glow"
                >
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.15))' }}
                    >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <path d="M14 20V8M14 8L9 13M14 8L19 13" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="4" y="22" width="20" height="2" rx="1" fill="#93C5FD" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-lg text-slate-800">Upload Video</p>
                        <p className="text-sm text-slate-400">Add new learning content</p>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/admin/content')}
                    className="card-premium flex items-center gap-4 cursor-pointer text-left card-glow"
                >
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.15))' }}
                    >
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect x="4" y="4" width="20" height="20" rx="3" fill="#A7F3D0" opacity="0.5" />
                            <rect x="7" y="8" width="14" height="2" rx="1" fill="#10B981" />
                            <rect x="7" y="13" width="10" height="2" rx="1" fill="#34D399" />
                            <rect x="7" y="18" width="12" height="2" rx="1" fill="#6EE7B7" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-lg text-slate-800">Manage Content</p>
                        <p className="text-sm text-slate-400">Edit or remove videos</p>
                    </div>
                </motion.button>
            </div>
        </div>
    )
}
