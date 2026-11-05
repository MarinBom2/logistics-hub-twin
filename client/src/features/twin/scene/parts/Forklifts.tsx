import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import { PALLET_CAPACITY } from '../../sim/layout'
import { G, M } from '../assets'
import { Box, PalletUnit } from './primitives'

const ROOF_POSTS: [number, number][] = [[-0.5, -0.85], [0.5, -0.85], [-0.5, 0.35], [0.5, 0.35]]
const WHEELS: [number, number][] = [[-0.58, 0.3], [0.58, 0.3], [-0.58, -0.85], [0.58, -0.85]]

/** 집게차 한 대. 대수를 1대로 줄이면 2번 차는 집에 머문다 */
function Forklift({ center, index }: { center: Center; index: number }) {
  const body = useRef<THREE.Group>(null)
  const carried = useRef<THREE.Group>(null)
  const inst = useRef<THREE.InstancedMesh>(null)
  const film = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const fork = center.forks[index]
    if (body.current) {
      body.current.position.set(fork.x, 0, fork.z)
      body.current.rotation.y = fork.yaw
    }
    if (carried.current) carried.current.visible = fork.carry
    if (film.current) film.current.visible = fork.film
  })

  return (
    <group ref={body}>
      <Box size={[1.1, 0.8, 1.5]} position={[0, 0.62, -0.25]} material={M.yellow} />
      <Box size={[1.12, 0.6, 0.42]} position={[0, 0.55, -1.1]} material={M.dark} />
      {ROOF_POSTS.map(([x, z]) => (
        <Box key={`${x}-${z}`} size={[0.06, 1.2, 0.06]} position={[x, 1.6, z]} material={M.darker} />
      ))}
      <Box size={[1.1, 0.06, 1.3]} position={[0, 2.2, -0.25]} material={M.darker} />
      {[-0.36, 0.36].map((x) => (
        <Box key={x} size={[0.1, 2.4, 0.1]} position={[x, 1.2, 0.62]} material={M.steel} />
      ))}
      {[-0.3, 0.3].map((x) => (
        <Box key={x} size={[0.12, 0.05, 1.15]} position={[x, 0.2, 1.25]} material={M.steel} />
      ))}
      {WHEELS.map(([x, z]) => (
        <mesh key={`${x}-${z}`} geometry={G.forkWheel} material={M.rubber} position={[x, 0.26, z]} castShadow />
      ))}
      <PalletUnit
        groupRef={carried}
        initialCount={PALLET_CAPACITY}
        instRef={inst}
        filmRef={film}
        position={[0, 0.22, 1.4]}
        visible={false}
      />
    </group>
  )
}

export function Forklifts({ center }: { center: Center }) {
  return (
    <group>
      {center.forks.map((_, i) => (
        <Forklift key={i} center={center} index={i} />
      ))}
    </group>
  )
}
