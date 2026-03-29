'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { VideoCategory, DifficultyLevel } from '@/lib/types'
import { VideoIcon, RunIcon } from '@/components/ui/PetalIcons'

type UploadMode = 'video' | 'short'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    language: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M5 8H11M3 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    math: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8H12M8 4V12M3 3L5 5M11 11L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    science: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2V7L3 13H13L10 7V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    art: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" /><circle cx="6" cy="6" r="1" fill="currentColor" /><circle cx="10" cy="6" r="1" fill="currentColor" /><circle cx="8" cy="10" r="1" fill="currentColor" /></svg>,
    music: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12V4L13 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="11" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" /></svg>,
    social: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" /><circle cx="11" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M1 14C1 11 3.5 9 6 9C7.5 9 8.8 9.5 9.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>,
    motor_skills: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="10" cy="3" r="1.5" fill="currentColor" /><path d="M7 6L9 5L11 7L9 10L12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
}

const CATEGORIES: { value: VideoCategory; label: string }[] = [
    { value: 'language', label: 'Language' },
    { value: 'math', label: 'Math' },
    { value: 'science', label: 'Science' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'social', label: 'Social' },
    { value: 'motor_skills', label: 'Motor Skills' },
]

const DIFFICULTIES: { value: DifficultyLevel; label: string; color: string }[] = [
    { value: 'easy', label: 'Easy', color: '#22C55E' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'hard', label: 'Hard', color: '#EF4444' },
]

