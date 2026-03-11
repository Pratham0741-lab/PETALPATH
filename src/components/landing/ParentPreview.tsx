'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ChartIcon } from '@/components/ui/PetalIcons'

const stats = [
    { icon: <ChartIcon size={28} />, label: 'Weekly Progress', value: 87, suffix: '%', color: '#10B981' },
    { icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 2L17 10L26 11L20 17L21.5 26L14 22L6.5 26L8 17L2 11L11 10L14 2Z" fill="#F59E0B" /><path d="M14 6L16 11L22 11.5L18 15.5L19 21L14 18L9 21L10 15.5L6 11.5L12 11L14 6Z" fill="#FDE68A" opacity="0.5" /></svg>, label: 'Stars Earned', value: 142, suffix: '', color: '#F59E0B' },
    { icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="11" fill="#E0F2FE" /><path d="M14 6L16 11L21 12L17 16L18 21L14 18.5L10 21L11 16L7 12L12 11L14 6Z" fill="#3B82F6" /></svg>, label: 'Skills Mastered', value: 12, suffix: '', color: '#3B82F6' },
    { icon: <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="4" fill="#EDE9FE" /><rect x="8" y="8" width="4" height="4" rx="1" fill="#8B5CF6" /><rect x="16" y="8" width="4" height="4" rx="1" fill="#A78BFA" /><rect x="8" y="16" width="4" height="4" rx="1" fill="#C4B5FD" /><rect x="16" y="16" width="4" height="4" rx="1" fill="#8B5CF6" /></svg>, label: 'Days Active', value: 21, suffix: '', color: '#8B5CF6' },
]

function AnimatedCounter({ value, suffix, isInView }: { value: number; suffix: string; isInView: boolean }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (!isInView) return
        let start = 0
        const duration = 1500
        const step = (timestamp: number) => {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * value))
            if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
    }, [isInView, value])
    return <>{count}{suffix}</>
}

export default function ParentPreview() {
    const ref = useRef<HTMLElement>(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })

    return (
        <section ref={ref} className="py-24 md:py-36 relative">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(241,245,249,0.5), transparent)' }} />

            <div className="section-container relative">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left: text */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={isInView ? { scale: 1 } : {}}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="w-20 h-20 mb-6 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}
                        >
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <circle cx="13" cy="13" r="5" fill="#34D399" />
                                <circle cx="27" cy="13" r="5" fill="#60A5FA" />
                                <circle cx="20" cy="24" r="4.5" fill="#F472B6" />
                                <path d="M7 27C7 24.2 9.2 22 12 22H16C17.5 22 18.8 22.7 19.6 23.8" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                                <path d="M33 27C33 24.2 30.8 22 28 22H24C22.5 22 21.2 22.7 20.4 23.8" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </motion.div>
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 mb-6">
                            Parents See{' '}
                            <span className="text-aurora-gradient">Everything</span>
                        </h2>
                        <p className="text-lg md:text-xl text-slate-500 font-medium mb-8 leading-relaxed">
                            Track your child&apos;s learning journey with beautiful dashboards,
                            weekly reports, and real-time progress updates.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14L8 9L12 13L17 6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="17" cy="6" r="2" fill="#10B981" /></svg>, text: 'Real-time progress tracking' },
                                { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" fill="#22C55E" opacity="0.2" /><path d="M7 7H13M7 10H11M7 13H9" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" /></svg>, text: 'Weekly summary reports' },
                                { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" fill="#8B5CF6" opacity="0.2" /><path d="M10 6V10L13 12" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" /></svg>, text: 'AI-powered skill assessments' },
                                { icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3L12 7L17 8L14 11L14.5 16L10 14L5.5 16L6 11L3 8L8 7L10 3Z" fill="#F59E0B" opacity="0.3" /><path d="M10 6L11 8.5L14 9L12 11L12.5 14L10 12.5L7.5 14L8 11L6 9L9 8.5L10 6Z" fill="#F59E0B" /></svg>, text: 'Personalized learning paths' },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.text}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                                        {item.icon}
                                    </div>
                                    <span className="text-slate-600 font-semibold">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Phone mockup Dashboard */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="phone-mockup max-w-sm mx-auto">
                            <div className="phone-mockup-screen p-5">
                                {/* Dashboard header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <h3 className="text-base font-black text-slate-800">Dashboard</h3>
                                        <p className="text-xs text-slate-400 font-medium">This week&apos;s overview</p>
                                    </div>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #6EE7B7, #34D399)' }}>
                                        <ChartIcon size={20} />
                                    </div>
                                </div>

                                {/* Stats grid */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    {stats.map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                            transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                                            className="bg-slate-50 rounded-2xl p-3 text-center"
                                        >
                                            <div className="flex justify-center mb-1">{stat.icon}</div>
                                            <p className="text-xl font-black" style={{ color: stat.color }}>
                                                <AnimatedCounter value={stat.value} suffix={stat.suffix} isInView={isInView} />
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stat.label}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Progress bars with shimmer */}
                                <div className="space-y-2.5">
                                    {[
                                        { skill: 'Speaking', pct: 85, color: '#F472B6' },
                                        { skill: 'Observation', pct: 72, color: '#34D399' },
                                        { skill: 'Movement', pct: 90, color: '#FBBF24' },
                                    ].map((skill) => (
                                        <div key={skill.skill}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-bold text-slate-600">{skill.skill}</span>
                                                <span className="font-bold text-slate-400">{skill.pct}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={isInView ? { width: `${skill.pct}%` } : {}}
                                                    transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                                    className="h-full rounded-full relative overflow-hidden"
                                                    style={{ background: skill.color }}
                                                >
                                                    <div
                                                        className="absolute inset-0 animate-shimmer"
                                                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }}
                                                    />
                                                </motion.div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
