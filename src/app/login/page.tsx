'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PetalFlower, ChildIcon, FamilyIcon, ShieldIcon, SparkleIcon, ArrowBackIcon } from '@/components/ui/PetalIcons'

const roles = [
    {
        id: 'child',
        title: "I'm a Kid!",
        subtitle: 'Play & learn with fun activities!',
        Icon: ChildIcon,
        gradient: 'linear-gradient(135deg, #22D3EE, #60A5FA)',
        shadow: '0 8px 30px rgba(34, 211, 238, 0.3)',
        path: '/login/child',
    },
    {
        id: 'parent',
        title: 'Parent',
        subtitle: "Track your child's progress",
        Icon: FamilyIcon,
        gradient: 'linear-gradient(135deg, #34D399, #6EE7B7)',
        shadow: '0 8px 30px rgba(52, 211, 153, 0.3)',
        path: '/login/parent',
    },
    {
        id: 'admin',
        title: 'Admin',
        subtitle: 'Manage platform content',
        Icon: ShieldIcon,
        gradient: 'linear-gradient(135deg, #C084FC, #F472B6)',
        shadow: '0 8px 30px rgba(192, 132, 252, 0.3)',
        path: '/login/admin',
    },
]

export default function LoginPage() {
    const router = useRouter()

    return (
        <main className="min-h-screen bg-aurora-mesh flex items-center justify-center relative overflow-hidden px-6 py-12">
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-[400px] h-[400px] animate-blob-morph opacity-20"
                    style={{ background: 'linear-gradient(135deg, #C4B5FD, #7DD3FC)', top: '5%', right: '10%', filter: 'blur(80px)' }}
                />
                <div className="absolute w-[350px] h-[350px] animate-blob-morph opacity-15"
                    style={{ background: 'linear-gradient(135deg, #FDA4AF, #FDBA74)', bottom: '10%', left: '5%', filter: 'blur(70px)', animationDelay: '-5s' }}
                />
            </div>

            {/* Floating SVG decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[
                    { x: '15%', y: '10%', delay: 0, color: '#C4B5FD' },
                    { x: '85%', y: '80%', delay: 1, color: '#7DD3FC' },
                    { x: '75%', y: '15%', delay: 2, color: '#FDA4AF' },
                    { x: '10%', y: '75%', delay: 0.5, color: '#6EE7B7' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: item.x, top: item.y }}
                        animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -15, 0] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
                    >
                        <SparkleIcon size={20} color={item.color} />
                    </motion.div>
                ))}
            </div>

            {/* Back button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
                className="absolute top-6 left-6 w-10 h-10 rounded-xl glass-strong shadow-md flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors cursor-pointer z-10"
            >
                <ArrowBackIcon size={20} />
            </motion.button>

            {/* Content */}
            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-10"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #FBCFE8, #E9D5FF)', boxShadow: '0 12px 40px rgba(196,181,253,0.3)' }}
                    >
                        <PetalFlower size={48} />
                    </motion.div>

                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2 tracking-tight">
                        Who are you?
                    </h1>
                    <p className="text-slate-500 font-medium">Choose how you want to sign in</p>
                </motion.div>

                {/* Role cards */}
                <div className="space-y-4">
                    {roles.map((role, i) => (
                        <motion.button
                            key={role.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ scale: 1.03, x: 8 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push(role.path)}
                            className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-white font-bold text-left shadow-xl cursor-pointer transition-all relative overflow-hidden"
                            style={{ background: role.gradient, boxShadow: role.shadow }}
                        >
                            {/* Shimmer overlay */}
                            <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />

                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                                <role.Icon size={28} />
                            </div>
                            <div className="relative">
                                <span className="text-lg block">{role.title}</span>
                                <span className="text-sm text-white/70 font-medium">{role.subtitle}</span>
                            </div>

                            {/* Arrow */}
                            <svg className="ml-auto shrink-0 opacity-60" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7 4L13 10L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>
                    ))}
                </div>

                {/* Sign up link */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-8 text-slate-500 font-medium"
                >
                    Don&apos;t have an account?{' '}
                    <button
                        onClick={() => router.push('/signup')}
                        className="font-bold cursor-pointer hover:underline"
                        style={{ color: '#F472B6' }}
                    >
                        Sign Up
                    </button>
                </motion.p>
            </div>
        </main>
    )
}
