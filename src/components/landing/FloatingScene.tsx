'use client'

import { useRef, useMemo, useCallback, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// ─── Cursor-reactive floating shape ───
function FloatingShape({ position, color, scale, speed, shape }: {
    position: [number, number, number]
    color: string
    scale: number
    speed: number
    shape: 'sphere' | 'torus' | 'octahedron' | 'dodecahedron' | 'icosahedron'
}) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!meshRef.current) return
        const t = state.clock.elapsedTime
        meshRef.current.rotation.x = Math.sin(t * speed * 0.3) * 0.4
        meshRef.current.rotation.y += speed * 0.003
        meshRef.current.rotation.z = Math.cos(t * speed * 0.2) * 0.2
    })

    const geometry = useMemo(() => {
        switch (shape) {
            case 'sphere': return new THREE.SphereGeometry(1, 32, 32)
            case 'torus': return new THREE.TorusGeometry(1, 0.4, 16, 32)
            case 'octahedron': return new THREE.OctahedronGeometry(1, 0)
            case 'dodecahedron': return new THREE.DodecahedronGeometry(1, 0)
            case 'icosahedron': return new THREE.IcosahedronGeometry(1, 0)
            default: return new THREE.SphereGeometry(1, 32, 32)
        }
    }, [shape])

    return (
        <Float speed={speed * 0.8} rotationIntensity={0.4} floatIntensity={0.8}>
            <mesh ref={meshRef} position={position} scale={scale} geometry={geometry}>
                <meshPhysicalMaterial
                    color={color}
                    transparent
                    opacity={0.85}
                    roughness={0.15}
                    metalness={0.05}
                    clearcoat={0.3}
                    clearcoatRoughness={0.2}
                    envMapIntensity={0.5}
                />
            </mesh>
        </Float>
    )
}

// ─── Glowing center orb ───
function GlowOrb() {
    const ref = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (!ref.current) return
        const t = state.clock.elapsedTime
        ref.current.scale.setScalar(1.8 + Math.sin(t * 0.5) * 0.15)
    })

    return (
        <mesh ref={ref} position={[0, 0, -3]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
                color="#E0E7FF"
                transparent
                opacity={0.12}
            />
        </mesh>
    )
}

// ─── Particles with cursor reactivity ───
function Particles({ count = 120 }: { count?: number }) {
    const geometry = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const sizes = new Float32Array(count)
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25
            positions[i * 3 + 1] = (Math.random() - 0.5) * 25
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12
            sizes[i] = Math.random() * 0.06 + 0.02
        }
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return geo
    }, [count])

    const ref = useRef<THREE.Points>(null)

    useFrame((state) => {
        if (!ref.current) return
        ref.current.rotation.y = state.clock.elapsedTime * 0.015
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
    })

    return (
        <points ref={ref} geometry={geometry}>
            <pointsMaterial
                size={0.05}
                color="#C4B5FD"
                transparent
                opacity={0.5}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}

// ─── Mouse-aware camera ───
function CameraRig() {
    const { camera } = useThree()
    const mouse = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
            mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
        }
        window.addEventListener('mousemove', handleMove)
        return () => window.removeEventListener('mousemove', handleMove)
    }, [])

    useFrame(() => {
        camera.position.x += (mouse.current.x * 0.5 - camera.position.x) * 0.02
        camera.position.y += (-mouse.current.y * 0.3 - camera.position.y) * 0.02
        camera.lookAt(0, 0, 0)
    })

    return null
}

// ─── Scene composition ───
function Scene() {
    const shapes: {
        position: [number, number, number]
        color: string
        scale: number
        speed: number
        shape: 'sphere' | 'torus' | 'octahedron' | 'dodecahedron' | 'icosahedron'
    }[] = [
        { position: [-4, 2.5, -1], color: '#7DD3FC', scale: 0.65, speed: 1.0, shape: 'sphere' },
        { position: [4.5, -1.5, -2], color: '#C4B5FD', scale: 0.55, speed: 0.7, shape: 'dodecahedron' },
        { position: [-2.5, -2.5, 0], color: '#6EE7B7', scale: 0.5, speed: 1.2, shape: 'octahedron' },
        { position: [2.5, 3, -3], color: '#FDBA74', scale: 0.7, speed: 0.5, shape: 'torus' },
        { position: [-5, 0.5, -2], color: '#FDA4AF', scale: 0.4, speed: 0.9, shape: 'icosahedron' },
        { position: [5, 1.5, -1], color: '#FDE68A', scale: 0.5, speed: 1.1, shape: 'sphere' },
        { position: [0, -3.5, -4], color: '#7DD3FC', scale: 0.8, speed: 0.6, shape: 'dodecahedron' },
        { position: [-1.5, 3.5, -2], color: '#C4B5FD', scale: 0.45, speed: 0.8, shape: 'torus' },
        { position: [3, -3, -1], color: '#6EE7B7', scale: 0.35, speed: 1.3, shape: 'icosahedron' },
        { position: [-3.5, -1, -3], color: '#FDA4AF', scale: 0.6, speed: 0.4, shape: 'sphere' },
    ]

    return (
        <>
            <ambientLight intensity={1.0} />
            <directionalLight position={[5, 5, 5]} intensity={0.6} color="#f8fafc" />
            <pointLight position={[-4, 3, 3]} intensity={0.5} color="#C4B5FD" distance={15} />
            <pointLight position={[4, -3, 3]} intensity={0.5} color="#7DD3FC" distance={15} />
            <pointLight position={[0, 4, 2]} intensity={0.3} color="#FDA4AF" distance={12} />

            <GlowOrb />

            {shapes.map((props, i) => (
                <FloatingShape key={i} {...props} />
            ))}

            <Particles count={120} />
            <CameraRig />
        </>
    )
}

export default function FloatingScene() {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (!mounted) return null

    return (
        <div className="absolute inset-0 -z-10" style={{ pointerEvents: 'none' }}>
            <Canvas
                camera={{ position: [0, 0, 7], fov: 50 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                style={{ background: 'transparent' }}
            >
                <Scene />
            </Canvas>
        </div>
    )
}
