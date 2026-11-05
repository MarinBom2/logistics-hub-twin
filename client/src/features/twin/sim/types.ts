/** 시뮬레이션 내부 상태와 화면용 스냅샷 타입. 스냅샷은 서버 실시간 채널(M4)의 응답 형태와 맞춘다 */

export type LaneCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type LogLevel = 'info' | 'warn' | 'crit'
/** 센터 상태: 정상 · 주의 · 적체 · 정지 */
export type HealthLevel = 'ok' | 'warn' | 'crit' | 'paused'

export interface CenterConfig {
  id: string
  name: string
  code: string
  region: string
  /** 레일 유입량 1~5 */
  speed: number
  /** 집게차 대수 1~2 */
  forks: number
  /** [분류구 코드, 목적지, 유입 비중] */
  lanes: [LaneCode, string, number][]
  seed: { processed: number; scanned: number; noRead: number; departed: number }
}

export interface LaneDef {
  code: LaneCode
  name: string
  weight: number
}

/** 분류구: 파레트 적재 수와 분기 레일 정체 */
export interface LaneState {
  boxes: number
  /** load = 적재중, wait = 만재 후 집게차 대기 */
  status: 'load' | 'wait'
  /** 집게차를 기다린 초 */
  wait: number
  /** 분기 레일 끝에서 멈춰 선 박스 수 */
  backlog: number
  claimed: boolean
  jamLogged: boolean
  recircLog: number
}

export type TruckPhase = 'docked' | 'leaving' | 'arriving'

export interface TruckState {
  /** 적재율 0~1 */
  load: number
  /** 출발까지 남은 초 */
  eta: number
  phase: TruckPhase
  /** 출발·진입 애니메이션 진행 0~1 */
  p: number
  /** 도크에서 떨어진 거리 */
  z: number
}

export interface Parcel {
  st: 'off' | 'belt' | 'branch' | 'reject'
  lane: number
  x: number
  /** 분기 레일 위 진행 거리 */
  s: number
  t: number
  /** 판독 결과. null 은 아직 스캔 전 */
  read: boolean | null
  recirc: boolean
  halted: boolean
  rotY: number
}

export type ForkPhase = 'idle' | 'toLane' | 'toWrap' | 'wrapping' | 'toStage' | 'waitTruck' | 'toDock' | 'home'

export interface Forklift {
  x: number
  z: number
  yaw: number
  home: [number, number]
  phase: ForkPhase
  path: [number, number][]
  lane: number
  timer: number
  /** 담당 래핑 스테이션 */
  wrap: number
  carry: boolean
  film: boolean
}

export interface Wrapper {
  show: boolean
  film: number
  spin: number
  roll: number
}

export interface LogEntry {
  /** 시뮬레이션 시각 HH:MM:SS */
  t: string
  lv: LogLevel
  m: string
}

export interface CenterKpi {
  /** 시간당 분류량 (최근 60초 × 60) */
  pph: number
  /** 송장 판독률 % */
  readRate: number
  jam: number
  wait: number
  late: number
  level: HealthLevel
}

export interface TruckStatus {
  text: string
  late: boolean
}

/** 네트워크 카드 한 장 */
export interface CenterSummary {
  id: string
  name: string
  code: string
  region: string
  level: HealthLevel
  pph: number
  readRate: number
  jam: number
  departed: number
}

export interface DockSnapshot {
  /** D1~D6 */
  code: string
  lane: string
  loadPct: number
  /** 접안 중일 때만 출발까지 남은 초 */
  etaSec: number | null
  status: string
  late: boolean
}

/** 선택한 센터의 패널 값 */
export interface CenterDetail extends CenterSummary {
  running: boolean
  speed: number
  forkCount: number
  /** 시뮬레이션 시각 (자정부터 초) */
  clockSec: number
  processed: number
  rejects: number
  recirc: number
  waitLanes: number
  docks: DockSnapshot[]
  log: LogEntry[]
}
