'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FamilyIcon, SparkleIcon, ArrowBackIcon } from '@/components/ui/PetalIcons'

export default function ParentLoginPage() {
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
        else { router.push('/dashboard') }
    }

    return (
        <main className="min-h-screen safe-area flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4, #DBEAFE)' }}>
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[{ color: '#6EE7B7', x: 15, y: 20 }, { color: '#A7F3D0', x: 75, y: 10 }, { color: '#7DD3FC', x: 50, y: 80 }].map((d, i) => (
                    <motion.div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%` }}
                        animate={{ y: [0, -10, 0], opacity: [0.15, 0.35, 0.15] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}>
                        <SparkleIcon size={14} color={d.color} />
                    </motion.div>
                ))}
            </div>

            <motion.button onClick={() => router.push('/login')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer">
                <ArrowBackIcon size={20} />
            </motion.button>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #34D399, #22D3EE)' }}>
                <FamilyIcon size={40} />
            </motion.div>

            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl font-black text-gray-800 mb-2">Parent Login</motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-gray-500 mb-8">Welcome back!</motion.p>

            <motion.form initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 relative z-10">
                {error && <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm text-center">{error}</motion.div>}
                <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#64748B" strokeWidth="1.2" /><path d="M1 4.5L7 8L13 4.5" stroke="#64748B" strokeWidth="1.2" /></svg> Email
                    </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none text-lg transition-all bg-white"
                        placeholder="parent@email.com" onFocus={(e) => e.target.style.borderColor = '#34D399'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                    <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="7" rx="1.5" stroke="#64748B" strokeWidth="1.2" /><path d="M5 6V4.5C5 3.1 6.1 2 7.5 2C8.3 2 9 2.3 9.5 2.8" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" /></svg> Password
                    </label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none text-lg transition-all bg-white"
                        placeholder="••••••••" onFocus={(e) => e.target.style.borderColor = '#34D399'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg disabled:opacity-60 cursor-pointer relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #34D399, #22D3EE)', boxShadow: '0 8px 25px rgba(52,211,153,0.3)' }}>
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
                    <span className="relative flex items-center justify-center gap-2">
                        {loading ? <><svg width="18" height="18" className="animate-spin" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10" /></svg> Signing in...</> : 'Sign In'}
                    </span>
                </motion.button>
            </motion.form>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 text-gray-500 relative z-10">
                New here?{' '}<button onClick={() => router.push('/signup')} className="font-bold cursor-pointer" style={{ color: '#059669' }}>Create Account</button>
            </motion.p>
        </main>
    )
}
