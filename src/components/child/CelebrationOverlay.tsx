'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrophyIcon, StarIcon, SparkleIcon } from '@/components/ui/PetalIcons'

interface CelebrationOverlayProps {
    show: boolean
    onComplete: () => void
    message?: string
}

const CONFETTI_COLORS = ['#7DD3FC', '#C4B5FD', '#6EE7B7', '#FDBA74', '#FDA4AF', '#FDE68A']
const CONFETTI_SHAPES = ['rect', 'circle', 'star'] as const

function ConfettiPiece({ index }: { index: number }) {
    const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length]
    const shape = CONFETTI_SHAPES[index % CONFETTI_SHAPES.length]
    const left = Math.random() * 100
    const delay = Math.random() * 0.8
    const duration = 2 + Math.random() * 2
    const size = 8 + Math.random() * 10
    const rotation = Math.random() * 720

    return (
        <motion.div
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
                y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
                x: (Math.random() - 0.5) * 200,
                opacity: [1, 1, 0],
                rotate: rotation,
                scale: [1, 1, 0.5],
            }}
            transition={{ duration, delay, ease: 'easeIn' }}
            style={{ position: 'absolute', left: `${left}%`, top: 0 }}
        >
            {shape === 'star' ? (
                <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L9.8 5.8L15 6.4L11.2 9.8L12.2 15L8 12.4L3.8 15L4.8 9.8L1 6.4L6.2 5.8L8 1Z" fill={color} />
                </svg>
            ) : shape === 'circle' ? (
                <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" fill={color} />
                </svg>
            ) : (
                <svg width={size} height={size * 0.6} viewBox="0 0 12 8" fill="none">
                    <rect x="1" y="1" width="10" height="6" rx="1.5" fill={color} />
                </svg>
            )}
        </motion.div>
    )
}

export default function CelebrationOverlay({ show, onComplete, message }: CelebrationOverlayProps) {
    const [confettiPieces, setConfettiPieces] = useState<number[]>([])

    useEffect(() => {
        if (show) {
            setConfettiPieces(Array.from({ length: 80 }, (_, i) => i))
            const timer = setTimeout(() => {
                onComplete()
                setConfettiPieces([])
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [show, onComplete])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    onClick={onComplete}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

                    {/* Confetti */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {confettiPieces.map((i) => (
                            <ConfettiPiece key={i} index={i} />
                        ))}
                    </div>

                    {/* Central message */}
                    <motion.div
                        initial={{ scale: 0, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        className="relative z-10 glass-strong rounded-3xl p-10 text-center shadow-2xl max-w-sm mx-4"
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl" style={{ background: 'rgba(250,204,21,0.2)' }} />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.3, 1] }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="relative mb-5"
                        >
                            <TrophyIcon size={80} className="mx-auto" />
                            {/* Floating sparkles around trophy */}
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute"
                                    style={{ top: ['-5px', '10px', '-5px'][i], right: ['10px', '-5px', '60px'][i] }}
                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], y: [0, -8, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                >
                                    <SparkleIcon size={16} color={CONFETTI_COLORS[i]} />
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-2xl font-black text-slate-800 mb-2"
                        >
                            Amazing!
                        </motion.h2>
                        {message && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="text-slate-500 font-semibold text-lg flex items-center justify-center gap-2"
                            >
                                {message} <StarIcon size={20} />
                            </motion.p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
