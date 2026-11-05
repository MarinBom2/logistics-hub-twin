import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import { BELT_END, BELT_Y, BELT_Z, BRANCH_LENGTH, CHUTE_ANGLE, PARCEL_POOL } from '../../sim/layout'
import { G } from '../assets'
import { branchBottom, branchTop } from './branchPath'

const CARDBOARD = new THREE.Color(0xc8965a)
const NO_READ = new THREE.Color(0xd2584a)
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0)
/** 매 프레임 계산용 임시 객체 (화면은 하나뿐이라 모듈에 둔다) */
const dummy = new THREE.Object3D()
const top = new THREE.Vector3()
const bottom = new THREE.Vector3()

/** 레일 위 박스 전부를 InstancedMesh 하나로 그린다. 판독 실패 박스는 붉게 */
export function Parcels({ center }: { center: Center }) {
  const mesh = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const inst = mesh.current
    if (!inst) return
    center.parcels.forEach((p, n) => {
      if (p.st === 'off') {
        inst.setMatrixAt(n, HIDDEN)
        return
      }
      if (p.st === 'belt') {
        dummy.position.set(p.x, BELT_Y + 0.2, BELT_Z)
        dummy.rotation.set(0, p.rotY, 0)
      } else if (p.st === 'branch') {
        top.copy(branchTop(p.lane))
        bottom.copy(branchBottom(p.lane))
        dummy.position.lerpVectors(top, bottom, p.s / BRANCH_LENGTH)
        dummy.position.y += 0.2
        dummy.rotation.set(CHUTE_ANGLE, 0, 0)
      } else {
        const t = Math.min(1, p.t)
        dummy.position.set(BELT_END + t * 2.4, BELT_Y + 0.2 - t * 0.9, BELT_Z)
        dummy.rotation.set(0, 0, -0.32 * t)
      }
      dummy.updateMatrix()
      inst.setMatrixAt(n, dummy.matrix)
      inst.setColorAt(n, p.read === false ? NO_READ : CARDBOARD)
    })
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[G.parcel, undefined, PARCEL_POOL]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onUpdate={(self) => {
        // 색 버퍼는 첫 setColorAt 때 생긴다. 셰이더가 처음부터 색을 쓰도록 미리 채운다
        if (!self.instanceColor) for (let n = 0; n < PARCEL_POOL; n++) self.setColorAt(n, CARDBOARD)
      }}
    >
      <meshStandardMaterial color={0xffffff} roughness={0.9} metalness={0.08} />
    </instancedMesh>
  )
}
