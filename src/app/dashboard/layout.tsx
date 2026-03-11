'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PetalFlower, ChartIcon, ChildIcon } from '@/components/ui/PetalIcons'

const NAV_ITEMS = [
    { href: '/dashboard', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9L9 3L15 9V15C15 15.6 14.6 16 14 16H4C3.4 16 3 15.6 3 15V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>, label: 'Home' },
    { href: '/dashboard/progress', icon: <ChartIcon size={18} />, label: 'Progress' },
    { href: '/dashboard/children', icon: <ChildIcon size={18} />, label: 'Children' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut, profile } = useAuth()

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F9FAFB, #EFF6FF)' }}>
            {/* Top navbar */}
            <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
                            <PetalFlower size={28} />
                            <span className="text-lg font-bold" style={{ background: 'linear-gradient(90deg, #F472B6, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                PetalPath
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            {NAV_ITEMS.map((item) => (
                                <button key={item.href} onClick={() => router.push(item.href)}
                                    className="flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer"
                                    style={{ color: pathname === item.href ? '#F472B6' : '#94A3B8' }}>
                                    {item.icon} {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 hidden sm:inline">{profile?.full_name || profile?.email}</span>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => { await signOut(); router.push('/login') }}
                                className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                Sign Out
                            </motion.button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-area shadow-lg">
                <div className="flex justify-around py-3">
                    {NAV_ITEMS.map((item) => (
                        <button key={item.href} onClick={() => router.push(item.href)}
                            className="flex flex-col items-center gap-1 cursor-pointer"
                            style={{ color: pathname === item.href ? '#F472B6' : '#CBD5E1' }}>
                            {item.icon}
                            <span className="text-xs font-semibold">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
                {children}
            </main>
        </div>
    )
}
