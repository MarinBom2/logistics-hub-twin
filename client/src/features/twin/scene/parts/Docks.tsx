import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import { DOCK_Z, LANE_COUNT, laneX } from '../../sim/layout'
import { G, M, stripeMaterial } from '../assets'
import { Box } from './primitives'

/** 트레일러 길이와 위치 */
const TRAILER = 6.0
const TRAILER_Z = DOCK_Z + 0.2 + TRAILER / 2
const CAB_Z = DOCK_Z + 0.2 + TRAILER + 1.3
/** 화물이 차오르는 앞쪽 끝과 최대 깊이 */
const CARGO_FRONT = DOCK_Z + 0.2 + TRAILER - 0.15
const CARGO_DEPTH = TRAILER - 0.4
/** 뒷문 쪽 면(+z)은 열어 두고 지붕은 반투명이라 안의 화물이 보인다 */
const TRAILER_MATERIALS = [M.white, M.white, M.truckRoof, M.white, M.white, M.hidden]

/** 도크 한 칸과 간선 트럭: 적재율만큼 화물이 차고, 출발하면 멀어졌다 빈 차로 돌아온다 */
function DockBay({ center, index }: { center: Center; index: number }) {
  const rig = useRef<THREE.Group>(null)
  const cargo = useRef<THREE.Mesh>(null)
  const x = laneX(index)

  useFrame(() => {
    const truck = center.trucks[index]
    if (rig.current) rig.current.position.z = truck.z
    const box = cargo.current
    if (!box) return
    const depth = Math.max(0.001, truck.load * CARGO_DEPTH)
    box.scale.z = depth
    box.position.z = CARGO_FRONT - depth / 2
    box.visible = truck.load > 0.005
  })

  return (
    <group>
      {[-1.55, 1.55].map((o) => (
        <Box key={o} size={[0.18, 3.4, 0.3]} position={[x + o, 1.7, DOCK_Z - 0.25]} material={M.steel} />
      ))}
      <Box size={[3.3, 0.3, 0.3]} position={[x, 3.5, DOCK_Z - 0.25]} material={M.steel} />
      <Box size={[3.0, 0.22, 0.12]} position={[x, 0.95, DOCK_Z + 0.02]} material={stripeMaterial} />
      <group ref={rig} position={[x, 0, 0]}>
        <mesh material={TRAILER_MATERIALS} position={[0, 2.35, TRAILER_Z]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 2.7, TRAILER]} />
        </mesh>
        <Box size={[2.3, 0.3, TRAILER + 0.4]} position={[0, 0.8, TRAILER_Z + 0.2]} material={M.darker} />
        <mesh ref={cargo} material={M.card} position={[0, 2.17, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 2.3, 1]} />
        </mesh>
        <Box size={[2.4, 2.2, 1.9]} position={[0, 2.0, CAB_Z]} material={M.cab} />
        <Box size={[2.2, 0.9, 0.05]} position={[0, 2.55, DOCK_Z + 0.2 + TRAILER + 2.27]} material={M.glass} />
        {[TRAILER_Z - 1.9, TRAILER_Z - 1.0, CAB_Z].map((wz) =>
          [-1.05, 1.05].map((wx) => (
            <mesh key={`${wz}-${wx}`} geometry={G.truckWheel} material={M.rubber} position={[wx, 0.42, wz]} castShadow />
          )),
        )}
      </group>
    </group>
  )
}

export function Docks({ center }: { center: Center }) {
  return (
    <group>
      <Box size={[30, 0.9, 0.5]} position={[0, 0.45, DOCK_Z - 0.25]} material={M.dark} />
      {Array.from({ length: LANE_COUNT }, (_, i) => (
        <DockBay key={i} center={center} index={i} />
      ))}
    </group>
  )
}
