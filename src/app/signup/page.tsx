'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PetalFlower, SparkleIcon, ArrowBackIcon, ButterflyIcon } from '@/components/ui/PetalIcons'

export default function SignUpPage() {
    const router = useRouter()
    const { signUp } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (password !== confirmPassword) { setError('Passwords do not match'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return }
        try {
            setLoading(true)
            await signUp(email, password, name)
            router.push('/login/parent')
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-aurora-mesh flex items-center justify-center relative overflow-hidden px-6 py-12">
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-[400px] h-[400px] animate-blob-morph opacity-20"
                    style={{ background: 'linear-gradient(135deg, #FDBA74, #FDA4AF)', top: '10%', left: '10%', filter: 'blur(80px)' }}
                />
                <div className="absolute w-[350px] h-[350px] animate-blob-morph opacity-15"
                    style={{ background: 'linear-gradient(135deg, #6EE7B7, #7DD3FC)', bottom: '5%', right: '5%', filter: 'blur(70px)', animationDelay: '-5s' }}
                />
            </div>

            {/* Floating decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[
                    { x: '10%', y: '15%', delay: 0 },
                    { x: '85%', y: '70%', delay: 1.5 },
                    { x: '80%', y: '10%', delay: 0.5 },
                    { x: '20%', y: '80%', delay: 2 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: item.x, top: item.y }}
                        animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -15, 0], rotate: [0, 10, 0] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
                    >
                        {i % 2 === 0
                            ? <SparkleIcon size={20} color={['#FDBA74', '#C4B5FD', '#7DD3FC', '#6EE7B7'][i]} />
                            : <ButterflyIcon size={22} />
                        }
                    </motion.div>
                ))}
            </div>

            {/* Back */}
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
                    className="text-center mb-8"
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #FDBA74, #FDA4AF)', boxShadow: '0 12px 40px rgba(253,186,116,0.3)' }}
                    >
                        <SparkleIcon size={40} color="#FFF" />
                    </motion.div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-1 tracking-tight">Join PetalPath</h1>
                    <p className="text-slate-500 font-medium">Start your child&apos;s learning journey</p>
                </motion.div>

                {/* Form */}
                <motion.form
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold text-center border border-red-100">
                            {error}
                        </motion.div>
                    )}

                    {[
                        { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3.5" fill="#94A3B8" /><path d="M2 15C2 12 4.7 9.5 8 9.5C11.3 9.5 14 12 14 15" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /></svg>, label: 'Full Name', type: 'text', value: name, onChange: setName, placeholder: 'John Doe' },
                        { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" fill="#94A3B8" /><path d="M1 5.5L8 10L15 5.5" stroke="white" strokeWidth="1" /></svg>, label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'parent@email.com' },
                        { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="2" fill="#94A3B8" /><path d="M5 7V5C5 3.3 6.3 2 8 2C9.7 2 11 3.3 11 5V7" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /></svg>, label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: 'At least 6 characters' },
                        { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="2" fill="#94A3B8" /><path d="M6 11L7.5 12.5L10 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>, label: 'Confirm Password', type: 'password', value: confirmPassword, onChange: setConfirmPassword, placeholder: 'Type password again' },
                    ].map((field, i) => (
                        <motion.div
                            key={field.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.08 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-1.5 pl-1">
                                {field.icon} {field.label}
                            </label>
                            <input
                                type={field.type}
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder={field.placeholder}
                                required
                                className="w-full px-4 py-3.5 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200 text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
                                style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
                                onFocus={(e) => e.target.style.borderColor = '#C4B5FD'}
                                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </motion.div>
                    ))}

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl cursor-pointer transition-all disabled:opacity-50 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #FDBA74, #FDA4AF)',
                            boxShadow: '0 8px 30px rgba(253,186,116,0.3)',
                        }}
                    >
                        <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
                        <span className="relative">{loading ? 'Creating...' : 'Create Account'}</span>
                    </motion.button>
                </motion.form>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-6 text-slate-500 font-medium"
                >
                    Already have an account?{' '}
                    <button
                        onClick={() => router.push('/login')}
                        className="font-bold cursor-pointer hover:underline"
                        style={{ color: '#F472B6' }}
                    >Sign In</button>
                </motion.p>
            </div>
        </main>
    )
}
