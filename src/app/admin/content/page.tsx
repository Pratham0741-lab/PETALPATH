'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Video } from '@/lib/types'
import { VideoIcon } from '@/components/ui/PetalIcons'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    language: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3H12M4 7H10M3 11H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    math: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11M7 3V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    science: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 1V6L2 12H12L9 6V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    art: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="6" r="1" fill="currentColor" /></svg>,
    music: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 11V3L12 1V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="3" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" /></svg>,
    social: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" /><circle cx="10" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2" /></svg>,
    motor_skills: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="9" cy="2.5" r="1.5" fill="currentColor" /><path d="M6 5L8 4L10 6L8 9L11 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
}

type ContentFilter = 'all' | 'videos' | 'shorts' | string

export default function AdminContentPage() {
    const [videos, setVideos] = useState<Video[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<ContentFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => { fetchVideos() }, [])

    const fetchVideos = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/videos')
            if (res.ok) {
                const { videos: data } = await res.json()
                setVideos(data as Video[])
            }
        } catch (e) {
            console.error('Failed to fetch videos:', e)
        }
        setLoading(false)
    }

    const togglePublish = async (video: Video) => {
        try {
            const res = await fetch('/api/admin/videos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: video.id, is_published: !video.is_published })
            })
            if (res.ok) {
                setVideos(videos.map(v => v.id === video.id ? { ...v, is_published: !v.is_published } : v))
            }
        } catch (e) {
            console.error('Failed to toggle publish:', e)
        }
    }

    const deleteVideo = async (video: Video) => {
        if (!confirm('Delete this video?')) return
        try {
            const res = await fetch(`/api/admin/videos/${video.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
            setVideos(videos.filter(v => v.id !== video.id))
        } catch { alert('Failed to delete video.') }
    }

    const isShort = (video: Video) => video.tags?.includes('short')
    const filtered = videos.filter(v => {
        if (filter === 'videos' && isShort(v)) return false
        if (filter === 'shorts' && !isShort(v)) return false
        if (filter !== 'all' && filter !== 'videos' && filter !== 'shorts' && v.category !== filter) return false
        return v.title.toLowerCase().includes(searchQuery.toLowerCase())
    })
    const shortCount = videos.filter(isShort).length
    const videoCount = videos.length - shortCount

    return (
        <div className="max-w-6xl mx-auto">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-8">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="3" fill="#E0E7FF" /><rect x="7" y="8" width="14" height="2" rx="1" fill="#6366F1" /><rect x="7" y="13" width="10" height="2" rx="1" fill="#818CF8" /><rect x="7" y="18" width="12" height="2" rx="1" fill="#A5B4FC" /></svg>
                <h1 className="text-3xl font-black text-slate-800">Content Library</h1>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2"><circle cx="7" cy="7" r="5" stroke="#94A3B8" strokeWidth="1.5" /><path d="M11 11L14 14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search videos..."
                        className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none text-slate-800 placeholder-slate-400 transition-all"
                        onFocus={(e) => e.target.style.borderColor = '#C4B5FD'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'all', label: `All (${videos.length})`, style: { bg: '#A78BFA', text: 'white' } },
                        { key: 'videos', label: `Videos (${videoCount})`, style: { bg: '#60A5FA', text: 'white' } },
                        { key: 'shorts', label: `Shorts (${shortCount})`, style: { bg: '#F472B6', text: 'white' } },
                    ].map((btn) => (
                        <button key={btn.key} onClick={() => setFilter(btn.key as ContentFilter)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                            style={filter === btn.key ? { background: btn.style.bg, color: btn.style.text } : { background: '#F1F5F9', color: '#94A3B8' }}>
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category sub-filters */}
            <div className="flex gap-2 flex-wrap mb-6">
                {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
                    <button key={key} onClick={() => setFilter(prev => prev === key ? 'all' : key)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        style={filter === key ? { background: '#A78BFA', color: 'white' } : { background: '#F1F5F9', color: '#94A3B8' }}>
                        {icon} {key.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Video list */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-float"><VideoIcon size={48} /></div></div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="mx-auto"><rect x="8" y="8" width="36" height="36" rx="6" fill="#F1F5F9" /><path d="M20 22H32M20 28H28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" /></svg>
                    <p className="text-gray-400 mt-4 text-lg">No {filter === 'shorts' ? 'shorts' : 'videos'} found</p>
                    <p className="text-gray-500 text-sm">Upload your first {filter === 'shorts' ? 'short' : 'video'} to get started!</p>
                </motion.div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filtered.map((video, i) => (
                            <motion.div key={video.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ delay: i * 0.05 }}
                                className="card-premium flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="w-full h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={isShort(video) ? { background: 'linear-gradient(135deg, rgba(244,114,182,0.1), rgba(253,186,116,0.1))', width: 'auto', maxWidth: 64 }
                                        : { background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(167,139,250,0.1))', width: 'auto', maxWidth: 128 }}>
                                    <VideoIcon size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg truncate text-slate-800">{video.title}</h3>
                                        {isShort(video) && <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(244,114,182,0.15)', color: '#EC4899', border: '1px solid rgba(244,114,182,0.3)' }}>SHORT</span>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                        <span className="flex items-center gap-1">{CATEGORY_ICONS[video.category]} {video.category}</span>
                                        <span>&bull;</span>
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full" style={{ background: video.difficulty === 'easy' ? '#22C55E' : video.difficulty === 'medium' ? '#F59E0B' : '#EF4444' }} />
                                            {video.difficulty}
                                        </span>
                                        <span>&bull;</span>
                                        <span>{video.language.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => togglePublish(video)}
                                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                                        style={video.is_published ? { background: 'rgba(52,211,153,0.15)', color: '#059669', border: '1px solid rgba(52,211,153,0.3)' }
                                            : { background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
                                        {video.is_published ? (
                                            <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#34D399" /><path d="M4 7L6 9L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg> Published</>
                                        ) : (
                                            <><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#94A3B8" strokeWidth="1.5" /><path d="M5 5H9M5 7H8" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" /></svg> Draft</>
                                        )}
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteVideo(video)}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4H13M5 4V3C5 2.4 5.4 2 6 2H10C10.6 2 11 2.4 11 3V4M6 7V12M10 7V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M4 4L5 14H11L12 4" stroke="currentColor" strokeWidth="1.5" /></svg>
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
