import { formatClock } from '../../../shared/utils/common/time'
import {
  BELT_END,
  BELT_SPEED,
  BELT_START,
  BRANCH_GAP,
  BRANCH_LENGTH,
  BRANCH_SPEED,
  DOCK_Z,
  JAM_BACKLOG,
  LANE_COUNT,
  LATE_ETA_SEC,
  LOW_LOAD_RATE,
  PALLET_CAPACITY,
  PALLET_Z,
  PALLETS_PER_TRUCK,
  PARCEL_POOL,
  SCAN_X,
  SPAWN_PER_LEVEL,
  WRAP_X,
  WRAP_Z,
  laneX,
} from './layout'
import type {
  CenterConfig,
  CenterKpi,
  Forklift,
  LaneDef,
  LaneState,
  LogEntry,
  LogLevel,
  Parcel,
  TruckState,
  TruckStatus,
  Wrapper,
} from './types'

const LOG_LIMIT = 12
const NO_READ_RATE = 0.008
const WRAP_SECONDS = 4
const FORK_SPEED = 4.2
/** 시뮬레이션 시작 시각 14:47:12 */
const START_CLOCK = 14 * 3600 + 47 * 60 + 12

/**
 * 센터 한 곳의 공정 시뮬레이션 (데이터만, 화면과 분리).
 * 레일 유입 → 스캔 → 분기 레일 → 파레트 → 집게차 → 래핑 → 도크 상차 → 간선 출발.
 * plc-sim(M1)이 생기면 같은 로직이 자바로 옮겨 가고, 화면은 서버가 보내는 상태를 그린다.
 */
export class Center {
  readonly cfg: CenterConfig
  readonly laneDefs: LaneDef[]

  running = true
  speed: number
  forkCount: number
  /** 시뮬레이션 시각 (자정부터 초) */
  t = START_CLOCK
  processed: number
  scanned: number
  noRead: number
  rejects: number
  recirc = 0
  departed: number
  /** 최근 60초의 초당 분류 수 */
  recent: number[] = []
  lanes: LaneState[]
  trucks: TruckState[]
  parcels: Parcel[] = []
  forks: Forklift[]
  wrappers: Wrapper[]
  /** 리젝트 케이지에 쌓인 박스 수 (화면 표시용) */
  rejectPile = 0
  scanFlash = 0
  log: LogEntry[] = []
  /** 로그가 바뀔 때마다 오른다. 화면은 이 값으로 다시 그릴지 정한다 */
  logRevision = 0

  /** 분기 레일마다 줄 선 박스 (앞이 0번) */
  private readonly queues: Parcel[][]
  private secAcc = Math.random()
  private spawnAcc = 0
  private secCount = 0

  constructor(cfg: CenterConfig) {
    this.cfg = cfg
    this.laneDefs = cfg.lanes.map(([code, name, weight]) => ({ code, name, weight }))
    this.speed = cfg.speed
    this.forkCount = cfg.forks
    this.processed = cfg.seed.processed
    this.scanned = cfg.seed.scanned
    this.noRead = cfg.seed.noRead
    this.rejects = cfg.seed.noRead
    this.departed = cfg.seed.departed

    const avg = SPAWN_PER_LEVEL * cfg.speed
    for (let r = 0; r < 60; r++) this.recent.push(Math.floor(avg) + (Math.random() < avg % 1 ? 1 : 0))

    this.lanes = this.laneDefs.map(() => ({
      boxes: Math.floor(Math.random() * 24), status: 'load', wait: 0, backlog: 0, claimed: false, jamLogged: false, recircLog: -99,
    }))
    this.trucks = this.laneDefs.map(() => ({
      load: 0.15 + Math.random() * 0.7, eta: 300 + Math.floor(Math.random() * 2200), phase: 'docked', p: 0, z: 0,
    }))
    for (let k = 0; k < PARCEL_POOL; k++) {
      this.parcels.push({ st: 'off', lane: 0, x: 0, s: 0, t: 0, read: null, recirc: false, halted: false, rotY: 0 })
    }
    this.queues = this.laneDefs.map(() => [])
    this.forks = [makeFork(-9, 0), makeFork(9, 1)]
    this.wrappers = [0, 1].map(() => ({ show: false, film: 0, spin: 0, roll: 0.5 }))

    this.say('info', `D1 ${this.laneDefs[0].name} · 간선 출발 (적재율 96%)`)
    this.say('info', `D2 ${this.laneDefs[1].name} · 파레트 상차 완료`)
  }

