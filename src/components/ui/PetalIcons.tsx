'use client'

import React from 'react'

// ─── Base props ───
interface IconProps {
    size?: number
    className?: string
    color?: string
}

// ─── Flower / Mascot ───
export function PetalFlower({ size = 48, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
            <circle cx="32" cy="32" r="8" fill="#FFD6E0" />
            <circle cx="32" cy="32" r="5" fill="#FF8FAB" />
            {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse
                    key={angle}
                    cx="32"
                    cy="16"
                    rx="10"
                    ry="14"
                    fill="#FF8FAB"
                    opacity={0.85}
                    transform={`rotate(${angle} 32 32)`}
                />
            ))}
            {[36, 108, 180, 252, 324].map((angle) => (
                <ellipse
                    key={angle}
                    cx="32"
                    cy="18"
                    rx="8"
                    ry="11"
                    fill="#FFB3C6"
                    opacity={0.6}
                    transform={`rotate(${angle} 32 32)`}
                />
            ))}
        </svg>
    )
}

// ─── Star ───
export function StarIcon({ size = 32, className = '', color = '#FACC15' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <path
                d="M16 2L19.7 11.2L29.6 12.1L22 18.8L24.1 28.5L16 23.6L7.9 28.5L10 18.8L2.4 12.1L12.3 11.2L16 2Z"
                fill={color}
            />
            <path
                d="M16 6L18.5 12.6L25.6 13.2L20.2 17.8L21.8 24.7L16 21.2L10.2 24.7L11.8 17.8L6.4 13.2L13.5 12.6L16 6Z"
                fill="#FDE68A"
                opacity={0.6}
            />
        </svg>
    )
}

// ─── Camera ───
export function CameraIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <rect x="3" y="10" width="26" height="18" rx="4" fill="#2DD4BF" />
            <rect x="4" y="11" width="24" height="16" rx="3" fill="#5EEAD4" opacity={0.5} />
            <path d="M11 6H21L23 10H9L11 6Z" fill="#14B8A6" />
            <circle cx="16" cy="19" r="5" fill="#0D9488" />
            <circle cx="16" cy="19" r="3" fill="#99F6E4" />
            <circle cx="16" cy="19" r="1.5" fill="#0D9488" />
            <circle cx="24" cy="14" r="1.5" fill="#99F6E4" />
        </svg>
    )
}

// ─── Microphone ───
export function MicIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <rect x="12" y="4" width="8" height="16" rx="4" fill="#F472B6" />
            <rect x="13" y="5" width="6" height="14" rx="3" fill="#FBCFE8" opacity={0.5} />
            <path d="M8 16C8 20.4 11.6 24 16 24C20.4 24 24 20.4 24 16" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="24" x2="16" y2="28" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="28" x2="20" y2="28" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    )
}

// ─── Video / Play ───
export function VideoIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <rect x="2" y="6" width="28" height="20" rx="4" fill="#60A5FA" />
            <rect x="3" y="7" width="26" height="18" rx="3" fill="#93C5FD" opacity={0.4} />
            <path d="M13 11L22 16L13 21V11Z" fill="white" />
            <circle cx="6" cy="10" r="1.5" fill="#EF4444" />
        </svg>
    )
}

// ─── Running / Movement ───
export function RunIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <circle cx="20" cy="6" r="3" fill="#F59E0B" />
            <path d="M14 12L18 10L22 14L19 18L22 24" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 10L14 14L10 16" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 18L24 20" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 14L12 22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            {/* Motion lines */}
            <line x1="7" y1="10" x2="10" y2="10" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="14" x2="9" y2="14" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="18" x2="9" y2="18" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

// ─── Trophy ───
export function TrophyIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <path d="M10 4H22V14C22 17.3 19.3 20 16 20C12.7 20 10 17.3 10 14V4Z" fill="#FACC15" />
            <path d="M11 5H21V14C21 16.8 18.8 19 16 19C13.2 19 11 16.8 11 14V5Z" fill="#FDE68A" opacity={0.5} />
            <path d="M10 6H6C6 6 5 12 10 12" stroke="#F59E0B" strokeWidth="2" fill="none" />
            <path d="M22 6H26C26 6 27 12 22 12" stroke="#F59E0B" strokeWidth="2" fill="none" />
            <rect x="13" y="20" width="6" height="4" fill="#F59E0B" />
            <rect x="10" y="24" width="12" height="3" rx="1" fill="#F59E0B" />
            <line x1="16" y1="8" x2="16" y2="14" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="13" y1="11" x2="19" y2="11" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

// ─── Shield (Admin) ───
export function ShieldIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <path d="M16 3L4 8V16C4 22.6 9.2 28.6 16 30C22.8 28.6 28 22.6 28 16V8L16 3Z" fill="#A78BFA" />
            <path d="M16 5L6 9.5V16C6 21.8 10.4 27 16 28.4C21.6 27 26 21.8 26 16V9.5L16 5Z" fill="#C4B5FD" opacity={0.5} />
            <path d="M12 16L15 19L21 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ─── Family (Parent) ───
