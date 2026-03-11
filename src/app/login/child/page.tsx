'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { PetalFlower, ChildIcon, StarIcon, SparkleIcon, ArrowBackIcon } from '@/components/ui/PetalIcons'

const CHILD_AVATARS = ['🧒', '👦', '👧', '🧒🏽', '👦🏻', '👧🏾', '🦸', '🧚', '🦄', '🐻', '🐰', '🐱']

interface ChildProfile {
    id: string
    name: string
    avatar: string
    pin_code: string
}

export default function ChildLoginPage() {
    const [step, setStep] = useState<'email' | 'select' | 'pin'>('email')
    const [parentEmail, setParentEmail] = useState('')
    const [parentPassword, setParentPassword] = useState('')
    const [children, setChildren] = useState<ChildProfile[]>([])
    const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null)
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleParentAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(''); setLoading(true)
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: parentEmail, password: parentPassword })
        if (signInError) { setError('Could not find account. Ask a parent for help!'); setLoading(false); return }
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: childrenData } = await supabase.from('children').select('id, name, avatar, pin_code').eq('parent_id', user.id)
            if (childrenData && childrenData.length > 0) { setChildren(childrenData); setStep('select') }
            else { setError('No child profiles found. Ask a parent to add you!') }
        }
        setLoading(false)
    }

    const handleChildSelect = (child: ChildProfile) => { setSelectedChild(child); setStep('pin'); setPin('') }

    const handlePinSubmit = () => {
        if (selectedChild && pin === selectedChild.pin_code) {
            sessionStorage.setItem('activeChildId', selectedChild.id)
            sessionStorage.setItem('activeChildName', selectedChild.name)
            sessionStorage.setItem('activeChildAvatar', selectedChild.avatar)
            router.push('/child')
        } else { setError('Oops! Wrong code. Try again!'); setPin('') }
    }

    useEffect(() => { if (pin.length === 4) handlePinSubmit() }, [pin])

    return (
        <main className="min-h-screen safe-area flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #EFF6FF, #EDE9FE, #FCE7F3)' }}>
            {/* Floating decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[{ color: '#C4B5FD', x: 10, y: 15 }, { color: '#7DD3FC', x: 80, y: 20 }, { color: '#FDA4AF', x: 50, y: 75 }].map((d, i) => (
                    <motion.div key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%` }}
                        animate={{ y: [0, -12, 0], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}>
                        <SparkleIcon size={16} color={d.color} />
                    </motion.div>
                ))}
            </div>

            {/* Back button */}
            <motion.button onClick={() => router.push('/login')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="absolute top-6 left-6 z-20 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer">
                <ArrowBackIcon size={20} />
            </motion.button>

            {step !== 'email' && (
                <motion.button onClick={() => setStep(step === 'pin' ? 'select' : 'email')}
                    className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center cursor-pointer"
                    whileTap={{ scale: 0.9 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 4L6 10L12 16" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </motion.button>
            )}

            {/* Mascot */}
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                className="w-24 h-24 rounded-full shadow-xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, #60A5FA, #22D3EE)' }}>
                <ChildIcon size={48} />
            </motion.div>

            <AnimatePresence mode="wait">
                {step === 'email' && (
                    <motion.div key="email" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="w-full max-w-sm text-center relative z-10">
                        <h1 className="text-3xl font-black text-gray-800 mb-2">Hi there!</h1>
                        <p className="text-gray-500 mb-8">Ask a parent to help you sign in</p>
                        <form onSubmit={handleParentAuth} className="space-y-4">
                            {error && <div className="rounded-2xl p-4 text-sm text-center" style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', color: '#92400E' }}>{error}</div>}
                            <div className="relative">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2"><rect x="2" y="4" width="14" height="10" rx="2" stroke="#94A3B8" strokeWidth="1.5" /><path d="M2 6L9 10L16 6" stroke="#94A3B8" strokeWidth="1.5" /></svg>
                                <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required
                                    className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none text-lg bg-white transition-all"
                                    placeholder="Parent's email" onFocus={(e) => e.target.style.borderColor = '#60A5FA'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
                            </div>
                            <div className="relative">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2"><rect x="4" y="7" width="10" height="9" rx="2" stroke="#94A3B8" strokeWidth="1.5" /><path d="M6 7V5C6 3.3 7.3 2 9 2C10.7 2 12 3.3 12 5V7" stroke="#94A3B8" strokeWidth="1.5" /></svg>
                                <input type="password" value={parentPassword} onChange={(e) => setParentPassword(e.target.value)} required
                                    className="w-full pl-11 pr-5 py-4 rounded-2xl border-2 border-gray-200 focus:outline-none text-lg bg-white transition-all"
                                    placeholder="Parent's password" onFocus={(e) => e.target.style.borderColor = '#60A5FA'} onBlur={(e) => e.target.style.borderColor = '#E5E7EB'} />
                            </div>
                            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg disabled:opacity-60 cursor-pointer relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #60A5FA, #22D3EE)', boxShadow: '0 8px 25px rgba(96,165,250,0.3)' }}>
                                <div className="absolute inset-0 animate-shimmer pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', backgroundSize: '200% 100%' }} />
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <><svg width="18" height="18" className="animate-spin" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10" /></svg> Finding...</>
                                    ) : (
                                        <><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5" stroke="white" strokeWidth="1.5" /><path d="M12 12L16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg> Find My Profile</>
                                    )}
                                </span>
                            </motion.button>
                        </form>
                    </motion.div>
                )}

                {step === 'select' && (
                    <motion.div key="select" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="w-full max-w-sm text-center relative z-10">
                        <h1 className="text-3xl font-black text-gray-800 mb-2">Who&apos;s playing?</h1>
                        <p className="text-gray-500 mb-8">Tap your picture!</p>
                        <div className="grid grid-cols-2 gap-4">
                            {children.map((child, i) => (
                                <motion.button key={child.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1, type: 'spring' }}
                                    whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} onClick={() => handleChildSelect(child)}
                                    className="card-premium flex flex-col items-center gap-3 p-6 cursor-pointer card-glow">
                                    <span className="text-5xl">{child.avatar}</span>
                                    <span className="font-bold text-gray-700 text-lg">{child.name}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {step === 'pin' && selectedChild && (
                    <motion.div key="pin" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="w-full max-w-sm text-center relative z-10">
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl mb-4">
                            {selectedChild.avatar}
                        </motion.div>
                        <h1 className="text-2xl font-black text-gray-800 mb-2">Hi {selectedChild.name}!</h1>
                        <p className="text-gray-500 mb-8">Enter your secret code</p>

                        {error && (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                className="rounded-2xl p-3 text-sm mb-4" style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', color: '#92400E' }}>
                                {error}
                            </motion.div>
                        )}

                        <div className="flex justify-center gap-4 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <motion.div key={i} animate={pin.length > i ? { scale: [1, 1.2, 1] } : {}}
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                    style={pin.length > i
                                        ? { background: 'linear-gradient(135deg, #60A5FA, #3B82F6)', border: '2px solid #3B82F6' }
                                        : { background: 'white', border: '2px solid #E5E7EB' }}>
                                    {pin.length > i && <StarIcon size={22} />}
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num) => (
                                <motion.button key={num ?? 'empty'} whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        if (num === 'del') { setPin(pin.slice(0, -1)); setError('') }
                                        else if (num !== null && pin.length < 4) { setPin(pin + num.toString()); setError('') }
                                    }}
                                    disabled={num === null}
                                    className={`h-16 rounded-2xl text-2xl font-bold transition-colors cursor-pointer ${
                                        num === null ? 'invisible' : num === 'del' ? 'bg-gray-100 text-gray-600' : 'bg-white shadow-md text-gray-800'
                                    }`}>
                                    {num === 'del' ? (
                                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="mx-auto"><path d="M8 5L2 11L8 17H20V5H8Z" stroke="#64748B" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 9L16 13M16 9L12 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    ) : num}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
