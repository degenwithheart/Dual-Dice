import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh } from 'three'
import { Dice } from './Dice'

interface DiceGroupProps {
  count: number
  results: number[]
  rolling: boolean
}

export function DiceGroup({ count, results, rolling }: DiceGroupProps) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current && rolling) {
      groupRef.current.rotation.y += 0.01
    }
  })

  const spacing = 1.5
  const offset = ((count - 1) * spacing) / 2

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <Dice
          key={i}
          position={[i * spacing - offset, 0, 0]}
          result={results[i] || 1}
          rolling={rolling}
        />
      ))}
    </group>
  )
}
