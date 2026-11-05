import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import { BELT_END, BELT_SPEED, BELT_START, BELT_Y, BELT_Z, REJECT_PILE_MAX, SCAN_X } from '../../sim/layout'
import { BELT_LENGTH, G, M, beltMaterial, beltTexture } from '../assets'
import { Box } from './primitives'

const BELT_CX = (BELT_END + BELT_START) / 2
const LEGS = (() => {
  const xs: number[] = []
  for (let x = BELT_START + 0.6; x < BELT_END; x += 2.6) xs.push(x)
  return xs
})()

/** 메인 레일, 스캔 터널, 리젝트 슈트·케이지 */
export function Conveyor({ center }: { center: Center }) {
  const scanLight = useRef<THREE.PointLight>(null)
  const rejectPile = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const pile = rejectPile.current
    if (!pile) return
    for (let k = 0; k < REJECT_PILE_MAX; k++) {
      const matrix = new THREE.Matrix4().makeRotationY(k * 0.7)
      matrix.setPosition(
        BELT_END + 2.6 + ((k % 3) - 1) * 0.45,
        0.17 + Math.floor(k / 6) * 0.34,
        BELT_Z + ((Math.floor(k / 3) % 2) - 0.5) * 0.5,
      )
      pile.setMatrixAt(k, matrix)
    }
    pile.count = 0
    pile.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(0.1, delta)
    if (center.running) beltTexture.offset.x -= dt * BELT_SPEED * 1.5
    M.beam.opacity = 0.1 + center.scanFlash * 0.6
    if (scanLight.current) scanLight.current.intensity = center.scanFlash * 2.2 * Math.PI
    if (rejectPile.current) rejectPile.current.count = Math.min(REJECT_PILE_MAX, center.rejectPile)
  })

  return (
    <group>
      {/* 메인 레일 */}
      <Box size={[BELT_LENGTH, 0.18, 1.4]} position={[BELT_CX, BELT_Y - 0.1, BELT_Z]} material={M.steel} />
      <mesh material={beltMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[BELT_CX, BELT_Y + 0.001, BELT_Z]} receiveShadow>
        <planeGeometry args={[BELT_LENGTH, 1.2]} />
      </mesh>
      {[-0.68, 0.68].map((dz) => (
        <Box key={dz} size={[BELT_LENGTH, 0.26, 0.08]} position={[BELT_CX, BELT_Y + 0.08, BELT_Z + dz]} material={M.steel} />
      ))}
      {LEGS.map((x) =>
        [-0.55, 0.55].map((dz) => (
          <Box key={`${x}-${dz}`} size={[0.12, BELT_Y - 0.1, 0.12]} position={[x, (BELT_Y - 0.1) / 2, BELT_Z + dz]} material={M.dark} />
        )),
      )}

      {/* 스캔 터널: 박스가 지날 때마다 빛이 번쩍인다 */}
      <group position={[SCAN_X, 0, BELT_Z]}>
        {[-0.95, 0.95].map((dz) => (
          <Box key={dz} size={[0.22, 2.4, 0.22]} position={[0, 1.2, dz]} material={M.dark} />
        ))}
        <Box size={[0.5, 0.45, 2.2]} position={[0, 2.45, 0]} material={M.dark} />
        <mesh material={M.beam} position={[0, 1.65, 0]}>
          <boxGeometry args={[0.04, 1.1, 1.3]} />
        </mesh>
        <pointLight ref={scanLight} color={0x5aa9ff} intensity={0} distance={5} decay={1} position={[0, 2.0, 0]} />
      </group>

      {/* 리젝트 슈트와 케이지 */}
      <Box size={[2.2, 0.06, 1.2]} position={[BELT_END + 1.0, 0.68, BELT_Z]} rotation={[0, 0, -0.32]} material={M.steel} />
      <lineSegments position={[BELT_END + 2.6, 0.5, BELT_Z]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.6, 1.0, 1.6)]} />
        <lineBasicMaterial color={0xff6a5c} />
      </lineSegments>
      <instancedMesh
        ref={rejectPile}
        args={[G.rejectBox, M.rejectBox, REJECT_PILE_MAX]}
        castShadow
        frustumCulled={false}
      />
    </group>
  )
}
