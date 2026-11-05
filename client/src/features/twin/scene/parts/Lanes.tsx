import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import { JAM_BACKLOG, LANE_COUNT, PALLET_Z, laneX } from '../../sim/layout'
import { PalletUnit } from './primitives'

/** 분류구 하나: 쌓이는 파레트와 상태 링 (집게차 대기 = 노랑, 적체 = 빨강 깜빡임) */
function LaneSlot({ center, index }: { center: Center; index: number }) {
  const inst = useRef<THREE.InstancedMesh>(null)
  const film = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    const lane = center.lanes[index]
    if (inst.current) inst.current.count = lane.boxes
    const material = ring.current
    if (!material) return
    const jam = lane.backlog >= JAM_BACKLOG
    material.color.setHex(jam ? 0xff6a5c : 0xf2b230)
    material.opacity = !jam && lane.status === 'load' ? 0 : 0.45 + 0.35 * Math.sin(clock.elapsedTime * 6)
  })

  return (
    <group>
      <PalletUnit initialCount={0} instRef={inst} filmRef={film} position={[laneX(index), 0, PALLET_Z]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[laneX(index), 0.02, PALLET_Z]}>
        <ringGeometry args={[1.0, 1.18, 48]} />
        <meshBasicMaterial ref={ring} color={0xf2b230} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function Lanes({ center }: { center: Center }) {
  return (
    <group>
      {Array.from({ length: LANE_COUNT }, (_, i) => (
        <LaneSlot key={i} center={center} index={i} />
      ))}
    </group>
  )
}
