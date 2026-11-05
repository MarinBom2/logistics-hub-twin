import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import { PALLET_CAPACITY, WRAP_X, WRAP_Z } from '../../sim/layout'
import { M } from '../assets'
import { Box, PalletUnit } from './primitives'

/** 래핑 스테이션 하나: 턴테이블이 돌며 필름이 아래부터 감긴다 */
function WrapStation({ center, index }: { center: Center; index: number }) {
  const spin = useRef<THREE.Group>(null)
  const unit = useRef<THREE.Group>(null)
  const inst = useRef<THREE.InstancedMesh>(null)
  const film = useRef<THREE.Mesh>(null)
  const roll = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const wrapper = center.wrappers[index]
    if (unit.current) unit.current.visible = wrapper.show
    if (film.current) film.current.scale.y = wrapper.film
    if (spin.current) spin.current.rotation.y = wrapper.spin
    if (roll.current) roll.current.position.y = wrapper.roll
  })

  return (
    <group position={[WRAP_X[index], 0, WRAP_Z]}>
      <group ref={spin}>
        <mesh material={M.dark} position={[0, 0.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 0.95, 0.12, 32]} />
        </mesh>
        <PalletUnit
          groupRef={unit}
          initialCount={PALLET_CAPACITY}
          instRef={inst}
          filmRef={film}
          filmVisible
          position={[0, 0.12, 0]}
          visible={false}
        />
      </group>
      <Box size={[0.22, 2.6, 0.22]} position={[1.3, 1.3, 0]} material={M.steel} />
      <mesh ref={roll} material={M.filmRoll} position={[1.1, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.5, 14]} />
      </mesh>
    </group>
  )
}

export function Wrappers({ center }: { center: Center }) {
  return (
    <group>
      {WRAP_X.map((_, i) => (
        <WrapStation key={i} center={center} index={i} />
      ))}
    </group>
  )
}