export default function AdminUploadPage() {
    const [mode, setMode] = useState<UploadMode>('video')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<VideoCategory>('language')
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy')
    const [language, setLanguage] = useState('en')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [dragOver, setDragOver] = useState(false)
    const { user } = useAuth()
    const supabase = createClient()
    const isShort = mode === 'short'

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && (droppedFile.type === 'video/mp4' || droppedFile.name.endsWith('.mkv'))) {
            setFile(droppedFile)
        } else {
            setError('Only MP4 and MKV files are supported')
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) setFile(selectedFile)
    }

    const uploadToSignedUrl = (url: string, fileToUpload: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('PUT', url, true)
            xhr.setRequestHeader('Content-Type', fileToUpload.type || 'video/mp4')
            xhr.setRequestHeader('Cache-Control', '3600')
            xhr.setRequestHeader('x-upsert', 'false')
            
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const pct = Math.round(15 + (event.loaded / event.total) * 65)
                    setProgress(pct)
                }
            }
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve()
                } else {
                    reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`))
                }
            }
            xhr.onerror = () => reject(new Error('Network error during upload'))
            xhr.ontimeout = () => reject(new Error('Upload timed out'))
            xhr.send(fileToUpload)
        })
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !title) return
        setUploading(true); setError(''); setProgress(0)
        try {
            const prefix = isShort ? 'short_' : ''
            const fileName = `${prefix}${Date.now()}_${file.name.replace(/\s+/g, '_')}`
            
            setProgress(5)
            
            // 1. Get signed URL from API
            const resUrl = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getSignedUrl', fileName })
            })
            
            if (!resUrl.ok) {
                const errData = await resUrl.json().catch(() => ({}))
                throw new Error(errData.error || 'Failed to get upload URL')
            }
            
            const { signedUrl } = await resUrl.json()
            
            setProgress(15)
            
            // 2. Upload file directly to Supabase via XHR (with real progress)
            await uploadToSignedUrl(signedUrl, file)
            
            setProgress(85)
            
            // 3. Insert Database Record via API
            const resDb = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'insertVideo',
                    title, description, category, difficulty, language, path: fileName, isShort
                })
            })
            
            if (!resDb.ok) {
                const errData = await resDb.json().catch(() => ({}))
                throw new Error(errData.error || 'Failed to save video details')
            }
            
            setProgress(100); setSuccess(true); setTitle(''); setDescription(''); setFile(null)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally { 
            setUploading(false) 
        }
    }

    const resetForm = () => { setSuccess(false); setError(''); setProgress(0); setTitle(''); setDescription(''); setFile(null) }
    const switchMode = (newMode: UploadMode) => { if (newMode !== mode) { setMode(newMode); resetForm() } }

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-6">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 20V8M14 8L9 13M14 8L19 13" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="4" y="22" width="20" height="2" rx="1" fill="#C4B5FD" /></svg>
                <h1 className="text-3xl font-black text-slate-800">Upload Content</h1>
            </motion.div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-slate-50 border border-slate-200">
                {[
                    { mode: 'video' as UploadMode, label: 'Video', Icon: VideoIcon, gradient: 'linear-gradient(135deg, #A78BFA, #60A5FA)' },
                    { mode: 'short' as UploadMode, label: 'Short', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="1" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><line x1="7" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>, gradient: 'linear-gradient(135deg, #F472B6, #FDBA74)' },
                ].map((tab) => (
                    <button
                        key={tab.mode}
                        onClick={() => switchMode(tab.mode)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                        style={mode === tab.mode ? { background: tab.gradient, color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' } : { color: '#94A3B8' }}
                    >
                        {'Icon' in tab && tab.Icon ? <tab.Icon size={18} /> : tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mode description */}
            <AnimatePresence mode="wait">
                <motion.div key={mode} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="rounded-2xl p-4 mb-6 border"
                    style={isShort ? { background: 'rgba(244,114,182,0.05)', borderColor: 'rgba(244,114,182,0.2)' } : { background: 'rgba(96,165,250,0.05)', borderColor: 'rgba(96,165,250,0.2)' }}>
                    <div className="flex items-start gap-3">
                        {isShort ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" fill="#FBCFE8" /><rect x="8" y="6" width="8" height="10" rx="1" fill="#F472B6" /><line x1="10" y1="18" x2="14" y2="18" stroke="#EC4899" strokeWidth="1" strokeLinecap="round" /></svg>
                            : <VideoIcon size={24} />}
                        <div>
                            <p className="font-bold text-sm" style={{ color: isShort ? '#EC4899' : '#3B82F6' }}>{isShort ? 'Short-Form Video' : 'Standard Video'}</p>
                            <p className="text-xs text-gray-400 mt-1">{isShort ? 'Upload bite-sized vertical videos (9:16). Ideal for quick lessons under 60 seconds.' : 'Upload full-length learning videos (16:9). Great for detailed lessons and guided activities.'}</p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {success && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#34D399" /><path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div><p className="font-bold" style={{ color: '#059669' }}>{isShort ? 'Short' : 'Video'} uploaded!</p><p className="text-sm text-gray-400">Go to Content to publish it.</p></div>
                </motion.div>
            )}

            <form onSubmit={handleUpload} className="space-y-6">
                {/* Drag & drop */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                    className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors"
                    style={dragOver ? { borderColor: isShort ? '#F472B6' : '#A78BFA', background: isShort ? 'rgba(244,114,182,0.05)' : 'rgba(167,139,250,0.05)' }
                        : file ? { borderColor: '#34D399', background: 'rgba(52,211,153,0.05)' } : { borderColor: '#E2E8F0' }}
                    onClick={() => document.getElementById('fileInput')?.click()}>
                    <input id="fileInput" type="file" accept="video/mp4,.mkv" onChange={handleFileSelect} className="hidden" />
                    {file ? (
                        <div>
                            <VideoIcon size={40} className="mx-auto" />
                            <p className="font-bold mt-2 text-slate-700">{file.name}</p>
                            <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                    ) : (
                        <div>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto">
                                <path d="M20 28V12M20 12L13 19M20 12L27 19" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="6" y="32" width="28" height="2" rx="1" fill="#CBD5E1" />
                            </svg>
                            <p className="font-bold mt-2 text-slate-600">{isShort ? 'Drop short video here or click to browse' : 'Drop video here or click to browse'}</p>
                            <p className="text-sm text-gray-400">{isShort ? 'MP4, MKV - Vertical 9:16 - Under 60s recommended' : 'MP4, MKV supported'}</p>
                        </div>
                    )}
                </motion.div>

                {uploading && (
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <motion.div className="h-full rounded-full relative overflow-hidden" initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            style={{ background: isShort ? 'linear-gradient(90deg, #F472B6, #FDBA74)' : 'linear-gradient(90deg, #A78BFA, #F472B6)' }}>
                            <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }} />
                        </motion.div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none text-slate-800 transition-all"
                        placeholder={isShort ? 'e.g. Count to 10!' : 'e.g. Colors of the Rainbow'}
                        onFocus={(e) => e.target.style.borderColor = '#C4B5FD'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={isShort ? 2 : 3}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none text-slate-800 resize-none transition-all"
                        placeholder={isShort ? 'Quick description...' : 'Brief description...'}
                        onFocus={(e) => e.target.style.borderColor = '#C4B5FD'} onBlur={(e) => e.target.style.borderColor = '#E2E8F0'} />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CATEGORIES.map((cat) => (
                            <motion.button key={cat.value} type="button" whileTap={{ scale: 0.95 }} onClick={() => setCategory(cat.value)}
                                className="px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                                style={category === cat.value
                                    ? { background: isShort ? '#F472B6' : '#A78BFA', color: 'white' }
                                    : { background: '#F1F5F9', color: '#64748B' }}>
                                {CATEGORY_ICONS[cat.value]} {cat.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Difficulty</label>
                    <div className="flex gap-2">
                        {DIFFICULTIES.map((diff) => (
                            <motion.button key={diff.value} type="button" whileTap={{ scale: 0.95 }} onClick={() => setDifficulty(diff.value)}
                                className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                style={difficulty === diff.value
                                    ? { background: isShort ? '#F472B6' : '#A78BFA', color: 'white' }
                                    : { background: '#F1F5F9', color: '#64748B' }}>
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: diff.color }} />
                                {diff.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:outline-none text-slate-800 cursor-pointer">
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                    </select>
                </div>

                {error && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>{error}</div>}

                <motion.button type="submit" disabled={uploading || !file || !title} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden"
                    style={{ background: isShort ? 'linear-gradient(135deg, #F472B6, #FDBA74)' : 'linear-gradient(135deg, #A78BFA, #F472B6)', boxShadow: '0 8px 25px rgba(167,139,250,0.3)' }}>
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', backgroundSize: '200% 100%' }} />
                    <span className="relative flex items-center justify-center gap-2">
                        {uploading ? `Uploading... ${progress}%` : (
                            <><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 14V4M9 4L5 8M9 4L13 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> Upload {isShort ? 'Short' : 'Video'}</>
                        )}
                    </span>
                </motion.button>
            </form>
        </div>
    )
}
