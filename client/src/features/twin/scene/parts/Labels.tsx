import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { Center } from '../../sim/Center'
import {
  BELT_END,
  BELT_Z,
  DOCK_Z,
  JAM_BACKLOG,
  LANE_COUNT,
  PALLET_CAPACITY,
  PALLET_Z,
  SCAN_X,
  WRAP_Z,
  laneX,
} from '../../sim/layout'
import { formatCountdown } from '../../../../shared/utils/common/time'

/** 글자가 바뀔 때만 DOM 을 고친다 (매 프레임 부르므로) */
function setText(el: HTMLElement | null, text: string) {
  if (el && el.textContent !== text) el.textContent = text
}

function setState(el: HTMLElement | null, state: string) {
  if (el && el.dataset.s !== state) el.dataset.s = state
}

/** 분류구 라벨: 적재율과 상태(목적지 · 집게차 대기 · 적체 +n). 파레트가 높아지면 같이 올라간다 */
function LaneTag({ center, index }: { center: Center; index: number }) {
  const anchor = useRef<THREE.Group>(null)
  const tag = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const status = useRef<HTMLElement>(null)

  useFrame(() => {
    const lane = center.lanes[index]
    const jam = lane.backlog >= JAM_BACKLOG
    setState(tag.current, jam ? 'jam' : lane.status)
    setText(pct.current, `${Math.round((lane.boxes / PALLET_CAPACITY) * 100)}%`)
    setText(status.current, jam ? `적체 +${lane.backlog}` : lane.status === 'wait' ? '집게차 대기' : center.laneDefs[index].name)
    anchor.current?.position.set(laneX(index), 0.14 + 0.31 * Math.ceil(lane.boxes / 9) + 0.7, PALLET_Z)
  })

  return (
    <group ref={anchor}>
      <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={tag} className="tag lane">
          <i />
          <b>{center.laneDefs[index].code}</b>
          <span ref={pct}>0%</span>
          <em ref={status} />
        </div>
      </Html>
    </group>
  )
}

/** 도크 라벨: 출발까지 남은 시간, 마감 임박이면 빨강 */
function DockTag({ center, index }: { center: Center; index: number }) {
  const anchor = useRef<THREE.Group>(null)
  const tag = useRef<HTMLDivElement>(null)
  const eta = useRef<HTMLElement>(null)

  useFrame(() => {
    const truck = center.trucks[index]
    const status = center.truckStatus(truck)
    setState(tag.current, status.late ? 'late' : '')
    setText(eta.current, truck.phase === 'docked' ? formatCountdown(truck.eta) : status.text)
    anchor.current?.position.set(laneX(index), 4.3, DOCK_Z + 1.2 + truck.z)
  })

  return (
    <group ref={anchor}>
      <Html zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={tag} className="tag dock">
          D{index + 1} · <b ref={eta}>00:00</b>
        </div>
      </Html>
    </group>
  )
}

const FIXED_TAGS: { text: string; position: [number, number, number] }[] = [
  { text: 'SCAN', position: [SCAN_X, 3.2, BELT_Z] },
  { text: 'REJECT', position: [BELT_END + 2.6, 1.9, BELT_Z] },
  { text: '래핑', position: [0, 2.0, WRAP_Z] },
]

/** 3D 위에 띄우는 라벨. 화면 좌표로 옮기는 일은 drei Html 이 한다 */
export function Labels({ center }: { center: Center }) {
  return (
    <group>
      {Array.from({ length: LANE_COUNT }, (_, i) => (
        <LaneTag key={`lane-${i}`} center={center} index={i} />
      ))}
      {Array.from({ length: LANE_COUNT }, (_, i) => (
        <DockTag key={`dock-${i}`} center={center} index={i} />
      ))}
      {FIXED_TAGS.map((item) => (
        <Html key={item.text} position={item.position} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="tag fixed">{item.text}</div>
        </Html>
      ))}
    </group>
  )
}
