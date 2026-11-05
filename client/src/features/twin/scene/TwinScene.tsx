import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../sim/Center'
import { CAMERA_PRESETS } from './cameras'
import type { CameraPreset } from './cameras'
import { Branches } from './parts/Branches'
import { Conveyor } from './parts/Conveyor'
import { Docks } from './parts/Docks'
import { Floor } from './parts/Floor'
import { Forklifts } from './parts/Forklifts'
import { Labels } from './parts/Labels'
import { Lanes } from './parts/Lanes'
import { Parcels } from './parts/Parcels'
import { Wrappers } from './parts/Wrappers'

const GROUND = 0x0e131a
const INITIAL = CAMERA_PRESETS.all
const TWEEN_SECONDS = 0.9

interface Tween {
  t: number
  fromPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  toPosition: THREE.Vector3
  toTarget: THREE.Vector3
}

/** 프리셋이 바뀌면 카메라와 회전 중심을 함께 옮긴다 (ease-out cubic) */
function CameraRig({ preset }: { preset: CameraPreset }) {
  const camera = useThree((state) => state.camera)
  // makeDefault 로 등록한 OrbitControls. 여기서는 회전 중심(target)만 쓴다
  const controls = useThree((state) => state.controls) as unknown as { target: THREE.Vector3 } | null
  const tween = useRef<Tween | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!controls) return
    const target = CAMERA_PRESETS[preset]
    tween.current = {
      t: 0,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: new THREE.Vector3(...target.position),
      toTarget: new THREE.Vector3(...target.target),
    }
  }, [preset, camera, controls])

  useFrame((_, delta) => {
    const current = tween.current
    if (!current || !controls) return
    current.t = Math.min(1, current.t + Math.min(0.1, delta) / TWEEN_SECONDS)
    const e = 1 - Math.pow(1 - current.t, 3)
    camera.position.lerpVectors(current.fromPosition, current.toPosition, e)
    controls.target.lerpVectors(current.fromTarget, current.toTarget, e)
    if (current.t >= 1) tween.current = null
  })

  return null
}

interface TwinSceneProps {
  /** 선택한 센터의 살아 있는 시뮬레이션 상태. 매 프레임 직접 읽는다 */
  center: Center
  preset: CameraPreset
  /** WebGL 을 쓸 수 없을 때 대신 보여 줄 내용 */
  fallback: React.ReactNode
}

/**
 * 선택한 센터의 3D 현장 (React Three Fiber). 모든 센터는 계속 돌고, 3D 는 선택 센터만 그린다.
 * legacy·flat 은 프로토타입(three r128)과 같은 색감을 내려고 켠다: 색 관리 끔, 톤 매핑 없음.
 */
export default function TwinScene({ center, preset, fallback }: TwinSceneProps) {
  return (
    <Canvas
      // three r187 에서 PCFSoftShadowMap 이 빠져 PCF 를 직접 고른다
      shadows="percentage"
      legacy
      flat
      dpr={[1, 2]}
      gl={{ antialias: true }}
      camera={{ fov: 40, near: 0.1, far: 200, position: INITIAL.position }}
      fallback={fallback}
      aria-label="선택한 센터의 3D 현장 화면"
    >
      <color attach="background" args={[GROUND]} />
      <fog attach="fog" args={[GROUND, 48, 95]} />

      {/* r155 부터 조명 세기 단위가 바뀌어 프로토타입 값에 π 를 곱한다 */}
      <hemisphereLight args={[0xc7d8ff, 0x161b22, 0.6 * Math.PI]} />
      <directionalLight
        position={[-14, 28, 16]}
        intensity={0.95 * Math.PI}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
      />
      <pointLight color={0xffc477} intensity={0.5 * Math.PI} distance={18} decay={1} position={[0, 6, 3.4]} />

      <OrbitControls
        makeDefault
        target={INITIAL.target}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.46}
        minDistance={8}
        maxDistance={70}
      />
      <CameraRig preset={preset} />

      <Floor />
      <Conveyor center={center} />
      <Branches center={center} />
      <Lanes center={center} />
      <Wrappers center={center} />
      <Docks center={center} />
      <Forklifts center={center} />
      <Parcels center={center} />
      <Labels center={center} />
    </Canvas>
  )
}