  /** 한 프레임 진행. 정지 중에도 화면 효과(스캔 빛)는 줄어든다 */
  update(raw: number) {
    const dt = this.running ? raw : 0
    if (this.running) {
      this.spawnAcc += dt * SPAWN_PER_LEVEL * this.speed
      while (this.spawnAcc >= 1) {
        this.spawn()
        this.spawnAcc -= 1
      }
      this.secAcc += dt
      while (this.secAcc >= 1) {
        this.tickSecond()
        this.secAcc -= 1
      }
    }
    this.updateParcels(dt)
    this.updateBranches(dt)
    this.forks.forEach((fork, i) => this.updateFork(fork, i, dt))
    this.updateTrucks(dt)
    this.scanFlash = Math.max(0, this.scanFlash - raw * 4)
  }

  truckStatus(truck: TruckState): TruckStatus {
    if (truck.phase === 'leaving') return { text: '출발', late: false }
    if (truck.phase === 'arriving') return { text: '진입 중', late: false }
    const late = truck.eta < LATE_ETA_SEC && truck.load < LOW_LOAD_RATE
    return { text: late ? '마감 임박' : truck.load >= LOW_LOAD_RATE ? '상차 마무리' : '상차 중', late }
  }

  kpi(): CenterKpi {
    const sum = this.recent.reduce((a, b) => a + b, 0)
    let jam = 0
    let wait = 0
    let late = 0
    this.lanes.forEach((lane) => {
      if (lane.backlog >= JAM_BACKLOG) jam++
      if (lane.status === 'wait') wait++
    })
    this.trucks.forEach((truck) => {
      if (this.truckStatus(truck).late) late++
    })
    const level = !this.running ? 'paused' : jam > 0 ? 'crit' : wait >= 2 || late > 0 ? 'warn' : 'ok'
    return {
      pph: Math.round((sum / this.recent.length) * 3600),
      readRate: ((this.scanned - this.noRead) / this.scanned) * 100,
      jam,
      wait,
      late,
      level,
    }
  }

  private say(lv: LogLevel, m: string) {
    this.log.unshift({ t: formatClock(this.t), lv, m })
    if (this.log.length > LOG_LIMIT) this.log.length = LOG_LIMIT
    this.logRevision++
  }

  private laneTag(i: number) {
    return `D${i + 1} ${this.laneDefs[i].name}`
  }

  private pickLane() {
    const x = Math.random()
    let acc = 0
    for (let i = 0; i < LANE_COUNT; i++) {
      acc += this.laneDefs[i].weight
      if (x < acc) return i
    }
    return LANE_COUNT - 1
  }

  private accepts(i: number) {
    const lane = this.lanes[i]
    return lane.status === 'load' && lane.boxes < PALLET_CAPACITY
  }

  /** 박스가 파레트에 올라갔다 (PARCEL_SORTED). 만재면 집게차 호출 (PALLET_FULL) */
  private arrive(i: number) {
    this.processed++
    this.secCount++
    const lane = this.lanes[i]
    lane.boxes++
    if (lane.boxes >= PALLET_CAPACITY) {
      lane.status = 'wait'
      lane.wait = 0
      this.say('info', `${this.laneDefs[i].code} 파레트 만재 · 집게차 호출`)
    }
  }

  private tickSecond() {
    this.t++
    this.recent.shift()
    this.recent.push(this.secCount)
    this.secCount = 0
    this.lanes.forEach((lane) => {
      if (lane.status === 'wait') lane.wait++
    })
    this.trucks.forEach((truck, i) => {
      if (truck.phase !== 'docked') return
      truck.eta--
      if (truck.load >= 0.999 || truck.eta <= 0) {
        this.departed++
        const pct = Math.round(truck.load * 100)
        if (pct < LOW_LOAD_RATE * 100) this.say('crit', `${this.laneTag(i)} · 적재율 ${pct}%로 출발`)
        else this.say('info', `${this.laneTag(i)} · 간선 출발 (적재율 ${pct}%)`)
        truck.phase = 'leaving'
        truck.p = 0
      } else if (truck.eta === LATE_ETA_SEC && truck.load < LOW_LOAD_RATE) {
        this.say('warn', `${this.laneTag(i)} · 출발 5분 전, 적재율 ${Math.round(truck.load * 100)}%`)
      }
    })
  }

