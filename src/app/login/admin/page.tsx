'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldIcon, SparkleIcon, ArrowBackIcon } from '@/components/ui/PetalIcons'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(''); setLoading(true)
        const { error: signInError } = await signIn(email, password)
        if (signInError) { setError(signInError.message); setLoading(false) }
        else { router.push('/admin') }
    }

    return (
        <main className="min-h-screen safe-area flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B, #0F172A)' }}>
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[{ color: '#C4B5FD', x: 10, y: 15 }, { color: '#818CF8', x: 85, y: 25 }, { color: '#A78BFA', x: 45, y: 80 }].map((d, i) => (
                    <motion.div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%` }}
                        animate={{ y: [0, -10, 0], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}>
                        <SparkleIcon size={14} color={d.color} />
                    </motion.div>
                ))}
            </div>

            <motion.button onClick={() => router.push('/login')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
                <ArrowBackIcon size={20} color="#E2E8F0" />
            </motion.button>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-2xl shadow-xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #A78BFA, #EC4899)' }}>
                <ShieldIcon size={40} />
            </motion.div>

            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-black text-white mb-2">Admin Portal</motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-400 mb-8">Content Management System</motion.p>

            <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 relative z-10">
                {error && <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl p-4 text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>{error}</motion.div>}
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none text-lg text-white placeholder-gray-500 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                        placeholder="admin@petalpath.com" onFocus={(e) => e.target.style.borderColor = '#A78BFA'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="w-full px-5 py-4 rounded-2xl border-2 focus:outline-none text-lg text-white placeholder-gray-500 transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                        placeholder="••••••••" onFocus={(e) => e.target.style.borderColor = '#A78BFA'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg disabled:opacity-60 cursor-pointer relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #A78BFA, #EC4899)', boxShadow: '0 8px 25px rgba(167,139,250,0.3)' }}>
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% 100%' }} />
                    <span className="relative">{loading ? 'Authenticating...' : 'Sign In'}</span>
                </motion.button>
            </motion.form>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-gray-500 relative z-10">
                Don&apos;t have an admin account?{' '}<button onClick={() => router.push('/signup/admin')} className="font-bold cursor-pointer" style={{ color: '#F472B6' }}>Sign Up</button>
            </motion.p>
        </main>
    )
}
