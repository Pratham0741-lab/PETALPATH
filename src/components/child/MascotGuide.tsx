'use client'

import { motion } from 'framer-motion'

interface MascotGuideProps {
    message?: string
    emoji?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function MascotGuide({ message, emoji = '🌸', size = 'md' }: MascotGuideProps) {
    const sizes = {
        sm: 'w-14 h-14 text-2xl',
        md: 'w-20 h-20 text-4xl',
        lg: 'w-28 h-28 text-5xl',
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <motion.div
                animate={{
                    y: [0, -8, 0],
                    rotate: [0, 3, -3, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className={`${sizes[size]} rounded-full bg-white shadow-xl flex items-center justify-center`}
            >
                {emoji}
            </motion.div>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl px-4 py-2 shadow-md relative"
                >
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-md" />
                    <p className="relative z-10 text-sm font-semibold text-gray-600 text-center">{message}</p>
                </motion.div>
            )}
        </div>
    )
}