  private spawn() {
    const parcel = this.parcels.find((p) => p.st === 'off')
    if (!parcel) return
    parcel.st = 'belt'
    parcel.lane = this.pickLane()
    parcel.x = BELT_START + 0.3
    parcel.read = null
    parcel.t = 0
    parcel.s = 0
    parcel.recirc = false
    parcel.halted = false
    parcel.rotY = (Math.random() - 0.5) * 0.4
  }

  private updateParcels(dt: number) {
    for (const p of this.parcels) {
      if (p.st === 'belt') {
        const px = p.x
        p.x += BELT_SPEED * dt
        if (p.read === null && px < SCAN_X && p.x >= SCAN_X) {
          this.scanned++
          this.scanFlash = 1
          p.read = Math.random() > NO_READ_RATE
          if (!p.read) {
            this.noRead++
            this.say('warn', 'NO READ · 송장 판독 실패 → 리젝트 슈트')
          }
        }
        const lx = laneX(p.lane)
        if (p.read && !p.recirc && px < lx && p.x >= lx) {
          const queue = this.queues[p.lane]
          if (queue.length === 0 || queue[queue.length - 1].s >= BRANCH_GAP) {
            p.st = 'branch'
            p.s = 0
            queue.push(p)
          } else {
            // 분기 레일 입구가 꽉 차 진입하지 못하고 메인 레일 끝까지 간다 (PARCEL_RECIRCULATED)
            p.recirc = true
            this.recirc++
            const lane = this.lanes[p.lane]
            if (this.t - lane.recircLog > 20) {
              lane.recircLog = this.t
              this.say('crit', `${this.laneDefs[p.lane].code} 분기 레일 만재 · 물량 재순환`)
            }
          }
        }
        if (p.st === 'belt' && (p.read === false || p.recirc) && p.x >= BELT_END) {
          p.st = 'reject'
          p.t = 0
        }
      } else if (p.st === 'reject') {
        p.t += dt / 0.7
        if (p.t >= 1) {
          p.st = 'off'
          this.rejects++
          this.rejectPile++
        }
      }
    }
  }

  /** 분기 레일: 앞 박스와 간격을 지키며 내려가고, 파레트가 받지 못하면 줄을 선다 */
  private updateBranches(dt: number) {
    for (let i = 0; i < LANE_COUNT; i++) {
      const queue = this.queues[i]
      const lane = this.lanes[i]
      while (queue.length && queue[0].s >= BRANCH_LENGTH - 0.001 && this.accepts(i)) {
        queue.shift()!.st = 'off'
        this.arrive(i)
      }
      let stopped = 0
      let chain = true
      for (let j = 0; j < queue.length; j++) {
        const p = queue[j]
        const limit = j === 0 ? BRANCH_LENGTH : queue[j - 1].s - BRANCH_GAP
        const next = Math.min(p.s + BRANCH_SPEED * dt, limit)
        if (dt > 0) p.halted = next <= p.s + 1e-4
        p.s = Math.max(p.s, next)
        if (chain && p.halted) stopped++
        else chain = false
      }
      lane.backlog = stopped
      if (stopped >= JAM_BACKLOG && !lane.jamLogged) {
        lane.jamLogged = true
        this.say('crit', `${this.laneDefs[i].code} 분류구 적체 · 분기 레일에 ${stopped}개 대기`)
      }
      if (stopped === 0) lane.jamLogged = false
    }
  }

  /** 경로를 따라 이동. 마지막 지점에 닿으면 true */
  private moveFork(fork: Forklift, dt: number) {
    if (!fork.path.length) return false
    const [tx, tz] = fork.path[0]
    const dx = tx - fork.x
    const dz = tz - fork.z
    const d = Math.hypot(dx, dz)
    const step = FORK_SPEED * dt
    if (d > 0.01) {
      const want = Math.atan2(dx, dz)
      const diff = Math.atan2(Math.sin(want - fork.yaw), Math.cos(want - fork.yaw))
      fork.yaw += diff * Math.min(1, dt * 9)
    }
    if (d <= step) {
      fork.x = tx
      fork.z = tz
      fork.path.shift()
      return fork.path.length === 0
    }
    fork.x += (dx / d) * step
    fork.z += (dz / d) * step
    return false
  }

