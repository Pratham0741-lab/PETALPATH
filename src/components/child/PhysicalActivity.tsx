'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PhysicalActivityProps {
    prompt?: string
    onComplete?: () => void
}

const PHYSICAL_ACTIVITIES = [
    { emoji: '🦘', action: 'Jump 5 times!', animation: 'jump' },
    { emoji: '🙆', action: 'Touch your toes!', animation: 'bend' },
    { emoji: '🧍', action: 'Stand on one foot!', animation: 'balance' },
    { emoji: '👏', action: 'Clap your hands!', animation: 'clap' },
    { emoji: '🔄', action: 'Spin around!', animation: 'spin' },
    { emoji: '🖐️', action: 'Wave hello!', animation: 'wave' },
]

export default function PhysicalActivity({ prompt, onComplete }: PhysicalActivityProps) {
    const [activity] = useState(
        () => PHYSICAL_ACTIVITIES[Math.floor(Math.random() * PHYSICAL_ACTIVITIES.length)]
    )
    const [countdown, setCountdown] = useState(10)
    const [isDone, setIsDone] = useState(false)

    useEffect(() => {
        if (countdown <= 0) {
            setIsDone(true)
            setTimeout(() => onComplete?.(), 1500)
            return
        }

        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown, onComplete])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-6 p-8"
        >
            <AnimatePresence mode="wait">
                {isDone ? (
                    <motion.div
                        key="done"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: 3, duration: 0.3 }}
                            className="text-7xl"
                        >
                            🏆
                        </motion.div>
                        <p className="text-2xl font-black text-petal-green">You did it!</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="active"
                        className="flex flex-col items-center gap-4"
                    >
                        {/* Animated emoji */}
                        <motion.div
                            animate={{
                                y: activity.animation === 'jump' ? [0, -30, 0] : 0,
                                rotate: activity.animation === 'spin' ? [0, 360] : [0, 10, -10, 0],
                                scale: activity.animation === 'clap' ? [1, 1.2, 1] : 1,
                            }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-7xl"
                        >
                            {activity.emoji}
                        </motion.div>

                        {/* Action text */}
                        <p className="text-2xl font-black text-gray-700 text-center">
                            {prompt || activity.action}
                        </p>

                        {/* Timer circle */}
                        <motion.div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                                <motion.circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="url(#timerGrad)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={283}
                                    strokeDashoffset={283 - (283 * (10 - countdown)) / 10}
                                />
                                <defs>
                                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#FB923C" />
                                        <stop offset="100%" stopColor="#FF6B9D" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute text-3xl font-black text-gray-700">{countdown}</span>
                        </motion.div>

                        <p className="text-sm text-gray-400">Keep going! 💪</p>

                        {/* Skip button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setIsDone(true); setTimeout(() => onComplete?.(), 500) }}
                            className="mt-4 px-6 py-2 rounded-full bg-gray-100 text-gray-500 text-sm font-semibold"
                        >
                            I&apos;m done! ✅
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
