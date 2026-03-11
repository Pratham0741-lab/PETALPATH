'use client'

import { motion } from 'framer-motion'
import { ActivityType } from '@/lib/types'

interface ActivityCardProps {
    type: ActivityType
    isActive?: boolean
    isCompleted?: boolean
    onClick?: () => void
    index?: number
}

const ACTIVITY_CONFIG = {
    video: {
        icon: '🎥',
        label: 'Watch',
        color: 'bg-petal-blue',
        gradient: 'from-petal-blue to-blue-400',
        shadow: 'shadow-petal-blue/40',
    },
    speaking: {
        icon: '🎤',
        label: 'Speak',
        color: 'bg-petal-pink',
        gradient: 'from-petal-pink to-pink-400',
        shadow: 'shadow-petal-pink/40',
    },
    camera: {
        icon: '📷',
        label: 'Show',
        color: 'bg-petal-green',
        gradient: 'from-petal-green to-green-400',
        shadow: 'shadow-petal-green/40',
    },
    physical: {
        icon: '🏃',
        label: 'Move',
        color: 'bg-petal-orange',
        gradient: 'from-petal-orange to-orange-400',
        shadow: 'shadow-petal-orange/40',
    },
}

export default function ActivityCard({ type, isActive, isCompleted, onClick, index = 0 }: ActivityCardProps) {
    const config = ACTIVITY_CONFIG[type]

    return (
        <motion.button
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClick}
            disabled={isCompleted}
            className={`relative btn-child flex flex-col items-center justify-center gap-2 p-6 w-full aspect-square rounded-3xl bg-gradient-to-br ${config.gradient} text-white shadow-xl ${config.shadow} ${isCompleted ? 'opacity-60' : ''
                } ${isActive ? 'animate-rainbow-border ring-4 ring-white' : ''}`}
        >
            {/* Completed check */}
            {isCompleted && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-petal-green flex items-center justify-center text-xl shadow-lg"
                >
                    ✅
                </motion.div>
            )}

            {/* Active glow */}
            {isActive && (
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`absolute inset-0 rounded-3xl ${config.color} opacity-30 blur-xl`}
                />
            )}

            <span className="text-5xl relative z-10">{config.icon}</span>
            <span className="text-lg font-bold relative z-10">{config.label}</span>
        </motion.button>
    )
}