  /** 집게차 한 대: 가장 오래 기다린 분류구 → 래핑 → 대기 → 도크 상차 → 복귀 */
  private updateFork(fork: Forklift, idx: number, dt: number) {
    const arrived = this.moveFork(fork, dt)
    if ((fork.phase === 'idle' || fork.phase === 'home') && idx < this.forkCount) {
      let best = -1
      this.lanes.forEach((lane, i) => {
        if (lane.status === 'wait' && !lane.claimed && (best < 0 || lane.wait > this.lanes[best].wait)) best = i
      })
      if (best >= 0) {
        this.lanes[best].claimed = true
        fork.lane = best
        fork.phase = 'toLane'
        fork.path = [[laneX(best), 1.9], [laneX(best), PALLET_Z + 1.45]]
        return
      }
    }
    if (!arrived && fork.phase !== 'wrapping' && fork.phase !== 'waitTruck') return

    const wx = WRAP_X[fork.wrap]
    const lx = laneX(fork.lane < 0 ? 0 : fork.lane)
    const wrapper = this.wrappers[fork.wrap]
    switch (fork.phase) {
      case 'toLane': {
        const lane = this.lanes[fork.lane]
        fork.carry = true
        fork.film = false
        lane.boxes = 0
        lane.status = 'load'
        lane.claimed = false
        lane.wait = 0
        fork.phase = 'toWrap'
        fork.path = [[lx, 1.9], [wx, 0.9], [wx, WRAP_Z - 1.45]]
        break
      }
      case 'toWrap':
        fork.carry = false
        wrapper.show = true
        wrapper.film = 0.01
        fork.phase = 'wrapping'
        fork.timer = 0
        break
      case 'wrapping': {
        fork.timer += dt
        const progress = Math.min(1, fork.timer / WRAP_SECONDS)
        wrapper.spin += dt * 3.2
        wrapper.film = Math.max(0.01, progress * 1.08)
        wrapper.roll = 0.4 + Math.abs(Math.sin(progress * Math.PI * 2)) * 0.8
        if (fork.timer >= WRAP_SECONDS) {
          wrapper.show = false
          wrapper.roll = 0.5
          fork.carry = true
          fork.film = true
          fork.phase = 'toStage'
          fork.path = [[wx, 5.0], [lx, 5.0]]
        }
        break
      }
      case 'toStage':
        fork.phase = 'waitTruck'
        break
      case 'waitTruck':
        if (this.trucks[fork.lane].phase === 'docked') {
          fork.phase = 'toDock'
          fork.path = [[lx, DOCK_Z - 1.6]]
        }
        break
      case 'toDock': {
        const truck = this.trucks[fork.lane]
        truck.load = Math.min(1, truck.load + 1 / PALLETS_PER_TRUCK)
        this.say('info', `${this.laneTag(fork.lane)} · 파레트 상차 완료`)
        fork.carry = false
        fork.phase = 'home'
        fork.path = [[lx, 5.0], fork.home]
        fork.lane = -1
        break
      }
      case 'home':
        fork.phase = 'idle'
        break
    }
  }

  /** 출발한 트럭은 멀어졌다가 빈 차로 다시 들어온다 */
  private updateTrucks(dt: number) {
    for (const truck of this.trucks) {
      if (truck.phase === 'leaving') {
        truck.p += dt / 3.2
        const e = Math.min(1, truck.p)
        truck.z = e * e * 34
        if (truck.p >= 1) {
          truck.load = 0
          truck.eta = 600 + Math.floor(Math.random() * 600)
          truck.phase = 'arriving'
          truck.p = 0
        }
      } else if (truck.phase === 'arriving') {
        truck.p += dt / 3.2
        const e = Math.min(1, truck.p)
        truck.z = (1 - e) * (1 - e) * 34
        if (truck.p >= 1) {
          truck.phase = 'docked'
          truck.z = 0
        }
      }
    }
  }
}

function makeFork(homeX: number, wrap: number): Forklift {
  return {
    x: homeX, z: 4.6, yaw: Math.PI, home: [homeX, 4.6], phase: 'idle', path: [], lane: -1, timer: 0, wrap, carry: false, film: false,
  }
}
