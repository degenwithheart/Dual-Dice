import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three'
import * as THREE from 'three'

interface DiceProps {
  position: [number, number, number]
  result: number
  rolling: boolean
}

export function Dice({ position, result, rolling }: DiceProps) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)

  useFrame(() => {
    if (!meshRef.current) return

    if (rolling) {
      meshRef.current.rotation.x += 0.12
      meshRef.current.rotation.y += 0.08
      meshRef.current.rotation.z += 0.05
    } else {
      // Smoothly rotate to show result face
      const targetRotations: Record<number, [number, number, number]> = {
        1: [0, 0, 0],
        2: [Math.PI / 2, 0, 0],
        3: [0, Math.PI / 2, 0],
        4: [0, -Math.PI / 2, 0],
        5: [-Math.PI / 2, 0, 0],
        6: [Math.PI, 0, 0],
      }

      const [targetX, targetY, targetZ] = targetRotations[result] || [0, 0, 0]
      
      meshRef.current.rotation.x += (targetX - meshRef.current.rotation.x) * 0.1
      meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * 0.1
      meshRef.current.rotation.z += (targetZ - meshRef.current.rotation.z) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ffffff"
        metalness={0.3}
        roughness={0.4}
      />
      {/* Dots on faces */}
      {createDots(result)}
    </mesh>
  )
}

function createDots(faceNumber: number) {
  // Simple dot representation - in production, use textures
  const dotPositions: Record<number, Array<[number, number, number]>> = {
    1: [[0, 0, 0.51]],
    2: [[-0.25, 0.25, 0.51], [0.25, -0.25, 0.51]],
    3: [[-0.25, 0.25, 0.51], [0, 0, 0.51], [0.25, -0.25, 0.51]],
    4: [[-0.25, 0.25, 0.51], [0.25, 0.25, 0.51], [-0.25, -0.25, 0.51], [0.25, -0.25, 0.51]],
    5: [[-0.25, 0.25, 0.51], [0.25, 0.25, 0.51], [0, 0, 0.51], [-0.25, -0.25, 0.51], [0.25, -0.25, 0.51]],
    6: [[-0.25, 0.3, 0.51], [0.25, 0.3, 0.51], [-0.25, 0, 0.51], [0.25, 0, 0.51], [-0.25, -0.3, 0.51], [0.25, -0.3, 0.51]],
  }

  const positions = dotPositions[faceNumber] || []

  return positions.map((pos, i) => (
    <mesh key={i} position={pos}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#000000" />
    </mesh>
  ))
}
