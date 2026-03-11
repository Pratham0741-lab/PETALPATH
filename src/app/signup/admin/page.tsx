'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminSignupPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords don\'t match! 🔑')
            return
        }

        if (password.length < 6) {
            setError('Password needs at least 6 characters 🔐')
            return
        }

        setLoading(true)
        // Pass 'admin' as the role
        const { error: signUpError } = await signUp(email, password, fullName, 'admin')

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
        } else {
            setSuccess(true)
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 safe-area flex flex-col items-center justify-center px-4 py-8">
            <Link href="/login/admin" className="absolute top-6 left-6 z-20">
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl text-white"
                >
                    ←
                </motion.div>
            </Link>

            {success ? (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="text-center"
                >
                    <div className="text-7xl mb-6">🎉</div>
                    <h1 className="text-3xl font-black text-white mb-3">Welcome Admin!</h1>
                    <p className="text-gray-400 mb-8 max-w-sm">
                        Check your email to confirm your admin account, then come back to sign in! 📧
                    </p>
                    <Link href="/login/admin">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-petal-purple to-petal-pink text-white font-bold text-lg shadow-lg"
                        >
                            Go to Admin Login →
                        </motion.button>
                    </Link>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-petal-purple to-petal-pink shadow-xl flex items-center justify-center text-4xl mb-6"
                    >
                        🛡️
                    </motion.div>

                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl font-black text-white mb-2"
                    >
                        Admin Registration
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 mb-8"
                    >
                        Create an admin account to manage content
                    </motion.p>

                    <motion.form
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm space-y-4"
                    >
                        {error && (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl p-4 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">👤 Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full px-5 py-4 rounded-2xl border-2 border-white/10 focus:border-petal-purple focus:outline-none text-lg bg-white/5 text-white placeholder-gray-500"
                                placeholder="Admin Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">📧 Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-5 py-4 rounded-2xl border-2 border-white/10 focus:border-petal-purple focus:outline-none text-lg bg-white/5 text-white placeholder-gray-500"
                                placeholder="admin@petalpath.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">🔒 Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-5 py-4 rounded-2xl border-2 border-white/10 focus:border-petal-purple focus:outline-none text-lg bg-white/5 text-white placeholder-gray-500"
                                placeholder="At least 6 characters"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">🔒 Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-5 py-4 rounded-2xl border-2 border-white/10 focus:border-petal-purple focus:outline-none text-lg bg-white/5 text-white placeholder-gray-500"
                                placeholder="Type password again"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-petal-purple to-petal-pink text-white font-bold text-lg shadow-lg shadow-petal-purple/30 disabled:opacity-60"
                        >
                            {loading ? '⏳ Creating...' : '🚀 Create Admin Account'}
                        </motion.button>
                    </motion.form>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 text-gray-500"
                    >
                        Already an admin?{' '}
                        <Link href="/login/admin" className="font-bold text-petal-pink hover:underline">
                            Sign In
                        </Link>
                    </motion.p>
                </>
            )}
        </main>
    )
}
