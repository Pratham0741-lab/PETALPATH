'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { VideoIcon, MicIcon, CameraIcon, RunIcon, ChartIcon, StarIcon, TrophyIcon, PetalFlower, ChildIcon } from '@/components/ui/PetalIcons'

const COLORS = ['#FF6B9D', '#60A5FA', '#4ADE80', '#FACC15', '#C084FC', '#FB923C']

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
    'First Session': <StarIcon size={28} />,
    '5 Videos': <VideoIcon size={28} />,
    'First Word': <MicIcon size={28} />,
    'First Photo': <CameraIcon size={28} />,
    '10 Activities': <RunIcon size={28} />,
    'Week Streak': <TrophyIcon size={28} />,
}

function ProgressContent() {
    const searchParams = useSearchParams()
    const { children: childProfiles } = useAuth()
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
    const [progressData, setProgressData] = useState<Record<string, unknown>[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const childParam = searchParams.get('child')
        if (childParam) setSelectedChildId(childParam)
        else if (childProfiles.length > 0) setSelectedChildId(childProfiles[0].id)
    }, [searchParams, childProfiles])

    useEffect(() => {
        if (!selectedChildId) return
        fetchProgress()
    }, [selectedChildId])

    const fetchProgress = async () => {
        setLoading(true)
        const { data } = await supabase.from('progress').select('*').eq('child_id', selectedChildId).order('timestamp', { ascending: true }).limit(50)
        setProgressData(data || [])
        setLoading(false)
    }

    const weeklyData = [
        { day: 'Mon', video: 15, speak: 10, camera: 8, move: 12 },
        { day: 'Tue', video: 12, speak: 8, camera: 5, move: 15 },
        { day: 'Wed', video: 18, speak: 12, camera: 10, move: 8 },
        { day: 'Thu', video: 10, speak: 15, camera: 12, move: 10 },
        { day: 'Fri', video: 20, speak: 10, camera: 8, move: 18 },
        { day: 'Sat', video: 8, speak: 5, camera: 3, move: 20 },
        { day: 'Sun', video: 14, speak: 12, camera: 10, move: 14 },
    ]

    const skillData = [
        { name: 'Language', value: 35 },
        { name: 'Math', value: 25 },
        { name: 'Science', value: 15 },
        { name: 'Art', value: 15 },
        { name: 'Motor', value: 10 },
    ]

    const trendData = [
        { week: 'W1', engagement: 45 }, { week: 'W2', engagement: 52 },
        { week: 'W3', engagement: 68 }, { week: 'W4', engagement: 72 },
        { week: 'W5', engagement: 65 }, { week: 'W6', engagement: 80 },
        { week: 'W7', engagement: 85 }, { week: 'W8', engagement: 78 },
    ]

    const selectedChild = childProfiles.find(c => c.id === selectedChildId)

    return (
        <div>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-6">
                <ChartIcon size={28} />
                <h1 className="text-3xl font-black text-gray-800">Progress Dashboard</h1>
            </motion.div>

            {childProfiles.length > 1 && (
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    {childProfiles.map((child) => (
                        <motion.button key={child.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedChildId(child.id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                            style={selectedChildId === child.id
                                ? { background: 'linear-gradient(135deg, #F472B6, #A78BFA)', color: 'white', boxShadow: '0 4px 15px rgba(244,114,182,0.3)' }
                                : { background: 'white', color: '#64748B', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <span className="text-xl">{child.avatar}</span>
                            <span className="font-bold">{child.name}</span>
                        </motion.button>
                    ))}
                </div>
            )}

            {selectedChild && (
                <div className="space-y-6">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" fill="#E0E7FF" /><path d="M5 8H15M5 12H12" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <h2 className="text-lg font-bold text-gray-700">Weekly Summary</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Activity breakdown for {selectedChild.name}</p>
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            {[
                                { Icon: VideoIcon, label: 'Watch', time: '97 min', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
                                { Icon: MicIcon, label: 'Speak', time: '72 min', color: '#F472B6', bg: 'rgba(244,114,182,0.1)' },
                                { Icon: CameraIcon, label: 'Show', time: '56 min', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
                                { Icon: RunIcon, label: 'Move', time: '97 min', color: '#FB923C', bg: 'rgba(251,146,60,0.1)' },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: stat.bg }}>
                                    <div className="flex justify-center mb-1"><stat.Icon size={22} /></div>
                                    <p className="font-bold" style={{ color: stat.color }}>{stat.time}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} barCategoryGap="15%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="video" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="speak" fill="#FF6B9D" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="camera" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="move" fill="#FB923C" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="card-premium p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="7" height="7" rx="1.5" fill="#C4B5FD" /><rect x="12" y="1" width="7" height="7" rx="1.5" fill="#7DD3FC" /><rect x="1" y="12" width="7" height="7" rx="1.5" fill="#6EE7B7" /><rect x="12" y="12" width="7" height="7" rx="1.5" fill="#FDA4AF" /></svg>
                                <h2 className="text-lg font-bold text-gray-700">Skill Distribution</h2>
                            </div>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={skillData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                            {skillData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {skillData.map((skill, i) => (
                                    <span key={skill.name} className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i] }}>{skill.name}</span>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card-premium p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15L6 10L9 12L13 6L17 8" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <h2 className="text-lg font-bold text-gray-700">Engagement Trend</h2>
                            </div>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="engagementGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FF6B9D" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#FF6B9D" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="engagement" stroke="#FF6B9D" strokeWidth={3} fill="url(#engagementGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrophyIcon size={22} />
                            <h2 className="text-lg font-bold text-gray-700">Achievements</h2>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                            {[
                                { label: 'First Session', earned: true },
                                { label: '5 Videos', earned: true },
                                { label: 'First Word', earned: true },
                                { label: 'First Photo', earned: false },
                                { label: '10 Activities', earned: false },
                                { label: 'Week Streak', earned: false },
                            ].map((badge) => (
                                <motion.div key={badge.label} whileHover={{ scale: 1.1 }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer ${badge.earned ? '' : 'opacity-40'}`}
                                    style={{ background: badge.earned ? 'rgba(250,204,21,0.1)' : '#F1F5F9' }}>
                                    {ACHIEVEMENT_ICONS[badge.label]}
                                    <span className="text-xs font-semibold text-gray-600 text-center">{badge.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {!selectedChild && childProfiles.length === 0 && (
                <div className="text-center py-20">
                    <ChildIcon size={52} className="mx-auto" />
                    <p className="text-gray-500 text-lg mt-4">Add a child profile to start tracking progress!</p>
                </div>
            )}
        </div>
    )
}

export default function ProgressPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-float"><ChartIcon size={48} /></div></div>}>
            <ProgressContent />
        </Suspense>
    )
}
