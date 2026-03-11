'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { VideoIcon, MicIcon, CameraIcon, RunIcon, StarIcon, TrophyIcon } from '@/components/ui/PetalIcons'

const features = [
    {
        Icon: VideoIcon,
        title: 'Watch',
        description: 'Curated educational videos with interactive elements that teach through stories',
        gradient: 'linear-gradient(135deg, #60A5FA, #22D3EE)',
        shadowColor: 'rgba(96, 165, 250, 0.25)',
        demo: 'Play & Learn',
        demoIcon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 2L12 7L4 12V2Z" fill="currentColor" /></svg>,
    },
    {
        Icon: MicIcon,
        title: 'Speak',
        description: 'AI-powered speech recognition encourages verbal expression and language skills',
        gradient: 'linear-gradient(135deg, #F472B6, #FB7185)',
        shadowColor: 'rgba(244, 114, 182, 0.25)',
        demo: 'Say "Hello!"',
        demoIcon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 5C1 5 3 1 7 1C11 1 13 5 13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="7" cy="9" r="3" fill="currentColor" /></svg>,
    },
    {
        Icon: CameraIcon,
        title: 'Show',
        description: 'Real-time object detection turns the world into a fun, interactive classroom',
        gradient: 'linear-gradient(135deg, #34D399, #2DD4BF)',
        shadowColor: 'rgba(52, 211, 153, 0.25)',
        demo: 'I see a cat!',
        demoIcon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" /><circle cx="7" cy="7" r="2" fill="currentColor" /></svg>,
    },
    {
        Icon: RunIcon,
        title: 'Move',
        description: 'Fun physical activities promote healthy development and gross motor skills',
        gradient: 'linear-gradient(135deg, #FBBF24, #F97316)',
        shadowColor: 'rgba(251, 191, 36, 0.25)',
        demo: 'Spin around!',
        demoIcon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" /></svg>,
    },
    {
        Icon: TrophyIcon,
        title: 'Earn Stars',
        description: 'Reward system motivates continued learning & exploration through fun achievements',
        gradient: 'linear-gradient(135deg, #FACC15, #F59E0B)',
        shadowColor: 'rgba(250, 204, 21, 0.25)',
        demo: '+5 Stars!',
        demoIcon: <StarIcon size={14} />,
    },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })
    const [hovered, setHovered] = useState(false)

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
                delay: index * 0.12,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
            }}
            className="perspective-card"
        >
            <motion.div
                whileHover={{ y: -10, scale: 1.02, rotateY: 3, rotateX: -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                className="card-premium card-glow group cursor-default h-full relative overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Ambient glow on hover */}
                <motion.div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl"
                    animate={{ opacity: hovered ? 0.15 : 0 }}
                    style={{ background: feature.gradient }}
                />

                {/* Icon */}
                <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-5 relative"
                    style={{ background: feature.gradient, boxShadow: `0 8px 24px ${feature.shadowColor}` }}
                >
                    <feature.Icon size={32} />
                </motion.div>

                <h3 className="text-xl font-black text-slate-800 mb-2">{feature.title}</h3>

                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-5">{feature.description}</p>

                {/* Mini demo tag */}
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-50/80 text-sm font-bold text-slate-600 group-hover:bg-white/90 transition-all border border-slate-100">
                    <span className="text-slate-400 group-hover:text-slate-600 transition-colors">{feature.demoIcon}</span>
                    {feature.demo}
                </div>
            </motion.div>
        </motion.div>
    )
}

export default function FeatureShowcase() {
    const sectionRef = useRef<HTMLElement>(null)
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

    return (
        <section ref={sectionRef} className="py-24 md:py-36 relative">
            {/* Subtle bg gradient */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(196,181,253,0.04), transparent)' }} />

            <div className="section-container relative">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16 md:mb-20"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #E0E7FF, #EDE9FE)' }}
                    >
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <rect x="6" y="10" width="10" height="7" rx="2" fill="#818CF8" />
                            <rect x="20" y="10" width="10" height="7" rx="2" fill="#A78BFA" />
                            <rect x="6" y="20" width="10" height="7" rx="2" fill="#C084FC" />
                            <rect x="20" y="20" width="10" height="7" rx="2" fill="#E879F9" />
                            <circle cx="18" cy="6" r="3" fill="#6366F1" />
                        </svg>
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-4">
                        Five Ways to{' '}
                        <span className="text-aurora-gradient">Learn & Play</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 font-medium max-w-lg mx-auto">
                        Every session combines multiple activities to keep little minds engaged and growing.
                    </p>
                </motion.div>

                {/* Feature grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, i) => (
                        <FeatureCard key={feature.title} feature={feature} index={i} />
                    ))}
                </div>
            </div>
        </section>
    )
}
