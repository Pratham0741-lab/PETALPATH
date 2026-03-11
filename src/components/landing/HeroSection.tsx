'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import MagicButton from '@/components/ui/MagicButton'
import { PetalFlower, VideoIcon, MicIcon, CameraIcon, RunIcon, SparkleIcon, ButterflyIcon, StarIcon } from '@/components/ui/PetalIcons'

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null)

    // Cursor parallax effect
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e
            const x = (clientX / window.innerWidth - 0.5) * 30
            const y = (clientY / window.innerHeight - 0.5) * 30

            const layers = container.querySelectorAll('[data-parallax]')
            layers.forEach((layer) => {
                const speed = parseFloat((layer as HTMLElement).dataset.parallax || '1')
                    ; (layer as HTMLElement).style.transform = `translate(${x * speed}px, ${y * speed}px)`
            })
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
        >
            {/* Aurora mesh bg */}
            <div className="absolute inset-0 bg-aurora-mesh" />

            {/* Animated gradient blob orbs behind text */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute w-[500px] h-[500px] animate-blob-morph opacity-30"
                    style={{ background: 'linear-gradient(135deg, #C4B5FD, #7DD3FC)', top: '10%', left: '15%', filter: 'blur(80px)' }}
                />
                <div
                    className="absolute w-[400px] h-[400px] animate-blob-morph opacity-25"
                    style={{ background: 'linear-gradient(135deg, #FDA4AF, #FDBA74)', top: '30%', right: '10%', filter: 'blur(70px)', animationDelay: '-4s' }}
                />
                <div
                    className="absolute w-[350px] h-[350px] animate-blob-morph opacity-20"
                    style={{ background: 'linear-gradient(135deg, #6EE7B7, #7DD3FC)', bottom: '15%', left: '30%', filter: 'blur(60px)', animationDelay: '-8s' }}
                />
            </div>

            {/* Floating SVG decorations with parallax */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[
                    { Icon: SparkleIcon, x: '8%', y: '18%', delay: 0, speed: 1.5, size: 28, color: '#C4B5FD' },
                    { Icon: StarIcon, x: '88%', y: '12%', delay: 0.5, speed: 2, size: 24 },
                    { Icon: ButterflyIcon, x: '78%', y: '68%', delay: 1, speed: 1.2, size: 30 },
                    { Icon: SparkleIcon, x: '12%', y: '72%', delay: 1.5, speed: 1.8, size: 22, color: '#7DD3FC' },
                    { Icon: StarIcon, x: '92%', y: '42%', delay: 0.3, speed: 1.0, size: 20 },
                    { Icon: SparkleIcon, x: '4%', y: '48%', delay: 0.8, speed: 1.4, size: 26, color: '#6EE7B7' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        data-parallax={item.speed}
                        className="absolute"
                        style={{ left: item.x, top: item.y }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0.3, 0.7, 0.3],
                            scale: 1,
                            y: [0, -25, 0],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: item.delay,
                        }}
                    >
                        <item.Icon size={item.size} color={(item as { color?: string }).color} />
                    </motion.div>
                ))}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                {/* Mascot */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
                    className="mb-8 inline-block"
                >
                    <div
                        className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-white/80 backdrop-blur-md shadow-2xl flex items-center justify-center border border-white/50"
                        style={{ boxShadow: '0 25px 60px -12px rgba(196, 181, 253, 0.5)' }}
                    >
                        <PetalFlower size={80} className="md:w-[96px] md:h-[96px]" />
                    </div>
                </motion.div>

                {/* Title with staggered letter entrance */}
                <motion.h1
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-6xl md:text-8xl lg:text-9xl font-black mb-4 tracking-tight"
                >
                    <span className="text-aurora-gradient">PetalPath</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-xl md:text-2xl lg:text-3xl text-slate-500 mb-12 font-semibold max-w-2xl mx-auto leading-snug"
                >
                    A magical learning playground where
                    <br />
                    little explorers learn through play
                </motion.p>

                {/* Activity preview icons */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                    className="flex justify-center gap-5 md:gap-7 mb-14"
                >
                    {[
                        { Icon: VideoIcon, label: 'Watch', gradient: 'linear-gradient(135deg, #60A5FA, #22D3EE)' },
                        { Icon: MicIcon, label: 'Speak', gradient: 'linear-gradient(135deg, #F472B6, #FB7185)' },
                        { Icon: CameraIcon, label: 'Show', gradient: 'linear-gradient(135deg, #34D399, #2DD4BF)' },
                        { Icon: RunIcon, label: 'Move', gradient: 'linear-gradient(135deg, #FBBF24, #F97316)' },
                    ].map((item, i) => (
                        <motion.div
                            key={item.label}
                            initial={{ scale: 0, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{
                                delay: 1.1 + i * 0.1,
                                type: 'spring',
                                stiffness: 200,
                                damping: 12,
                            }}
                            whileHover={{ scale: 1.15, y: -8, rotate: 5 }}
                            className="w-18 h-18 md:w-22 md:h-22 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl cursor-default p-4"
                            style={{ background: item.gradient, width: 76, height: 76 }}
                        >
                            <item.Icon size={40} />
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <MagicButton variant="primary" size="lg" href="/login">
                        Start Learning Free
                    </MagicButton>
                    <MagicButton variant="secondary" size="lg" href="/signup">
                        Create Account
                    </MagicButton>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2 text-slate-400"
                >
                    <span className="text-xs font-semibold tracking-wider uppercase">Scroll to explore</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4V18M7 13L12 18L17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.div>
            </motion.div>
        </section>
    )
}
