'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
    { href: '/admin', icon: '📊', label: 'Dashboard' },
    { href: '/admin/upload', icon: '📤', label: 'Upload' },
    { href: '/admin/content', icon: '📚', label: 'Content' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut, profile } = useAuth()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
            {/* Top navbar */}
            <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 h-16 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex items-center justify-between h-full">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🌸</span>
                            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-petal-purple to-petal-pink">
                                PetalPath Admin
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400 hidden sm:block">{profile?.email}</span>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => signOut()}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                Sign Out
                            </motion.button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex flex-1 relative">
                {/* Sidebar */}
                <aside className="hidden md:flex w-64 flex-col fixed left-0 top-16 bottom-0 bg-slate-900/50 border-r border-white/5 p-4 z-20">
                    <div className="flex flex-col gap-2">
                        {NAV_ITEMS.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${pathname === item.href
                                        ? 'bg-gradient-to-r from-petal-purple/20 to-petal-pink/20 text-white border border-petal-purple/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    {item.label}
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </aside>

                {/* Mobile bottom nav */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 safe-area">
                    <div className="flex justify-around py-3">
                        {NAV_ITEMS.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <div className={`flex flex-col items-center gap-1 ${pathname === item.href ? 'text-petal-purple' : 'text-gray-500'
                                    }`}>
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="text-xs font-semibold">{item.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Main content */}
                <main className="flex-1 w-full md:pl-64 p-6 pb-24 md:pb-6 relative z-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
