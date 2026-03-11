'use client'

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Text, Center, Sparkles, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// Bright, vibrant 2D color palette
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#EC4899', '#06B6D4']

// Generates random items (letters, numbers, shapes)
function createBGFlora(count: number) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const numbers = '123456789'.split('')
    const shapes = ['circle', 'triangle', 'square', 'star']
    
    return Array.from({ length: count }, (_, i) => {
        const typeRoll = Math.random()
        let type: 'letter' | 'number' | 'shape' = 'letter'
        let value = ''

        if (typeRoll < 0.4) {
            type = 'letter'
            value = letters[Math.floor(Math.random() * letters.length)]
        } else if (typeRoll < 0.7) {
            type = 'number'
            value = numbers[Math.floor(Math.random() * numbers.length)]
        } else {
            type = 'shape'
            value = shapes[Math.floor(Math.random() * shapes.length)]
        }

        return {
            id: i,
            type,
            value,
            position: new THREE.Vector3(
                (Math.random() - 0.5) * 35, // x spread
                (Math.random() - 0.5) * 25, // y spread
                (Math.random() - 0.5) * 15 - 5 // z depth (closer to background)
            ),
            rotation: [0, 0, Math.random() * Math.PI] as [number, number, number], // 2D rotation only
            scale: Math.random() * 0.5 + 0.8, // Slightly larger base scale for 2D
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            floatIntensity: Math.random() * 2 + 1,
            floatSpeed: Math.random() * 1.5 + 0.5,
        }
    })
}

// Flat, bright 2D material
const brightMaterial = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
})

function FloatingItem({ data, mousePos }: { data: any, mousePos: React.MutableRefObject<THREE.Vector2> }) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const initialPos = useRef(data.position.clone())
    const material = useMemo(() => brightMaterial.clone(), [])
    
    useMemo(() => {
        material.color.set(data.color)
    }, [data.color, material])

    // Cursor reactivity & GSAP hover bounce
    useFrame((state) => {
        if (!meshRef.current) return
        
        // Parallax effect based on depth
        const depthFactor = (data.position.z + 20) / 20 // deeper objects move less
        const targetX = initialPos.current.x + (mousePos.current.x * 2 * depthFactor)
        const targetY = initialPos.current.y + (mousePos.current.y * 2 * depthFactor)

        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.05)
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05)
    })

    const handlePointerOver = (e: any) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        setHovered(true)
        if (meshRef.current) {
            gsap.to(meshRef.current.scale, {
                x: data.scale * 1.5,
                y: data.scale * 1.5,
                z: data.scale * 1.5,
                duration: 0.4,
                ease: "back.out(2)"
            })
            // Create a "glow" effect by increasing opacity 
            gsap.to(material, {
                opacity: 1,
                duration: 0.2
            })
        }
    }

    const handlePointerOut = () => {
        document.body.style.cursor = 'auto'
        setHovered(false)
        if (meshRef.current) {
            gsap.to(meshRef.current.scale, {
                x: data.scale,
                y: data.scale,
                z: data.scale,
                duration: 0.6,
                ease: "elastic.out(1, 0.5)"
            })
            gsap.to(material, {
                opacity: 0.9,
                duration: 0.4
            })
        }
    }

    return (
        <Float speed={data.floatSpeed} rotationIntensity={data.floatIntensity / 2} floatIntensity={data.floatIntensity}>
            <mesh
                ref={meshRef}
                position={data.position}
                rotation={data.rotation}
                scale={data.scale}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                material={material}
            >
                {data.type === 'letter' || data.type === 'number' ? (
                    <Center>
                        <Text
                            characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
                            fontSize={1.8}
                            color={data.color}
                            anchorX="center"
                            anchorY="middle"
                            fontWeight="bold"
                            outlineWidth={hovered ? 0.05 : 0}
                            outlineColor="#ffffff"
                        >
                            {data.value}
                        </Text>
                    </Center>
                ) : data.value === 'circle' ? (
                    <circleGeometry args={[1, 32]} />
                ) : data.value === 'triangle' ? (
                    <circleGeometry args={[1, 3]} />
                ) : data.value === 'square' ? (
                    <planeGeometry args={[1.5, 1.5]} />
                ) : (
                    // 5-pointed star approximation using a circle with 5 segments and a trick
                    <circleGeometry args={[1.2, 5]} />
                )}
            </mesh>
        </Float>
    )
}

function Scene() {
    // Generate 40 floating items
    const items = useMemo(() => createBGFlora(40), [])
    const mousePos = useRef(new THREE.Vector2(0, 0))

    useFrame((state) => {
        // Smoothly interpolate mouse position for the parallax effect
        // We use normalized device coordinates (-1 to +1)
        mousePos.current.x = THREE.MathUtils.lerp(mousePos.current.x, (state.pointer.x * Math.PI) / 4, 0.1)
        mousePos.current.y = THREE.MathUtils.lerp(mousePos.current.y, (state.pointer.y * Math.PI) / 4, 0.1)
    })

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={1.2} castShadow={false} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#A78BFA" />
            
            <group>
                {items.map((item) => (
                    <FloatingItem key={item.id} data={item} mousePos={mousePos} />
                ))}
            </group>

            {/* Glowing magic sparkles floating around */}
            <Sparkles count={80} scale={25} size={6} speed={0.4} color="#FFFBEB" opacity={0.6} noise={0.1} />
        </>
    )
}

export default function LearningPlayground() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0E7FF 50%, #FAE8FF 100%)' }}>
            {/* The canvas pointer-events must be auto in order to receive hover events, but we want UI on top to catch clicks. */}
            {/* By setting the wrapping div to pointer-events-none, the children (Canvas) inherit it, so we manually enable pointer-events on Canvas. */}
            <div className="absolute inset-0 pointer-events-auto">
                <Canvas
                    camera={{ position: [0, 0, 15] }}
                    dpr={[1, 2]} // Optimize for mobile vs retina
                    gl={{ antialias: true, alpha: true }}
                >
                    <Scene />
                </Canvas>
            </div>
            
            {/* Subtle overlay gradient to blend the 3D scene smoothly with the UI */}
            <div className="absolute inset-0 bg-white/20 pointer-events-none backdrop-blur-[1px]" />
        </div>
    )
}
