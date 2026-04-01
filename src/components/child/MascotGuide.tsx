'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { MascotEmotion } from '@/lib/activity-types'

interface MascotGuideProps {
    message?: string
    emotion?: MascotEmotion
    size?: 'sm' | 'md' | 'lg'
}

const EMOTION_CONFIG: Record<MascotEmotion, { emoji: string; color: string; animation: object }> = {
    happy: {
        emoji: '🌸',
        color: 'from-pink-100 to-purple-100',
        animation: { y: [0, -8, 0], rotate: [0, 3, -3, 0] },
    },
    encouraging: {
        emoji: '💪',
        color: 'from-amber-100 to-orange-100',
        animation: { y: [0, -5, 0], scale: [1, 1.1, 1] },
    },
    thinking: {
        emoji: '🤔',
        color: 'from-blue-100 to-cyan-100',
        animation: { rotate: [0, 5, -5, 0], y: [0, -3, 0] },
    },
    celebrating: {
        emoji: '🎉',
        color: 'from-yellow-100 to-green-100',
        animation: { y: [0, -15, 0], rotate: [0, 10, -10, 5, -5, 0], scale: [1, 1.2, 1] },
    },
}

export default function MascotGuide({ message, emotion = 'happy', size = 'md' }: MascotGuideProps) {
    const config = EMOTION_CONFIG[emotion]

    const sizes = {
        sm: { container: 'w-14 h-14', text: 'text-2xl', messageText: 'text-sm', maxW: 'max-w-[200px]' },
        md: { container: 'w-20 h-20', text: 'text-4xl', messageText: 'text-base', maxW: 'max-w-[280px]' },
        lg: { container: 'w-28 h-28', text: 'text-5xl', messageText: 'text-lg', maxW: 'max-w-[340px]' },
    }

    const s = sizes[size]

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                animate={config.animation as Record<string, number[]>}
                transition={{
                    duration: emotion === 'celebrating' ? 1.5 : 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className={`${s.container} rounded-full bg-gradient-to-br ${config.color} shadow-xl flex items-center justify-center border-2 border-white/60`}
            >
                <span className={s.text}>{config.emoji}</span>
            </motion.div>

            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        key={message}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-md relative ${s.maxW}`}
                    >
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 shadow-sm" />
                        <p className={`relative z-10 ${s.messageText} font-semibold text-gray-600 text-center leading-relaxed`}>
                            {message}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
