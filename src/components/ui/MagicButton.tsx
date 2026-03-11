'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface MagicButtonProps {
    children: ReactNode
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    className?: string
    onClick?: () => void
    href?: string
}

export default function MagicButton({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    onClick,
    href,
}: MagicButtonProps) {
    const router = useRouter()

    const sizeClasses = {
        sm: 'px-6 py-3 text-sm rounded-xl',
        md: 'px-8 py-4 text-base rounded-2xl',
        lg: 'px-10 py-5 text-lg rounded-2xl',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: 'linear-gradient(135deg, #FDA4AF, #C4B5FD, #7DD3FC)',
            color: 'white',
            boxShadow: '0 10px 30px rgba(196, 181, 253, 0.25)',
        },
        secondary: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            color: '#334155',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        },
        ghost: {
            background: 'transparent',
            color: '#475569',
        },
    }

    const handleClick = () => {
        if (onClick) onClick()
        if (href) router.push(href)
    }

    return (
        <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={handleClick}
            style={variantStyles[variant]}
            className={`relative overflow-hidden cursor-pointer font-bold transition-shadow duration-300 ${sizeClasses[size]} ${className}`}
        >
            {variant === 'primary' && (
                <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                />
            )}
            <span className="relative z-10">{children}</span>
        </motion.button>
    )
}
