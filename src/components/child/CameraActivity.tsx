'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

interface CameraActivityProps {
    prompt?: string
    onComplete?: () => void
}

export default function CameraActivity({ prompt = 'Show me something!', onComplete }: CameraActivityProps) {
    const [cameraActive, setCameraActive] = useState(false)
    const [captured, setCaptured] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [predictions, setPredictions] = useState<cocoSsd.DetectedObject[]>([])
    const [modelLoading, setModelLoading] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const modelRef = useRef<cocoSsd.ObjectDetection | null>(null)
    const requestRef = useRef<number>(0)

    // Load model once when component mounts
    useEffect(() => {
        const loadModel = async () => {
            try {
                // Ensure backend is ready
                await tf.ready()
                modelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' })
            } catch (err) {
                console.error("Failed to load TFJS model", err)
            }
        }
        loadModel()

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
        }
    }, [])

    const detectFrame = useCallback(async () => {
        if (!videoRef.current || !modelRef.current || videoRef.current.readyState !== 4) {
            requestRef.current = requestAnimationFrame(detectFrame)
            return
        }

        try {
            const preds = await modelRef.current.detect(videoRef.current)
            // Filter for high confidence predictions
            const highConfidence = preds.filter(p => p.score > 0.6)
            setPredictions(highConfidence)
        } catch (e) {
            // ignore detection errors
        }

        requestRef.current = requestAnimationFrame(detectFrame)
    }, [])

    const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
        // @ts-ignore
        videoRef.current = node
        if (node && streamRef.current && !node.srcObject) {
            node.srcObject = streamRef.current
            node.onloadeddata = () => {
                setModelLoading(false)
                detectFrame()
            }
        }
    }, [detectFrame])

    const startCamera = useCallback(async () => {
        try {
            setModelLoading(true)

            // Check if API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported in this browser.")
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
            })

            streamRef.current = stream
            setCameraActive(true) // Mounts the video element; useEffect will attach the stream
        } catch (err: any) {
            console.error("Camera Initialization Error:", err)
            // Camera not available — simulate a captured photo so the flow isn't blocked completely
            console.log("Falling back to simulated capture...")
            setCameraActive(false)
            setModelLoading(false)

            // Format nice error string
            const errName = err?.name || "Unknown Error"
            const errMsg = err?.message || "Failed to access camera"

            // Simulate capture so the user isn't stuck
            setTimeout(() => {
                const canvas = document.createElement('canvas')
                canvas.width = 640
                canvas.height = 480
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.fillStyle = '#fce7f3' // petal-pink background
                    ctx.fillRect(0, 0, 640, 480)
                    ctx.fillStyle = '#ec4899' // dark pink text
                    ctx.font = 'bold 30px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText('Simulated Photo 🌸', 320, 240)

                    ctx.font = '16px Arial'
                    ctx.fillText(`${errName}: ${errMsg}`, 320, 280)
                }
                setCapturedImage(canvas.toDataURL('image/jpeg', 0.8))
                setCaptured(true)

                setTimeout(() => {
                    onComplete?.()
                }, 2000)
            }, 1000)
        }
    }, [detectFrame])

    const capturePhoto = () => {
        if (!videoRef.current) return

        if (requestRef.current) cancelAnimationFrame(requestRef.current)

        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)

        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8))
        setCaptured(true)

        // Stop camera
        streamRef.current?.getTracks().forEach((t) => t.stop())

        setTimeout(() => {
            onComplete?.()
        }, 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-6 p-6"
        >
            <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl mb-2"
            >
                📷
            </motion.div>

            <p className="text-xl font-bold text-gray-700 text-center">{prompt}</p>

            <AnimatePresence mode="wait">
                {captured && capturedImage ? (
                    <motion.div
                        key="captured"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 5, 0] }}
                        className="relative"
                    >
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-80 h-60 object-cover rounded-3xl shadow-xl border-4 border-petal-green"
                        />
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-petal-green flex items-center justify-center text-2xl shadow-lg"
                        >
                            ⭐
                        </motion.div>

                        {/* Show final detected objects if any */}
                        {predictions.length > 0 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center flex-wrap gap-2 px-4 pointer-events-none">
                                {predictions.slice(0, 3).map((pred, i) => (
                                    <div key={i} className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-petal-blue shadow-sm border border-white/50">
                                        {pred.class}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : cameraActive ? (
                    <motion.div key="camera" className="relative group w-80 h-60">
                        <video
                            ref={handleVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover rounded-3xl shadow-xl"
                        />

                        {/* Live Object Detection Overlays */}
                        {predictions.map((pred, i) => {
                            // The bbox is [x, y, width, height] relative to the video resolution.
                            // We need to scale it to our CSS container (w-80 h-60 -> 320x240px approx depending on actual rendering).
                            // For simplicity, we just show pills at the bottom instead of complex box mapping.
                            return null;
                        })}

                        {predictions.length > 0 && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center flex-wrap gap-2 px-4 pointer-events-none">
                                {predictions.slice(0, 3).map((pred, i) => (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        key={`${pred.class}-${i}`}
                                        className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-bold text-petal-purple shadow-lg border border-white flex items-center gap-1"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-petal-green animate-pulse" />
                                        I see a {pred.class}!
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Viewfinder corners */}
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-white/80 rounded-tl-xl transition-all group-hover:border-white" />
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-white/80 rounded-tr-xl transition-all group-hover:border-white" />
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-white/80 rounded-bl-xl transition-all group-hover:border-white" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-white/80 rounded-br-xl transition-all group-hover:border-white" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="placeholder"
                        className="w-80 h-60 rounded-3xl bg-gray-100 flex flex-col items-center justify-center border-2 border-dashed border-gray-300"
                    >
                        <span className="text-5xl mb-3">{modelLoading ? '⏳' : '📸'}</span>
                        <p className="text-gray-500 font-medium">
                            {modelLoading ? 'Warming up AI...' : 'Camera preview'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!captured && (
                <motion.button
                    onClick={cameraActive ? capturePhoto : startCamera}
                    disabled={modelLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all ${modelLoading ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none' :
                        cameraActive
                            ? 'bg-petal-green text-white ring-4 ring-petal-green/30'
                            : 'bg-gradient-to-br from-petal-blue to-petal-cyan text-white'
                        }`}
                >
                    {modelLoading ? '⏳' : cameraActive ? '📸' : '📷'}
                </motion.button>
            )}

            <p className="text-sm text-gray-400 text-center font-medium h-6">
                {modelLoading
                    ? 'Preparing smart camera...'
                    : captured
                        ? 'Awesome picture! ⭐'
                        : cameraActive
                            ? predictions.length > 0 ? "I see something! Take a photo!" : 'Aim at an object and tap!'
                            : 'Tap to open smart camera!'}
            </p>
        </motion.div>
    )
}