export function FamilyIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <circle cx="10" cy="8" r="4" fill="#34D399" />
            <circle cx="22" cy="8" r="4" fill="#60A5FA" />
            <circle cx="16" cy="18" r="3.5" fill="#F472B6" />
            <path d="M4 20C4 17.8 5.8 16 8 16H12C14.2 16 16 17.8 16 20V28H4V20Z" fill="#34D399" opacity={0.6} />
            <path d="M16 20C16 17.8 17.8 16 20 16H24C26.2 16 28 17.8 28 20V28H16V20Z" fill="#60A5FA" opacity={0.6} />
            <ellipse cx="16" cy="26" rx="5" ry="4" fill="#FBCFE8" opacity={0.5} />
        </svg>
    )
}

// ─── Child Face ───
export function ChildIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <circle cx="16" cy="17" r="12" fill="#FDE68A" />
            <circle cx="16" cy="17" r="11" fill="#FEF3C7" opacity={0.5} />
            <circle cx="12" cy="15" r="2" fill="#1E293B" />
            <circle cx="20" cy="15" r="2" fill="#1E293B" />
            <circle cx="12.5" cy="14.5" r="0.7" fill="white" />
            <circle cx="20.5" cy="14.5" r="0.7" fill="white" />
            <path d="M12 21C12 21 14 24 16 24C18 24 20 21 20 21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 8C8 8 10 4 16 4C22 4 24 8 24 8" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
    )
}

// ─── Sparkle ───
export function SparkleIcon({ size = 24, className = '', color = '#C4B5FD' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 2L13.5 9L20 7L14.5 12L20 17L13.5 15L12 22L10.5 15L4 17L9.5 12L4 7L10.5 9L12 2Z" fill={color} />
        </svg>
    )
}

// ─── Rainbow ───
export function RainbowIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <path d="M4 24C4 15.2 11.2 8 20 8" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M7 24C7 16.8 12.8 11 20 11" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M10 24C10 18.5 14.5 14 20 14" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M13 24C13 20.1 16.1 17 20 17" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M16 24C16 21.8 17.8 20 20 20" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
    )
}

// ─── Butterfly ───
export function ButterflyIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <ellipse cx="11" cy="12" rx="8" ry="9" fill="#C4B5FD" opacity={0.8} />
            <ellipse cx="21" cy="12" rx="8" ry="9" fill="#93C5FD" opacity={0.8} />
            <ellipse cx="11" cy="20" rx="6" ry="7" fill="#FBCFE8" opacity={0.7} />
            <ellipse cx="21" cy="20" rx="6" ry="7" fill="#A5F3FC" opacity={0.7} />
            <line x1="16" y1="6" x2="16" y2="28" stroke="#64748B" strokeWidth="1.5" />
            <line x1="16" y1="6" x2="12" y2="2" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />
            <line x1="16" y1="6" x2="20" y2="2" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />
            <circle cx="12" cy="2" r="1" fill="#C4B5FD" />
            <circle cx="20" cy="2" r="1" fill="#93C5FD" />
        </svg>
    )
}

// ─── Chart / Progress ───
export function ChartIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <rect x="4" y="4" width="24" height="24" rx="4" fill="#E0F2FE" />
            <rect x="7" y="18" width="4" height="8" rx="1" fill="#60A5FA" />
            <rect x="14" y="12" width="4" height="14" rx="1" fill="#3B82F6" />
            <rect x="21" y="8" width="4" height="18" rx="1" fill="#2563EB" />
            <path d="M7 14L14 10L21 6" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
    )
}

// ─── Explore / Compass ───
export function ExploreIcon({ size = 32, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
            <circle cx="16" cy="16" r="13" fill="#E9D5FF" />
            <circle cx="16" cy="16" r="11" fill="#F3E8FF" opacity={0.6} />
            <path d="M20 10L22 20L14 18L12 12L20 10Z" fill="#A855F7" />
            <path d="M14 18L12 12L20 10" fill="#C084FC" opacity={0.6} />
            <circle cx="16" cy="16" r="2" fill="white" />
        </svg>
    )
}

// ─── Arrow Back ───
export function ArrowBackIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ─── Scroll Down Arrow ───
export function ScrollDownIcon({ size = 24, className = '' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <path d="M12 4V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 13L12 18L17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ─── Confetti Piece ───
export function ConfettiIcon({ size = 16, className = '', color = '#FDA4AF' }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
            <rect x="3" y="3" width="10" height="10" rx="2" fill={color} transform="rotate(15 8 8)" />
        </svg>
    )
}
