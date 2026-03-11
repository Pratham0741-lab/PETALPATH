'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SpeakingActivityProps {
    prompt?: string
    onComplete?: () => void
}

// Ensure SpeechRecognition types are available
declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

export default function SpeakingActivity({ prompt = 'Say something!', onComplete }: SpeakingActivityProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [listeningError, setListeningError] = useState('')
    const recognitionRef = useRef<any>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Initialize Speech Recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US'

                recognition.onresult = (event: any) => {
                    let currentTranscript = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript
                    }
                    setTranscript(currentTranscript)
                }

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error)
                    if (event.error !== 'no-speech') {
                        setListeningError('Could not hear clearly. Try again!')
                    }
                }

                recognition.onend = () => {
                    // Automatically restart if we are still supposed to be recording
                    if (isRecording) {
                        try {
                            recognition.start()
                        } catch (e) {
                            // ignore already started errors
                        }
                    }
                }

                recognitionRef.current = recognition
            } else {
                setListeningError('Speech recognition not supported in this browser.')
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [isRecording])

    const startRecording = () => {
        setIsRecording(true)
        setTranscript('')
        setListeningError('')

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start()
            } catch (e) {
                // Ignore if already started
            }
        } else {
            // Fallback if not supported
            setListeningError("Simulating speech (Mic unavailable)...")
        }

        // Auto-stop after 10 seconds or 3 seconds if fallback
        timerRef.current = setTimeout(() => {
            stopRecording()
        }, recognitionRef.current ? 10000 : 3000)
    }

    const stopRecording = () => {
        setIsRecording(false)
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        if (timerRef.current) clearTimeout(timerRef.current)

        if (!recognitionRef.current) {
            // Fallback success
            setTranscript("I am learning so much!")
            setIsComplete(true)
            setTimeout(() => {
                onComplete?.()
            }, 2500)
            return
        }

        // Only complete if they actually said something
        if (transcript.trim().length > 0) {
            setIsComplete(true)
            setTimeout(() => {
                onComplete?.()
            }, 2500)
        } else {
            setListeningError("I didn't catch that. Tap and hold to speak!")
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-6 p-8"
        >
            {/* Prompt */}
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-2"
            >
                🗣️
            </motion.div>

            <p className="text-xl font-bold text-gray-700 text-center">{prompt}</p>

            {/* Live Transcript Display */}
            <div className="h-16 flex items-center justify-center w-full max-w-sm px-4">
                {transcript ? (
                    <p className="text-lg font-medium text-petal-purple text-center animate-pulse">
                        "{transcript}"
                    </p>
                ) : listeningError ? (
                    <p className="text-sm font-medium text-red-400 text-center">
                        {listeningError}
                    </p>
                ) : null}
            </div>

            {/* Microphone button */}
            <AnimatePresence mode="wait">
                {isComplete ? (
                    <motion.div
                        key="complete"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <div className="w-28 h-28 rounded-full bg-petal-green flex items-center justify-center text-5xl shadow-xl">
                            ⭐
                        </div>
                        <p className="text-lg font-bold text-petal-green">Great job speaking!</p>
                    </motion.div>
                ) : (
                    <motion.button
                        key="mic"
                        onPointerDown={startRecording}
                        onPointerUp={stopRecording}
                        onPointerLeave={() => isRecording && stopRecording()}
                        className={`relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-xl transition-colors ${isRecording
                            ? 'bg-petal-red'
                            : 'bg-gradient-to-br from-petal-pink to-petal-purple'
                            }`}
                        whileTap={{ scale: 0.95 }}
                        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                        transition={isRecording ? { repeat: Infinity, duration: 0.5 } : {}}
                    >
                        {/* Sound waves when recording */}
                        {isRecording && (
                            <>
                                {[1, 2, 3].map((ring) => (
                                    <motion.div
                                        key={ring}
                                        className="absolute inset-0 rounded-full border-4 border-petal-red"
                                        initial={{ scale: 1, opacity: 0.6 }}
                                        animate={{ scale: 1.5 + ring * 0.3, opacity: 0 }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            delay: ring * 0.3,
                                        }}
                                    />
                                ))}
                            </>
                        )}
                        <span className="relative z-10">{isRecording ? '⏹️' : '🎤'}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            <p className="text-sm text-gray-400 text-center">
                {isRecording ? 'Listening... 👂' : isComplete ? '' : 'Hold to talk! 🎙️'}
            </p>
        </motion.div>
    )
}
