import * as THREE from 'three'
import { LANE_COUNT, PALLET_Z, laneX } from '../../sim/layout'
import { M } from '../assets'

/** 바닥에 칠한 선. 두께 없는 평면이라 그림자를 받지 않는다 */
function FloorLine({ from, to, width, material }: { from: [number, number]; to: [number, number]; width: number; material: THREE.Material }) {
  const [x1, z1] = from
  const [x2, z2] = to
  return (
    <mesh
      material={material}
      position={[(x1 + x2) / 2, 0.012, (z1 + z2) / 2]}
      rotation={[-Math.PI / 2, 0, -Math.atan2(z2 - z1, x2 - x1)]}
    >
      <planeGeometry args={[Math.hypot(x2 - x1, z2 - z1), width]} />
    </mesh>
  )
}

/** 바닥, 격자, 통로 선(노랑), 분류구 파레트 자리(어두운 사각형) */
export function Floor() {
  const half = 0.8
  return (
    <group>
      <mesh material={M.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]} receiveShadow>
        <planeGeometry args={[70, 50]} />
      </mesh>
      <gridHelper args={[70, 70, 0x232d3a, 0x1d2530]} position={[0, 0.005, 2]} />
      <FloorLine from={[-15, 0.95]} to={[15, 0.95]} width={0.12} material={M.mark} />
      <FloorLine from={[-15, 6.1]} to={[15, 6.1]} width={0.12} material={M.mark} />
      {Array.from({ length: LANE_COUNT }, (_, i) => {
        const x = laneX(i)
        return (
          <group key={i}>
            <FloorLine from={[x - half, PALLET_Z - half]} to={[x + half, PALLET_Z - half]} width={0.06} material={M.markDim} />
            <FloorLine from={[x - half, PALLET_Z + half]} to={[x + half, PALLET_Z + half]} width={0.06} material={M.markDim} />
            <FloorLine from={[x - half, PALLET_Z - half]} to={[x - half, PALLET_Z + half]} width={0.06} material={M.markDim} />
            <FloorLine from={[x + half, PALLET_Z - half]} to={[x + half, PALLET_Z + half]} width={0.06} material={M.markDim} />
          </group>
        )
      })}
    </group>
  )
}
