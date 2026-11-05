import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import { PALLET_CAPACITY } from '../../sim/layout'
import { G, M } from '../assets'

type Vec3 = [number, number, number]

interface BoxProps {
  size: Vec3
  position: Vec3
  material: THREE.Material
  rotation?: Vec3
  shadow?: boolean
}

/** 그림자를 주고받는 상자 하나. 현장 구조물은 거의 이것으로 만든다 */
export function Box({ size, position, material, rotation, shadow = true }: BoxProps) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={shadow} receiveShadow={shadow}>
      <boxGeometry args={size} />
    </mesh>
  )
}

interface PalletUnitProps {
  /** 처음 보일 박스 수. 이후는 instRef.current.count 로 바꾼다 */
  initialCount: number
  instRef: RefObject<THREE.InstancedMesh | null>
  filmRef: RefObject<THREE.Mesh | null>
  filmVisible?: boolean
  position?: Vec3
  visible?: boolean
  groupRef?: RefObject<THREE.Group | null>
}

/** 파레트 + 박스 27개(3×3×3, InstancedMesh) + 래핑 필름. 분류구·래핑기·집게차가 같이 쓴다 */
export function PalletUnit({ initialCount, instRef, filmRef, filmVisible = false, position, visible = true, groupRef }: PalletUnitProps) {
  useLayoutEffect(() => {
    const inst = instRef.current
    if (!inst) return
    const matrix = new THREE.Matrix4()
    const color = new THREE.Color()
    for (let n = 0; n < PALLET_CAPACITY; n++) {
      const layer = Math.floor(n / 9)
      const cell = n % 9
      matrix.makeTranslation(((cell % 3) - 1) * 0.38, 0.14 + 0.15 + layer * 0.31, (Math.floor(cell / 3) - 1) * 0.38)
      inst.setMatrixAt(n, matrix)
      color.setHSL(0.075 + Math.random() * 0.02, 0.42, 0.42 + Math.random() * 0.1)
      inst.setColorAt(n, color)
    }
    inst.count = initialCount
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  }, [instRef, initialCount])

  return (
    <group ref={groupRef} position={position} visible={visible}>
      <Box size={[1.2, 0.14, 1.2]} position={[0, 0.07, 0]} material={M.wood} />
      <instancedMesh
        ref={instRef}
        args={[G.palletBox, undefined, PALLET_CAPACITY]}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <meshStandardMaterial color={0xffffff} roughness={0.9} metalness={0.08} />
      </instancedMesh>
      <mesh ref={filmRef} geometry={G.film} material={M.film} position={[0, 0.14, 0]} visible={filmVisible} />
    </group>
  )
}
