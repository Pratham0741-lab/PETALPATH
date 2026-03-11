'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowBackIcon, StarIcon, ExploreIcon, SparkleIcon, ButterflyIcon, PetalFlower } from '@/components/ui/PetalIcons'

// Simple map regions instead of a video list
const MAP_LOCATIONS = [
    { id: '1', title: 'Number Forest', x: 20, y: 30, color: '#34D399', icon: '1️⃣', unlocked: true },
    { id: '2', title: 'Alphabet Mountain', x: 70, y: 20, color: '#60A5FA', icon: 'A', unlocked: true },
    { id: '3', title: 'Shape Cave', x: 80, y: 70, color: '#F472B6', icon: '🟡', unlocked: false },
    { id: '4', title: 'Color River', x: 30, y: 80, color: '#FCD34D', icon: '🎨', unlocked: false },
]

export default function DiscoveryMapPage() {
    const router = useRouter()
    const [selectedLoc, setSelectedLoc] = useState<typeof MAP_LOCATIONS[0] | null>(null)

    return (
        <main className="min-h-screen safe-area relative overflow-hidden bg-sky-100" style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 50%, #F3E8FF 100%)' }}>
            
            {/* Top bar */}
            <div className="relative z-30 flex items-center justify-between p-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/child')}
                    className="h-14 px-5 rounded-2xl bg-white/90 backdrop-blur-xl flex items-center gap-3 shadow-lg border border-white/50 cursor-pointer text-slate-600 font-bold hover:bg-white"
                >
                    <ArrowBackIcon size={24} color="#64748B" />
                    <span className="hidden sm:block">Back to Dashboard</span>
                </motion.button>

                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-lg border border-white/50">
                    <ExploreIcon size={24} color="#8B5CF6" />
                    <span className="font-black text-slate-700 text-xl hidden sm:block">Explore Map</span>
                </div>
            </div>

            {/* The Map Layout */}
            <div className="absolute inset-0 z-10 pt-24 pb-12 px-6 flex justify-center items-center">
                <div className="relative w-full max-w-5xl aspect-video max-h-[70vh] bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden mt-8">
                    
                    {/* Decorative map elements */}
                    <div className="absolute top-10 left-10 opacity-50"><PetalFlower size={64} /></div>
                    <div className="absolute bottom-10 right-10 opacity-50"><ButterflyIcon size={48} color="#A78BFA" /></div>
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 200 300 Q 400 100, 700 200 T 800 700" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="10 10" />
                    </svg>

                    {MAP_LOCATIONS.map((loc, i) => (
                        <motion.button
                            key={loc.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                            whileHover={{ scale: 1.1, zIndex: 20 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedLoc(loc)}
                            className="absolute flex flex-col items-center justify-center cursor-pointer group"
                            style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <div 
                                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl border-4 ${loc.unlocked ? 'border-white' : 'border-white/50 opacity-60'}`}
                                style={{ background: loc.color }}
                            >
                                <span className="text-3xl sm:text-4xl drop-shadow-md">{loc.icon}</span>
                            </div>
                            <div className="mt-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md border border-white font-bold text-slate-700 text-sm sm:text-base whitespace-nowrap">
                                {loc.title}
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Location Detail Modal */}
            <AnimatePresence>
                {selectedLoc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedLoc(null)}
                        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 grid gap-6 text-center relative overflow-hidden"
                            style={{ borderColor: selectedLoc.color }}
                        >
                            <div className="absolute top-0 inset-x-0 h-24 opacity-20" style={{ background: `linear-gradient(to bottom, ${selectedLoc.color}, transparent)` }} />
                            
                            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl shadow-lg relative z-10" style={{ background: selectedLoc.color }}>
                                {selectedLoc.icon}
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 relative z-10">{selectedLoc.title}</h2>
                            
                            {selectedLoc.unlocked ? (
                                <p className="text-slate-600 font-medium relative z-10">Are you ready to explore the {selectedLoc.title}? Lots of fun activities waiting inside!</p>
                            ) : (
                                <p className="text-slate-500 font-medium relative z-10">This area is locked! Earn more stars to unlock it.</p>
                            )}

                            <div className="flex gap-4 relative z-10">
                                <button 
                                    onClick={() => setSelectedLoc(null)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                    Close
                                </button>
                                {selectedLoc.unlocked && (
                                    <button 
                                        onClick={() => router.push(`/child/session?focus=physical`)}
                                        className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
                                        style={{ background: selectedLoc.color }}
                                    >
                                        Let's Go!
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
