'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SpeechConfig, SpeechResult, SpeechAttempt } from '@/lib/activity-types'
import { evaluateAttempt, computeSpeechResult } from '@/lib/speech-evaluator'

// Ensure SpeechRecognition types are available
declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

interface SpeakingActivityProps {
    config: SpeechConfig
    onComplete: (result: SpeechResult) => void
}

const ROUND_EMOJIS = ['🌟', '⭐', '✨', '💫', '🌈']
const ENCOURAGEMENTS = [
    'Great sound! 🎵',
    'Beautiful! 🌸',
    'Wonderful! ✨',
    'You got it! 💪',
    'Amazing! 🌟',
]
const RETRY_ENCOURAGEMENTS = [
    'Let\'s try once more!',
    'You can do it! 🌻',
    'One more time! 💛',
    'Almost! Try again! 🌸',
]

export default function SpeakingActivity({ config, onComplete }: SpeakingActivityProps) {
    const [currentRound, setCurrentRound] = useState(0)
    const [attempts, setAttempts] = useState<SpeechAttempt[]>([])
    const [isListening, setIsListening] = useState(false)
    const [roundFeedback, setRoundFeedback] = useState<'success' | 'retry' | null>(null)
    const [transcript, setTranscript] = useState('')
    const [isComplete, setIsComplete] = useState(false)

    const recognitionRef = useRef<any>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const inactivityRef = useRef<NodeJS.Timeout | null>(null)
    const lastActivityRef = useRef(Date.now())

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window === 'undefined') return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.continuous = false
            recognition.interimResults = true
            recognition.lang = 'en-US'
            recognition.maxAlternatives = 3

            recognition.onresult = (event: any) => {
                lastActivityRef.current = Date.now()
                let best = ''
                for (let i = 0; i < event.results.length; i++) {
                    best += event.results[i][0].transcript
                }
                setTranscript(best)
            }

            recognition.onerror = (event: any) => {
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    console.warn('Speech recognition error:', event.error)
                }
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }

        return () => {
            recognitionRef.current?.stop()
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (inactivityRef.current) clearTimeout(inactivityRef.current)
        }
    }, [])

    // Start listening for a round
    const startRound = useCallback(() => {
        setIsListening(true)
        setTranscript('')
        setRoundFeedback(null)
        lastActivityRef.current = Date.now()

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start()
            } catch { /* already started */ }
        }

        // Auto-stop after 8 seconds
        timeoutRef.current = setTimeout(() => {
            finishRound()
        }, 8000)

        // Inactivity timeout: 15 seconds
        inactivityRef.current = setTimeout(() => {
            // If still no transcript after 15s, auto-advance
            finishRound()
        }, 15000)
    }, [])

    // Finish a round and evaluate
    const finishRound = useCallback(() => {
        if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch { /* ok */ }
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (inactivityRef.current) clearTimeout(inactivityRef.current)
        setIsListening(false)
    }, [])

    // Process transcript when listening stops
    useEffect(() => {
        if (isListening || isComplete) return
        if (currentRound >= config.repetitions) return

        // Only process if we had a round in progress
        const currentTranscript = transcript
        if (currentRound === 0 && attempts.length === 0 && !currentTranscript) return

        const attempt = evaluateAttempt(currentTranscript || '', config, currentRound + 1)
        const newAttempts = [...attempts, attempt]
        setAttempts(newAttempts)

        // Show feedback
        if (attempt.score === 1) {
            setRoundFeedback('success')
        } else {
            setRoundFeedback('retry')
        }

        // Advance after feedback animation
        setTimeout(() => {
            const nextRound = currentRound + 1
            if (nextRound >= config.repetitions) {
                // All rounds done
                const result = computeSpeechResult(newAttempts, config.repetitions)
                setIsComplete(true)
                setTimeout(() => onComplete(result), 1500)
            } else {
                setCurrentRound(nextRound)
                setRoundFeedback(null)
                setTranscript('')
            }
        }, 1500)
    }, [isListening])

    // Auto-start first round
    useEffect(() => {
        if (!isComplete && currentRound === 0 && attempts.length === 0) {
            const timer = setTimeout(startRound, 1200)
            return () => clearTimeout(timer)
        }
    }, [])

    // Auto-start next rounds
    useEffect(() => {
        if (currentRound > 0 && !isComplete && !isListening && roundFeedback === null) {
            const timer = setTimeout(startRound, 800)
            return () => clearTimeout(timer)
        }
    }, [currentRound, roundFeedback])

    const correctCount = attempts.filter(a => a.score === 1).length

    // ─── Completion State ───
    if (isComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-5 p-8"
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.8 }}
                    className="text-7xl"
                >
                    {correctCount >= 3 ? '🌟' : '🌸'}
                </motion.div>
                <div className="flex gap-2">
                    {Array.from({ length: config.repetitions }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.15 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md ${
                                i < correctCount
                                    ? 'bg-gradient-to-br from-yellow-300 to-amber-400'
                                    : 'bg-gray-100'
                            }`}
                        >
                            {i < correctCount ? '⭐' : '○'}
                        </motion.div>
                    ))}
                </div>
                <p className="text-xl font-bold text-slate-700">
                    {correctCount >= 3 ? 'Great speaking! 🎵' : 'Good try! 🌸'}
                </p>
            </motion.div>
        )
    }

    // ─── Active State ───
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-5 p-6"
        >
            {/* Topic display */}
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-7xl font-black text-slate-800 drop-shadow-lg"
                style={{
                    background: 'linear-gradient(135deg, #F472B6, #8B5CF6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '5rem',
                }}
            >
                {config.topic.toUpperCase()}
            </motion.div>

            {/* Prompt */}
            <p className="text-xl font-bold text-slate-600 text-center">{config.prompt}</p>

            {/* Star progress */}
            <div className="flex gap-2.5 mb-2">
                {Array.from({ length: config.repetitions }).map((_, i) => (
                    <motion.div
                        key={i}
                        animate={i === currentRound ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-sm transition-all duration-300 ${
                            i < attempts.length
                                ? attempts[i]?.score === 1
                                    ? 'bg-gradient-to-br from-yellow-300 to-amber-400 shadow-amber-200'
                                    : 'bg-gray-100 border border-gray-200'
                                : i === currentRound
                                    ? 'bg-white border-2 border-pink-400 shadow-pink-200/50 shadow-md'
                                    : 'bg-gray-50 border border-gray-200'
                        }`}
                    >
                        {i < attempts.length ? (
                            attempts[i]?.score === 1 ? '⭐' : '·'
                        ) : i === currentRound ? (
                            <span className="text-xl">🎤</span>
                        ) : (
                            <span className="text-gray-300">{i + 1}</span>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Round counter */}
            <p className="text-sm font-semibold text-slate-400">
                Round {currentRound + 1} of {config.repetitions}
            </p>

            {/* Microphone button */}
            <AnimatePresence mode="wait">
                {roundFeedback ? (
                    <motion.div
                        key="feedback"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl ${
                            roundFeedback === 'success'
                                ? 'bg-gradient-to-br from-emerald-300 to-green-400'
                                : 'bg-gradient-to-br from-amber-200 to-yellow-300'
                        }`}>
                            {roundFeedback === 'success' ? '✅' : '🔄'}
                        </div>
                        <p className="text-base font-bold text-slate-600">
                            {roundFeedback === 'success'
                                ? ENCOURAGEMENTS[currentRound % ENCOURAGEMENTS.length]
                                : RETRY_ENCOURAGEMENTS[currentRound % RETRY_ENCOURAGEMENTS.length]
                            }
                        </p>
                    </motion.div>
                ) : (
                    <motion.button
                        key="mic"
                        onPointerDown={!isListening ? startRound : undefined}
                        onPointerUp={isListening ? finishRound : undefined}
                        onPointerLeave={isListening ? finishRound : undefined}
                        className={`relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-xl transition-colors cursor-pointer ${
                            isListening
                                ? 'bg-gradient-to-br from-rose-400 to-red-500'
                                : 'bg-gradient-to-br from-pink-400 to-purple-500'
                        }`}
                        whileTap={{ scale: 0.95 }}
                        animate={isListening ? { scale: [1, 1.06, 1] } : {}}
                        transition={isListening ? { repeat: Infinity, duration: 0.6 } : {}}
                    >
                        {/* Pulse rings while listening */}
                        {isListening && (
                            <>
                                {[1, 2, 3].map(ring => (
                                    <motion.div
                                        key={ring}
                                        className="absolute inset-0 rounded-full border-3 border-rose-400"
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.4 + ring * 0.25, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 1.5, delay: ring * 0.3 }}
                                    />
                                ))}
                            </>
                        )}
                        <span className="relative z-10">{isListening ? '👂' : '🎤'}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Live transcript */}
            <div className="h-10 flex items-center justify-center">
                {isListening && transcript ? (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-semibold text-purple-500 animate-pulse"
                    >
                        &quot;{transcript}&quot;
                    </motion.p>
                ) : isListening ? (
                    <p className="text-sm text-slate-400 font-medium">Listening... 👂</p>
                ) : null}
            </div>

            {/* Instruction */}
            <p className="text-sm text-slate-400 text-center">
                {isListening ? 'Release when done!' : 'Hold to speak! 🎙️'}
            </p>
        </motion.div>
    )
}
