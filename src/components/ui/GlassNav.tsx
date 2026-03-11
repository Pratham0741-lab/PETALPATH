'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PetalFlower } from '@/components/ui/PetalIcons'

export default function GlassNav() {
    const [scrolled, setScrolled] = useState(false)
    const [scrollPct, setScrollPct] = useState(0)
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            setScrollPct(docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <>
            {/* Scroll progress bar */}
            <div className="scroll-progress" style={{ width: `${scrollPct}%` }} />

            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'py-2.5 glass-strong shadow-lg shadow-black/5'
                        : 'py-4 bg-transparent'
                }`}
            >
                <div className="section-container flex items-center justify-between">
                    {/* Logo */}
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2.5 group cursor-pointer"
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #FDA4AF, #C4B5FD)' }}
                        >
                            <PetalFlower size={22} />
                        </div>
                        <span className="text-lg font-black text-slate-800 tracking-tight">
                            PetalPath
                        </span>
                    </button>

                    {/* CTA */}
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/login')}
                            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer rounded-lg hover:bg-white/50"
                        >
                            Log In
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/signup')}
                            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                            style={{
                                background: 'linear-gradient(135deg, #FDA4AF, #C4B5FD)',
                                boxShadow: '0 4px 15px rgba(253, 164, 175, 0.3)',
                            }}
                        >
                            Get Started
                        </motion.button>
                    </div>
                </div>
            </motion.nav>
        </>
    )
}
