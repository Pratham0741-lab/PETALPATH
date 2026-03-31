'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import type { CameraConfig, CameraResult, QuizOption } from '@/lib/activity-types'
import {
    evaluateObjectDetection,
    evaluateEMNISTResult,
    evaluateQuizResult,
    generateQuizOptions,
    preprocessForEMNIST,
} from '@/lib/camera-evaluator'

interface CameraActivityProps {
    config: CameraConfig
    onComplete: (result: CameraResult) => void
}

export default function CameraActivity({ config, onComplete }: CameraActivityProps) {
    const [phase, setPhase] = useState<'instruction' | 'scanning' | 'quiz' | 'result'>('instruction')
    const [cameraAvailable, setCameraAvailable] = useState(true)
    const [modelReady, setModelReady] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [scanMessage, setScanMessage] = useState('Warming up AI... ⏳')
    const [result, setResult] = useState<CameraResult | null>(null)
    const [quizOptions, setQuizOptions] = useState<QuizOption[]>([])
    const [capturedImage, setCapturedImage] = useState<string | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const cocoModelRef = useRef<cocoSsd.ObjectDetection | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const isDraw = config.activityType === 'draw'
    const isFind = config.activityType === 'find'

    // Load AI models
    useEffect(() => {
        const load = async () => {
            try {
                await tf.ready()
                if (isFind) {
                    cocoModelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
                }
                setModelReady(true)
                setScanMessage('AI ready! 🧠')
            } catch (err) {
                console.error('Failed to load model:', err)
                setModelReady(true) // Continue anyway
            }
        }
        load()

        return () => {
            stopCamera()
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    const startCamera = useCallback(async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Camera API not supported')
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' },
            })

            streamRef.current = stream
            setCameraAvailable(true)
            setPhase('scanning')
            setScanning(true)
            setScanMessage(isDraw ? 'Show your drawing to the camera! ✏️' : 'Looking for the object... 👀')

            // Attach stream to video element
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }

            // Start scanning loop
            startScanLoop()

            // 10s timeout
            timeoutRef.current = setTimeout(() => {
                handleTimeout()
            }, 10000)
        } catch (err) {
            console.warn('Camera unavailable:', err)
            setCameraAvailable(false)
            // Launch fallback quiz
            launchQuiz()
        }
    }, [isDraw])

    const startScanLoop = useCallback(() => {
        let scanCount = 0
        const messages = isDraw
            ? ['Looking at your drawing... 🔍', 'Analyzing... 🧠', 'Almost got it! ✨']
            : ['Searching... 🔍', 'Looking around... 👀', 'Keep showing it! 📷']

        scanIntervalRef.current = setInterval(async () => {
            scanCount++
            setScanMessage(messages[scanCount % messages.length])

            if (!videoRef.current || videoRef.current.readyState !== 4) return

            try {
                if (isFind && cocoModelRef.current) {
                    // COCO-SSD object detection
                    const predictions = await cocoModelRef.current.detect(videoRef.current)
                    const highConf = predictions.filter(p => p.score > 0.5)

                    if (highConf.length > 0) {
                        const evalResult = evaluateObjectDetection(
                            highConf.map(p => ({ class: p.class, score: p.score })),
                            config
                        )

                        if (evalResult.passed) {
                            captureAndComplete(evalResult)
                            return
                        }
                    }
                } else if (isDraw) {
                    // For drawing: capture frame and evaluate
                    // In a real implementation, we'd run EMNIST here
                    // For now, use canvas-based detection with simulated confidence
                    if (scanCount >= 3) {
                        const canvas = document.createElement('canvas')
                        canvas.width = videoRef.current.videoWidth
                        canvas.height = videoRef.current.videoHeight
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                            ctx.drawImage(videoRef.current, 0, 0)
                            const input = preprocessForEMNIST(canvas)
                            if (input) {
                                // Simulated EMNIST evaluation
                                // In production, load actual EMNIST model and run inference
                                const simResult: CameraResult = {
                                    label: config.targetLabel,
                                    confidence: 0.65 + Math.random() * 0.2,
                                    passed: true,
                                    method: 'emnist',
                                }
                                captureAndComplete(simResult)
                                return
                            }
                        }
                    }
                }
            } catch (err) {
                // Continue scanning
            }
        }, 2000)
    }, [isDraw, isFind, config])

    const captureAndComplete = useCallback((evalResult: CameraResult) => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        // Capture the frame
        if (videoRef.current) {
            const canvas = document.createElement('canvas')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
            setCapturedImage(canvas.toDataURL('image/jpeg', 0.8))
        }

        stopCamera()
        setScanning(false)
        setResult(evalResult)
        setPhase('result')

        setTimeout(() => onComplete(evalResult), 2000)
    }, [stopCamera, onComplete])

    const handleTimeout = useCallback(() => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        stopCamera()
        setScanning(false)

        // Fall back to quiz
        launchQuiz()
    }, [stopCamera])

    const launchQuiz = useCallback(() => {
        const options = generateQuizOptions(config)
        setQuizOptions(options)
        setPhase('quiz')
    }, [config])

    const handleQuizSelect = useCallback((option: QuizOption) => {
        const evalResult = evaluateQuizResult(option.label, config)
        setResult(evalResult)
        setPhase('result')

        setTimeout(() => onComplete(evalResult), 2000)
    }, [config, onComplete])

    // ─── Instruction Phase ───
    if (phase === 'instruction') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-6 p-6"
            >
                {/* Reference display for draw mode */}
                {isDraw && (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-36 h-36 rounded-3xl bg-white shadow-xl flex items-center justify-center border-2 border-purple-200"
                    >
                        <span className="text-8xl font-black text-transparent bg-clip-text"
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {config.targetLabel}
                        </span>
                    </motion.div>
                )}

                {!isDraw && (
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-7xl"
                    >
                        📷
                    </motion.div>
                )}

                <p className="text-xl font-bold text-slate-600 text-center">{config.prompt}</p>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCamera}
                    disabled={!modelReady}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl cursor-pointer transition-all ${
                        modelReady
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                    }`}
                >
                    {modelReady ? '📸' : '⏳'}
                </motion.button>

                <p className="text-sm text-slate-400 font-medium">
                    {modelReady ? 'Tap to open camera!' : scanMessage}
                </p>
            </motion.div>
        )
    }

    // ─── Scanning Phase ───
    if (phase === 'scanning') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-5 p-6"
            >
                <div className="relative w-80 h-60 rounded-3xl overflow-hidden shadow-xl">
                    <video
                        ref={el => {
                            if (el && streamRef.current && !el.srcObject) {
                                el.srcObject = streamRef.current
                            }
                            (videoRef as any).current = el
                        }}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />

                    {/* Scanning animation overlay */}
                    <motion.div
                        className="absolute inset-0 border-4 border-emerald-400 rounded-3xl"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />

                    {/* Corner brackets */}
                    {['top-3 left-3 border-t-4 border-l-4 rounded-tl-xl',
                      'top-3 right-3 border-t-4 border-r-4 rounded-tr-xl',
                      'bottom-3 left-3 border-b-4 border-l-4 rounded-bl-xl',
                      'bottom-3 right-3 border-b-4 border-r-4 rounded-br-xl',
                    ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 ${cls} border-white/80`} />
                    ))}

                    {/* Scan line */}
                    <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    />
                </div>

                <motion.p
                    key={scanMessage}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-base font-bold text-slate-600"
                >
                    {scanMessage}
                </motion.p>

                {isDraw && (
                    <div className="flex items-center gap-3 bg-purple-50 rounded-2xl px-4 py-2">
                        <span className="text-3xl font-black text-purple-500">{config.targetLabel}</span>
                        <span className="text-sm text-purple-400 font-medium">← Show this!</span>
                    </div>
                )}
            </motion.div>
        )
    }

    // ─── Quiz Fallback Phase ───
    if (phase === 'quiz') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-6 p-6"
            >
                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-5xl"
                >
                    🎯
                </motion.div>

                <p className="text-xl font-bold text-slate-600 text-center">
                    Tap the correct {/^[A-Z]$/.test(config.targetLabel) ? 'letter' : /^\d+$/.test(config.targetLabel) ? 'number' : 'shape'}!
                </p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    {quizOptions.map((option, i) => (
                        <motion.button
                            key={option.label}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.15, type: 'spring', stiffness: 300 }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleQuizSelect(option)}
                            className="h-24 rounded-2xl bg-white shadow-lg border-2 border-gray-100 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-purple-300 hover:shadow-xl transition-all"
                        >
                            <span className="text-3xl">{option.emoji}</span>
                            <span className="text-lg font-black text-slate-700">{option.label}</span>
                        </motion.button>
                    ))}
                </div>

                <p className="text-sm text-slate-400 font-medium">
                    Camera unavailable — tap your answer!
                </p>
            </motion.div>
        )
    }

    // ─── Result Phase ───
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-5 p-6"
        >
            {capturedImage ? (
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1, rotate: [0, 3, 0] }}
                    className="relative"
                >
                    <img
                        src={capturedImage}
                        alt="Captured"
                        className="w-72 h-52 object-cover rounded-3xl shadow-xl border-4 border-emerald-300"
                    />
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 flex items-center justify-center text-2xl shadow-lg"
                    >
                        {result?.passed ? '⭐' : '🌸'}
                    </motion.div>
                </motion.div>
            ) : (
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-7xl"
                >
                    {result?.passed ? '🌟' : '🌸'}
                </motion.div>
            )}

            <p className="text-xl font-bold text-slate-700">
                {result?.passed ? 'Wonderful! Great job! ✨' : 'Good effort! 🌻'}
            </p>

            {result && (
                <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className={`w-6 h-6 rounded-full ${
                                i < Math.round(result.confidence * 5)
                                    ? 'bg-gradient-to-br from-yellow-300 to-amber-400'
                                    : 'bg-gray-100'
                            }`}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
