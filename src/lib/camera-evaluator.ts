/**
 * PetalPath Camera Evaluator
 * 
 * Topic-aware camera evaluation:
 * - EMNIST classifier for handwritten letters/numbers
 * - COCO-SSD for object-based topics (shapes, animals)
 * - Fallback quiz when camera unavailable
 */

import type { CameraResult, CameraConfig, QuizOption } from './activity-types'

// ─── EMNIST Label Mapping ───
// EMNIST ByClass has 62 classes: 0-9, A-Z, a-z
const EMNIST_LABELS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Preprocess a canvas image for EMNIST model input.
 * EMNIST expects 28x28 grayscale, transposed.
 */
export function preprocessForEMNIST(canvas: HTMLCanvasElement): Float32Array | null {
    try {
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        // Create 28x28 temp canvas
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = 28
        tempCanvas.height = 28
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return null

        // Draw scaled down
        tempCtx.fillStyle = '#000'
        tempCtx.fillRect(0, 0, 28, 28)
        tempCtx.drawImage(canvas, 0, 0, 28, 28)

        // Get pixel data
        const imageData = tempCtx.getImageData(0, 0, 28, 28)
        const pixels = imageData.data

        // Convert to grayscale normalized float array
        // EMNIST is transposed (column-major), so we read column by column
        const input = new Float32Array(28 * 28)
        for (let col = 0; col < 28; col++) {
            for (let row = 0; row < 28; row++) {
                const srcIdx = (row * 28 + col) * 4
                const dstIdx = col * 28 + row  // transpose
                // Grayscale from RGB, invert (white on black → black on white)
                const gray = (pixels[srcIdx] + pixels[srcIdx + 1] + pixels[srcIdx + 2]) / 3
                input[dstIdx] = (255 - gray) / 255.0
            }
        }

        return input
    } catch {
        return null
    }
}

/**
 * Evaluate camera detection result against the target topic.
 * For COCO-SSD results (object detection).
 */
export function evaluateObjectDetection(
    predictions: Array<{ class: string; score: number }>,
    config: CameraConfig
): CameraResult {
    const target = config.targetLabel.toLowerCase()

    // Find best matching prediction
    let bestMatch: { label: string; confidence: number } | null = null

    for (const pred of predictions) {
        const predLabel = pred.class.toLowerCase()

        // Direct match
        if (predLabel === target || predLabel.includes(target) || target.includes(predLabel)) {
            if (!bestMatch || pred.score > bestMatch.confidence) {
                bestMatch = { label: pred.class, confidence: pred.score }
            }
        }
    }

    if (bestMatch) {
        return {
            label: bestMatch.label,
            confidence: bestMatch.confidence,
            passed: bestMatch.confidence >= 0.6,
            method: 'coco-ssd',
        }
    }

    // No match found
    return {
        label: predictions[0]?.class || 'unknown',
        confidence: 0,
        passed: false,
        method: 'coco-ssd',
    }
}

/**
 * Evaluate EMNIST model output for letter/number classification.
 */
export function evaluateEMNISTResult(
    outputProbabilities: Float32Array | number[],
    targetLabel: string
): CameraResult {
    const probs = Array.from(outputProbabilities)

    // Find the index of highest probability
    let maxIdx = 0
    let maxProb = 0
    for (let i = 0; i < probs.length; i++) {
        if (probs[i] > maxProb) {
            maxProb = probs[i]
            maxIdx = i
        }
    }

    const predictedLabel = EMNIST_LABELS[maxIdx] || '?'

    // Check if prediction matches target (case-insensitive)
    const isMatch = predictedLabel.toUpperCase() === targetLabel.toUpperCase()

    // Get confidence for the target label specifically
    const targetIdx = EMNIST_LABELS.indexOf(targetLabel)
    const targetUpperIdx = EMNIST_LABELS.indexOf(targetLabel.toUpperCase())
    const targetLowerIdx = EMNIST_LABELS.indexOf(targetLabel.toLowerCase())

    let targetConfidence = 0
    if (targetIdx >= 0) targetConfidence = Math.max(targetConfidence, probs[targetIdx] || 0)
    if (targetUpperIdx >= 0) targetConfidence = Math.max(targetConfidence, probs[targetUpperIdx] || 0)
    if (targetLowerIdx >= 0) targetConfidence = Math.max(targetConfidence, probs[targetLowerIdx] || 0)

    return {
        label: predictedLabel,
        confidence: isMatch ? maxProb : targetConfidence,
        passed: (isMatch && maxProb >= 0.4) || targetConfidence >= 0.6,
        method: 'emnist',
    }
}

/**
 * Evaluate a fallback quiz result (tap-to-select activity).
 * Used when camera is unavailable.
 */
export function evaluateQuizResult(selectedLabel: string, config: CameraConfig): CameraResult {
    const isCorrect = selectedLabel.toUpperCase() === config.targetLabel.toUpperCase()

    return {
        label: selectedLabel,
        confidence: isCorrect ? 1.0 : 0.0,
        passed: isCorrect,
        method: 'fallback-quiz',
    }
}

/**
 * Generate quiz options for fallback activity.
 * Returns 4 options with 1 correct answer.
 */
export function generateQuizOptions(config: CameraConfig): QuizOption[] {
    const target = config.targetLabel.toUpperCase()
    const isLetter = /^[A-Z]$/.test(target)
    const isNumber = /^\d+$/.test(target)

    let pool: string[] = []

    if (isLetter) {
        // Generate 3 random wrong letters
        const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== target)
        pool = shuffleArray(allLetters).slice(0, 3)
    } else if (isNumber) {
        // Generate 3 random wrong numbers
        const allNumbers = '123456789'.split('').filter(n => n !== target)
        pool = shuffleArray(allNumbers).slice(0, 3)
    } else {
        // Shapes or other
        const shapes = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'oval', 'rectangle']
        pool = shuffleArray(shapes.filter(s => s !== target.toLowerCase())).slice(0, 3)
    }

    const emojiMap: Record<string, string> = {
        A: '🅰️', B: '🅱️', C: '©️', O: '⭕',
        circle: '⭕', square: '⬛', triangle: '🔺', star: '⭐',
        heart: '❤️', diamond: '💎', oval: '🥚', rectangle: '📦',
    }

    const options: QuizOption[] = pool.map(label => ({
        label: label.toUpperCase(),
        emoji: emojiMap[label] || `${label.toUpperCase()}`,
        isCorrect: false,
    }))

    options.push({
        label: target,
        emoji: emojiMap[target] || emojiMap[target.toLowerCase()] || target,
        isCorrect: true,
    })

    return shuffleArray(options)
}

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}
