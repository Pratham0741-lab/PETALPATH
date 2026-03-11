'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface VideoPlayerProps {
    videoUrl?: string
    title?: string
    onComplete?: () => void
    onProgress?: (progress: number) => void
}

export default function VideoPlayer({ videoUrl, title, onComplete, onProgress }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)

    const togglePlay = () => {
        if (!videoRef.current) return
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }

    const handleTimeUpdate = () => {
        if (!videoRef.current) return
        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100
        setProgress(p)
        onProgress?.(p)
    }

    const handleEnded = () => {
        setIsPlaying(false)
        onComplete?.()
    }

    // Placeholder when no video URL
    if (!videoUrl) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full aspect-video rounded-3xl bg-gradient-to-br from-petal-blue/20 to-petal-purple/20 flex flex-col items-center justify-center overflow-hidden"
            >
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl mb-4"
                >
                    🎬
                </motion.div>
                <p className="text-lg font-bold text-gray-400">Video coming soon!</p>
                <p className="text-sm text-gray-300 mt-1">{title || 'Learning video'}</p>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 text-3xl animate-float">⭐</div>
                <div className="absolute bottom-4 left-4 text-2xl animate-float" style={{ animationDelay: '1s' }}>🌸</div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl"
        >
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                playsInline
            />

            {/* Play/Pause overlay */}
            <motion.button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
            >
                {!isPlaying && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
                    >
                        <span className="text-4xl ml-1">▶️</span>
                    </motion.div>
                )}
            </motion.button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                <motion.div
                    className="h-full bg-gradient-to-r from-petal-pink to-petal-purple rounded-r-full"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Title */}
            {title && (
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-xl px-3 py-1">
                    <p className="text-white text-sm font-bold">{title}</p>
                </div>
            )}
        </motion.div>
    )
}
