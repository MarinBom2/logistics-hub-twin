import { useFrame } from '@react-three/fiber'
import type { Center } from '../../sim/Center'
import { BRANCH_LENGTH, BRANCH_SPEED, CHUTE_ANGLE, LANE_COUNT } from '../../sim/layout'
import { M, branchMaterials, branchTextures } from '../assets'
import { branchBottom, branchTop } from './branchPath'
import { Box } from './primitives'

/** 다리 위치 (레일 위 진행 비율) */
const LEG_STOPS = (() => {
  const stops: number[] = []
  for (let s = 0.6; s < BRANCH_LENGTH; s += 2.2) stops.push(s / BRANCH_LENGTH)
  return stops
})()

/** 메인 레일에서 분류구 파레트로 내려가는 분기 레일 6개 (A~F) */
export function Branches({ center }: { center: Center }) {
  useFrame((_, delta) => {
    if (!center.running) return
    const dt = Math.min(0.1, delta)
    for (const texture of branchTextures) texture.offset.x -= dt * BRANCH_SPEED * 1.5
  })

  return (
    <group>
      {Array.from({ length: LANE_COUNT }, (_, i) => {
        const top = branchTop(i)
        const bottom = branchBottom(i)
        return (
          <group key={i}>
            <group position={[top.x, (top.y + bottom.y) / 2, (top.z + bottom.z) / 2]} rotation={[CHUTE_ANGLE, 0, 0]}>
              <Box size={[1.25, 0.12, BRANCH_LENGTH]} position={[0, -0.08, 0]} material={M.steel} />
              <mesh material={branchMaterials[i]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1.05, BRANCH_LENGTH]} />
              </mesh>
              {[-0.6, 0.6].map((dx) => (
                <Box key={dx} size={[0.06, 0.22, BRANCH_LENGTH]} position={[dx, 0.06, 0]} material={M.steel} />
              ))}
            </group>
            {LEG_STOPS.map((ratio) => {
              const leg = top.clone().lerp(bottom, ratio)
              return [-0.5, 0.5].map((o) => (
                <Box
                  key={`${ratio}-${o}`}
                  size={[0.1, leg.y - 0.08, 0.1]}
                  position={[leg.x + o, (leg.y - 0.08) / 2, leg.z]}
                  material={M.dark}
                />
              ))
            })}
          </group>
        )
      })}
    </group>
  )
}
