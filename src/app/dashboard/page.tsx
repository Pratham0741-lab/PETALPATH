'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Child } from '@/lib/types'
import { ChildIcon, SparkleIcon, ChartIcon, StarIcon, TrophyIcon } from '@/components/ui/PetalIcons'

const AVATARS = ['🧒', '👦', '👧', '🧒🏽', '👦🏻', '👧🏾', '🦸', '🧚', '🦄', '🐻', '🐰', '🐱']

export default function ParentDashboard() {
    const { user, children: childProfiles, refreshChildren } = useAuth()
    const [showAddChild, setShowAddChild] = useState(false)
    const [childName, setChildName] = useState('')
    const [childAge, setChildAge] = useState(3)
    const [childAvatar, setChildAvatar] = useState('🧒')
    const [childPin, setChildPin] = useState('0000')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        await supabase.from('children').insert({
            parent_id: user.id,
            name: childName,
            age: childAge,
            avatar: childAvatar,
            pin_code: childPin,
        })

        await refreshChildren()
        setShowAddChild(false)
        setChildName('')
        setChildAge(3)
        setChildAvatar('🧒')
        setChildPin('0000')
        setLoading(false)
    }

    return (
        <div>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-2"
            >
                <h1 className="text-3xl font-black text-gray-800">Welcome back!</h1>
            </motion.div>
            <p className="text-gray-500 mb-8">Here&apos;s how your children are doing</p>

            {/* Children cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {childProfiles.map((child, i) => (
                    <motion.div
                        key={child.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4 }}
                        onClick={() => router.push(`/dashboard/progress?child=${child.id}`)}
                        className="card-premium cursor-pointer hover:shadow-xl transition-all card-glow"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                                style={{ background: 'linear-gradient(135deg, rgba(125,211,252,0.2), rgba(196,181,253,0.2))' }}
                            >
                                {child.avatar}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-700">{child.name}</h3>
                                <p className="text-sm text-gray-400">Age {child.age} &bull; PIN: {child.pin_code}</p>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(96,165,250,0.1)' }}>
                                <p className="text-lg font-bold" style={{ color: '#60A5FA' }}>0</p>
                                <p className="text-xs text-gray-500">Sessions</p>
                            </div>
                            <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(52,211,153,0.1)' }}>
                                <p className="text-lg font-bold" style={{ color: '#34D399' }}>0</p>
                                <p className="text-xs text-gray-500">Stars</p>
                            </div>
                            <div className="rounded-xl p-2 text-center" style={{ background: 'rgba(244,114,182,0.1)' }}>
                                <p className="text-lg font-bold" style={{ color: '#F472B6' }}>0%</p>
                                <p className="text-xs text-gray-500">Progress</p>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Add child card */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: childProfiles.length * 0.1 }}
                    whileHover={{ y: -4 }}
                    onClick={() => setShowAddChild(true)}
                    className="card-premium border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 min-h-[140px] transition-colors cursor-pointer"
                    style={{ borderColor: 'rgba(196,181,253,0.4)' }}
                >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="16" fill="rgba(196,181,253,0.15)" />
                        <path d="M18 10V26M10 18H26" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <p className="font-bold text-gray-400">Add Child</p>
                </motion.button>
            </div>

            {/* Tips section */}
            <div className="card-premium p-6">
                <div className="flex items-center gap-2 mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" fill="#FDE68A" />
                        <path d="M12 7V12M12 15V15.5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h2 className="text-lg font-bold text-gray-700">Tips for Parents</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#E0E7FF" /><circle cx="12" cy="12" r="4" fill="#6366F1" /><path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" /></svg>, title: 'Consistent Sessions', desc: '10-20 minute daily sessions work best' },
                        { icon: <TrophyIcon size={24} />, title: 'Celebrate Progress', desc: 'Encourage your child after each activity' },
                        { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="3" fill="#DBEAFE" /><rect x="7" y="8" width="10" height="8" rx="1" fill="#60A5FA" /><circle cx="12" cy="12" r="2" fill="white" /></svg>, title: 'Screen Limits', desc: 'Discovery mode auto-limits to 5 videos/day' },
                        { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="8" height="8" rx="2" fill="#C4B5FD" /><rect x="14" y="2" width="8" height="8" rx="2" fill="#7DD3FC" /><rect x="2" y="14" width="8" height="8" rx="2" fill="#6EE7B7" /><rect x="14" y="14" width="8" height="8" rx="2" fill="#FDA4AF" /></svg>, title: 'Mixed Activities', desc: 'Balance screen time with physical activities' },
                    ].map((tip) => (
                        <div key={tip.title} className="flex items-start gap-3">
                            <div className="shrink-0">{tip.icon}</div>
                            <div>
                                <p className="font-semibold text-gray-600">{tip.title}</p>
                                <p className="text-sm text-gray-500">{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add child modal */}
            {showAddChild && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowAddChild(false) }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <ChildIcon size={28} />
                            <h2 className="text-2xl font-black text-gray-800">Add Child</h2>
                        </div>

                        <form onSubmit={handleAddChild} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none transition-all"
                                    placeholder="Child's name"
                                    onFocus={(e) => e.target.style.borderColor = '#C4B5FD'}
                                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Age</label>
                                <div className="flex gap-2">
                                    {[2, 3, 4, 5, 6].map(age => (
                                        <button
                                            key={age}
                                            type="button"
                                            onClick={() => setChildAge(age)}
                                            className="flex-1 py-3 rounded-xl font-bold text-lg transition-all cursor-pointer"
                                            style={childAge === age
                                                ? { background: 'linear-gradient(135deg, #F472B6, #C084FC)', color: 'white' }
                                                : { background: '#F1F5F9', color: '#64748B' }
                                            }
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Avatar</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {AVATARS.map(avatar => (
                                        <button
                                            key={avatar}
                                            type="button"
                                            onClick={() => setChildAvatar(avatar)}
                                            className="w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all cursor-pointer"
                                            style={childAvatar === avatar
                                                ? { background: 'rgba(244,114,182,0.2)', transform: 'scale(1.1)', outline: '2px solid #F472B6', outlineOffset: '1px' }
                                                : { background: '#F1F5F9' }
                                            }
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">PIN Code (4 digits)</label>
                                <input
                                    type="text"
                                    value={childPin}
                                    onChange={(e) => setChildPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    maxLength={4}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none text-center text-2xl tracking-[1em] font-bold transition-all"
                                    placeholder="0000"
                                    onFocus={(e) => e.target.style.borderColor = '#C4B5FD'}
                                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddChild(false)}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    disabled={loading || !childName}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50 cursor-pointer relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, #F472B6, #C084FC)', boxShadow: '0 4px 15px rgba(244,114,182,0.3)' }}
                                >
                                    <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {loading ? (
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="animate-spin"><circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10" /></svg>
                                        ) : (
                                            <><SparkleIcon size={16} color="#FFF" /> Add</>
                                        )}
                                    </span>
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}
