'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { VideoIcon, MicIcon, CameraIcon, StarIcon, PetalFlower } from '@/components/ui/PetalIcons'

export default function StorySection() {
    const ref = useRef<HTMLElement>(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
    const lineHeight = useTransform(scrollYProgress, [0.1, 0.5], ['0%', '100%'])

    return (
        <section ref={ref} className="py-24 md:py-36 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(125,211,252,0.05), transparent)' }} />

            <div className="section-container relative">
                {/* Problem */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-20 md:mb-28"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #FEE2E2, #FECACA)' }}
                    >
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                            <circle cx="20" cy="18" r="12" fill="#FCA5A5" />
                            <circle cx="15" cy="16" r="2" fill="#1E293B" />
                            <circle cx="25" cy="16" r="2" fill="#1E293B" />
                            <path d="M14 24C14 24 17 21 20 21C23 21 26 24 26 24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-6">
                        Screen time without{' '}
                        <span className="text-slate-400 line-through decoration-4" style={{ textDecorationColor: 'rgba(253,164,175,0.6)' }}>structure</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                        Most kids are watching random videos with no learning outcomes.
                        Parents feel guilty. Kids aren&apos;t growing.
                    </p>

                    {/* Before visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="mt-10 flex justify-center gap-4"
                    >
                        {[
                            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" fill="#94A3B8" /><path d="M10 8L16 12L10 16V8Z" fill="#CBD5E1" /></svg>, label: 'Random' },
                            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="#94A3B8" /><path d="M9 10H15M9 14H13" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" /></svg>, label: 'No Goals' },
                            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="3" fill="#CBD5E1" /></svg>, label: 'No Progress' },
                            { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 8H20M4 8L8 4M4 8L8 12M20 16H4M20 16L16 12M20 16L16 20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>, label: 'Repeat' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={isInView ? { opacity: 0.6 } : {}}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="w-16 h-16 rounded-2xl bg-slate-100 flex flex-col items-center justify-center gap-1"
                            >
                                {item.icon}
                                <span className="text-[10px] font-bold text-slate-400">{item.label}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Transition line with animated fill */}
                <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={isInView ? { opacity: 1, scaleY: 1 } : {}}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="flex justify-center mb-20 md:mb-28"
                >
                    <div className="w-px h-28 bg-slate-200 relative overflow-hidden rounded-full">
                        <motion.div
                            className="absolute top-0 left-0 w-full rounded-full"
                            style={{
                                height: lineHeight,
                                background: 'linear-gradient(180deg, #CBD5E1, #6EE7B7)',
                            }}
                        />
                        <motion.div
                            animate={{ y: [0, 24, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -bottom-5 left-1/2 -translate-x-1/2"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2V12M4 8L8 12L12 8" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Solution */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{ delay: 1.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #FBCFE8, #E9D5FF)' }}
                    >
                        <PetalFlower size={44} />
                    </motion.div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-6">
                        Learning that feels like{' '}
                        <span className="text-aurora-gradient">magic</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
                        PetalPath turns screen time into structured, multi-sensory learning sessions
                        that kids love and parents trust.
                    </p>

                    {/* After visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 1.4, duration: 0.8 }}
                        className="mt-10 flex justify-center gap-4"
                    >
                        {[
                            { Icon: VideoIcon, gradient: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(34,211,238,0.2))' },
                            { Icon: MicIcon, gradient: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(251,113,133,0.2))' },
                            { Icon: CameraIcon, gradient: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(45,212,191,0.2))' },
                            { Icon: StarIcon, gradient: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(253,224,71,0.2))' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ delay: 1.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                                whileHover={{ scale: 1.15, rotate: 5 }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/50 shadow-lg cursor-default"
                                style={{ background: item.gradient }}
                            >
                                <item.Icon size={28} />
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}
